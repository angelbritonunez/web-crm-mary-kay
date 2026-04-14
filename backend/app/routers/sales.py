from fastapi import APIRouter, Request, HTTPException
from datetime import datetime
from zoneinfo import ZoneInfo
from app.db import supabase
from app.schemas.sales import SaleRequest, PaymentRequest
from app.services.sale_service import calculate_profit, determine_payment_status
from app.services.followup_service import build_followup_schedule
from app.utils import require_user_id

router = APIRouter(tags=["sales"])


@router.post("/sales")
async def create_sale(sale: SaleRequest, request: Request):
    try:
        user_id = require_user_id(request.headers.get("x-user-id"))

        client_res = supabase.table("clients") \
            .select("id, user_id, followup_enabled") \
            .eq("id", sale.client_id) \
            .execute()

        if not client_res.data:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

        client_data = client_res.data[0]
        if client_data["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Cliente no pertenece al usuario")

        profit = calculate_profit(sale.total, sale.items)

        # Cap initial payment to the total in case of data entry error
        initial = round(float(sale.initial_payment or 0), 2)
        if initial > sale.total:
            initial = round(sale.total, 2)
        initial_status = determine_payment_status(sale.total, initial)

        sale_data = {
            "user_id": user_id,
            "client_id": sale.client_id,
            "total": sale.total,
            "discount": sale.discount,
            "payment_type": sale.payment_type,
            "status": initial_status,
            "amount_paid": initial,
            "source_followup_id": sale.source_followup_id,
            "notes": sale.notes or None,
            "sale_date": sale.sale_date or None,
            "profit": profit,
        }

        sale_res = supabase.table("sales").insert(sale_data).execute()
        if not sale_res.data:
            raise HTTPException(status_code=500, detail="Error creando la venta")

        created_sale = sale_res.data[0]

        # Mark the originating followup as sent so it leaves the pending queue
        if sale.source_followup_id:
            supabase.table("followups") \
                .update({"status": "sent"}) \
                .eq("id", sale.source_followup_id) \
                .execute()

        items = [
            {
                "sale_id": created_sale["id"],
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price": item.price,
            }
            for item in sale.items
        ]
        supabase.table("sale_items").insert(items).execute()

        # Any recorded sale transitions the client to customer, regardless of prior status
        supabase.table("clients").update({"status": "customer"}).eq("id", sale.client_id).execute()

        if not client_data.get("followup_enabled", True):
            return {"venta": created_sale, "items": items, "followups": []}

        # Idempotency guard: prevents duplicate followups if the endpoint is called twice
        existing = supabase.table("followups").select("id").eq("sale_id", created_sale["id"]).execute()
        if existing.data:
            return {"venta": created_sale, "items": items, "followups": []}

        # Cancel pending prospect followups (no sale_id) before starting the customer cycle
        supabase.table("followups") \
            .update({"status": "cancelled"}) \
            .eq("client_id", sale.client_id) \
            .eq("status", "pending") \
            .is_("sale_id", "null") \
            .execute()

        followups = build_followup_schedule(sale.client_id, user_id, created_sale["id"])
        supabase.table("followups").insert(followups).execute()

        if initial > 0:
            tz = ZoneInfo("America/Santo_Domingo")
            supabase.table("payments").insert({
                "sale_id": created_sale["id"],
                "user_id": user_id,
                "amount": initial,
                "payment_type": sale.payment_type,
                "payment_date": sale.sale_date or datetime.now(tz).date().isoformat(),
                "notes": "Pago inicial",
            }).execute()

        return {"venta": created_sale, "items": items, "followups": followups}

    except HTTPException:
        raise
    except Exception as e:
        print("ERROR SALES:", e)
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.post("/sales/{sale_id}/payments")
async def add_payment(sale_id: str, payment: PaymentRequest, request: Request):
    """Records a partial or full payment. Amount is capped at the remaining balance."""
    try:
        user_id = require_user_id(request.headers.get("x-user-id"))

        if payment.payment_type not in ["efectivo", "transferencia"]:
            raise HTTPException(status_code=400, detail="Método de pago inválido")

        sale_res = supabase.table("sales") \
            .select("id, total, amount_paid, user_id") \
            .eq("id", sale_id) \
            .single() \
            .execute()

        if not sale_res.data:
            raise HTTPException(status_code=404, detail="Venta no encontrada")

        sale_data = sale_res.data
        if sale_data["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Venta no pertenece al usuario")

        total = float(sale_data["total"] or 0)
        already_paid = float(sale_data["amount_paid"] or 0)
        remaining = round(total - already_paid, 2)

        if remaining <= 0:
            return {"error": "Esta venta ya está completamente pagada"}

        amount = min(round(float(payment.amount), 2), remaining)

        tz = ZoneInfo("America/Santo_Domingo")
        payment_date = payment.payment_date or datetime.now(tz).date().isoformat()

        supabase.table("payments").insert({
            "sale_id": sale_id,
            "user_id": user_id,
            "amount": amount,
            "payment_type": payment.payment_type,
            "payment_date": payment_date,
            "notes": payment.notes or None,
        }).execute()

        new_paid = round(already_paid + amount, 2)
        new_status = determine_payment_status(total, new_paid)

        supabase.table("sales") \
            .update({"amount_paid": new_paid, "status": new_status}) \
            .eq("id", sale_id) \
            .execute()

        return {
            "message": "Abono registrado",
            "amount": amount,
            "new_status": new_status,
            "amount_paid": new_paid,
            "balance": round(total - new_paid, 2),
        }

    except HTTPException:
        raise
    except Exception as e:
        print("ERROR PAYMENT:", e)
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.get("/sales/{sale_id}/payments")
async def get_payments(sale_id: str, request: Request):
    try:
        user_id = require_user_id(request.headers.get("x-user-id"))

        res = supabase.table("payments") \
            .select("id, amount, payment_type, payment_date, notes, created_at") \
            .eq("sale_id", sale_id) \
            .eq("user_id", user_id) \
            .order("payment_date", desc=False) \
            .execute()

        return {"payments": res.data or []}

    except HTTPException:
        raise
    except Exception as e:
        print("ERROR GET PAYMENTS:", e)
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.delete("/sales/{sale_id}")
async def delete_sale(sale_id: str, request: Request):
    try:
        user_id = require_user_id(request.headers.get("x-user-id"))

        sale_res = supabase.table("sales") \
            .select("id, client_id, user_id") \
            .eq("id", sale_id) \
            .single() \
            .execute()

        if not sale_res.data:
            raise HTTPException(status_code=404, detail="Venta no encontrada")
        if sale_res.data["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Venta no pertenece al usuario")

        client_id = sale_res.data["client_id"]

        supabase.table("payments").delete().eq("sale_id", sale_id).execute()
        supabase.table("followups").delete().eq("sale_id", sale_id).execute()
        supabase.table("sale_items").delete().eq("sale_id", sale_id).execute()
        supabase.table("sales").delete().eq("id", sale_id).execute()

        # Revert client to prospect if they have no remaining sales
        remaining = supabase.table("sales") \
            .select("id") \
            .eq("client_id", client_id) \
            .execute()
        if not remaining.data:
            supabase.table("clients") \
                .update({"status": "prospect"}) \
                .eq("id", client_id) \
                .execute()

        return {"message": "Venta eliminada"}

    except HTTPException:
        raise
    except Exception as e:
        print("ERROR DELETE SALE:", e)
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.get("/receivables")
async def get_receivables(request: Request):
    """Returns all sales with an outstanding balance (status pendiente or parcial)."""
    try:
        user_id = require_user_id(request.headers.get("x-user-id"))

        res = supabase.table("sales") \
            .select("id, total, amount_paid, status, payment_type, sale_date, created_at, clients(name, phone)") \
            .eq("user_id", user_id) \
            .in_("status", ["pendiente", "parcial"]) \
            .order("created_at", desc=False) \
            .execute()

        receivables = []
        total_owed = 0.0

        for s in (res.data or []):
            total = float(s.get("total") or 0)
            paid = float(s.get("amount_paid") or 0)
            balance = round(total - paid, 2)
            if balance > 0:
                total_owed += balance
                receivables.append({
                    "sale_id": s["id"],
                    "client_name": (s.get("clients") or {}).get("name", "Cliente"),
                    "client_phone": (s.get("clients") or {}).get("phone", ""),
                    "total": total,
                    "amount_paid": paid,
                    "balance": balance,
                    "status": s.get("status"),
                    # Prefer sale_date (manual); fall back to first 10 chars of created_at (YYYY-MM-DD)
                    "sale_date": s.get("sale_date") or s.get("created_at", "")[:10],
                })

        return {
            "receivables": receivables,
            "total_owed": round(total_owed, 2),
            "count": len(receivables),
        }

    except HTTPException:
        raise
    except Exception as e:
        print("ERROR RECEIVABLES:", e)
        raise HTTPException(status_code=500, detail="Error interno del servidor")
