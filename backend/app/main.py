from fastapi import FastAPI, Request, Header, HTTPException
from app.db import supabase
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from collections import defaultdict

VALID_SKIN_TYPES = [
    "Seca",
    "Grasa",
    "Mixta",
    "Normal",
    "Sensible piel grasa",
    "Sensible piel seca",
    "Envejecimiento moderado",
    "Envejecimiento avanzado"
]

VALID_STATUS = ["prospect", "customer", "later"]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔹 MODELOS

class ClientRequest(BaseModel):
    name: str
    phone: str
    skin_type: str
    status: Optional[str] = "prospect"
    email: Optional[str] = None
    followup_enabled: Optional[bool] = True

class SaleItem(BaseModel):
    product_id: str
    quantity: int
    price: float

class SaleRequest(BaseModel):
    client_id: str
    total: float
    discount: float
    payment_type: str
    items: List[SaleItem]
    source_followup_id: Optional[str] = None
    notes: Optional[str] = None
    sale_date: Optional[str] = None
    initial_payment: Optional[float] = None

class PaymentRequest(BaseModel):
    amount: float
    payment_type: str
    payment_date: Optional[str] = None
    notes: Optional[str] = None

# 🔹 UTILIDADES

def get_first_name(full_name: str):
    if not full_name:
        return "hermosa"
    return full_name.split(" ")[0]

def generate_message(followup_type, client_name=""):
    first_name = get_first_name(client_name)

    if followup_type == "day2":
        return f"Hola {first_name} 💕, ¿cómo te ha ido con tu rutina?"
    elif followup_type == "week2":
        return f"Hola {first_name} ✨, ¿cómo has sentido tu piel?"
    elif followup_type == "month2":
        return f"Hola {first_name} 😍, ¿quieres reponer productos?"
    
    return f"Hola {first_name}, ¿cómo estás?"

# 🔹 ROOT

@app.get("/")
def root():
    return {"message": "API running"}

# 🔹 TEST DB

@app.get("/test-db")
def test_db():
    try:
        res = supabase.table("clients").select("*").limit(1).execute()
        return {"status": "ok", "data": res.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# 🔹 CLIENTS

@app.post("/clients")
def create_client(client: ClientRequest, x_user_id: Optional[str] = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="Missing x-user-id")

    try:
        if client.skin_type not in VALID_SKIN_TYPES:
            raise HTTPException(status_code=400, detail="Tipo de piel inválido")

        if client.status not in VALID_STATUS:
            raise HTTPException(status_code=400, detail="Status inválido")

        payload = client.dict()
        payload["user_id"] = x_user_id

        res = supabase.table("clients").insert(payload).execute()
        return res.data

    except Exception as e:
        return {"error": str(e)}

@app.get("/clients")
def get_clients(x_user_id: Optional[str] = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="Missing x-user-id")

    response = supabase.table("clients") \
        .select("*") \
        .eq("user_id", x_user_id) \
        .execute()

    return {
        "status": "success",
        "data": response.data
    }

@app.patch("/clients/{client_id}")
def update_client(client_id: str, client: ClientRequest, x_user_id: Optional[str] = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="Missing x-user-id")

    # Verify ownership
    existing = supabase.table("clients").select("id").eq("id", client_id).eq("user_id", x_user_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if client.skin_type not in VALID_SKIN_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de piel inválido")

    if client.status not in VALID_STATUS:
        raise HTTPException(status_code=400, detail="Status inválido")

    payload = client.dict()
    res = supabase.table("clients").update(payload).eq("id", client_id).eq("user_id", x_user_id).execute()
    return res.data

@app.delete("/clients/{client_id}")
def delete_client(client_id: str, x_user_id: Optional[str] = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="Missing x-user-id")

    # Verify ownership
    existing = supabase.table("clients").select("id").eq("id", client_id).eq("user_id", x_user_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    supabase.table("clients").delete().eq("id", client_id).eq("user_id", x_user_id).execute()
    return {"status": "success"}

# 🔹 PRODUCTS

@app.get("/products")
def get_products():
    res = supabase.table("products").select("id, name, price, category").order("name").execute()
    return {"status": "success", "data": res.data}

# 🔥 SALES

@app.post("/sales")
async def create_sale(sale: SaleRequest, request: Request):
    try:
        user_id = request.headers.get("x-user-id")

        if not user_id:
            raise HTTPException(status_code=400, detail="user_id requerido")

        client_res = supabase.table("clients") \
            .select("id, user_id, followup_enabled") \
            .eq("id", sale.client_id) \
            .execute()

        if not client_res.data:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

        client_data = client_res.data[0]

        if client_data["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Cliente no pertenece al usuario")

        # Ganancia = total cobrado − 50% del precio de catálogo (costo Mary Kay)
        items_subtotal = sum(item.price * item.quantity for item in sale.items)
        profit = round(sale.total - items_subtotal * 0.5, 2)

        # Pago inicial
        initial = round(float(sale.initial_payment or 0), 2)
        if initial > sale.total:
            initial = round(sale.total, 2)
        if initial >= sale.total and sale.total > 0:
            initial_status = "pagado"
        elif initial > 0:
            initial_status = "parcial"
        else:
            initial_status = "pendiente"

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
                "price": item.price
            }
            for item in sale.items
        ]

        supabase.table("sale_items").insert(items).execute()

        supabase.table("clients").update(
            {"status": "customer"}
        ).eq("id", sale.client_id).execute()

        if not client_data.get("followup_enabled", True):
            return {"venta": created_sale, "items": items, "followups": []}

        existing = supabase.table("followups") \
            .select("id") \
            .eq("sale_id", created_sale["id"]) \
            .execute()

        if existing.data:
            return {"venta": created_sale, "items": items, "followups": []}

        now = datetime.now(ZoneInfo("America/Santo_Domingo"))

        followups = [
            {
                "client_id": sale.client_id,
                "sale_id": created_sale["id"],
                "user_id": user_id,
                "type": "day2",
                "scheduled_date": (now + timedelta(days=2)).isoformat(),
                "status": "pending"
            },
            {
                "client_id": sale.client_id,
                "sale_id": created_sale["id"],
                "user_id": user_id,
                "type": "week2",
                "scheduled_date": (now + timedelta(days=14)).isoformat(),
                "status": "pending"
            },
            {
                "client_id": sale.client_id,
                "sale_id": created_sale["id"],
                "user_id": user_id,
                "type": "month2",
                "scheduled_date": (now + timedelta(days=60)).isoformat(),
                "status": "pending"
            }
        ]

        supabase.table("followups").insert(followups).execute()

        # Registrar pago inicial si existe
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

        return {
            "venta": created_sale,
            "items": items,
            "followups": followups
        }

    except Exception as e:
        print("ERROR BACKEND:", e)
        return {"error": str(e)}

# 🔹 PAGOS

@app.post("/sales/{sale_id}/payments")
async def add_payment(sale_id: str, payment: PaymentRequest, request: Request):
    try:
        user_id = request.headers.get("x-user-id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id requerido")

        if payment.payment_type not in ["efectivo", "transferencia"]:
            raise HTTPException(status_code=400, detail="Método de pago inválido")

        # Verificar que la venta pertenece al usuario
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

        # Insertar pago
        supabase.table("payments").insert({
            "sale_id": sale_id,
            "user_id": user_id,
            "amount": amount,
            "payment_type": payment.payment_type,
            "payment_date": payment_date,
            "notes": payment.notes or None,
        }).execute()

        # Actualizar amount_paid y status en sales
        new_paid = round(already_paid + amount, 2)
        if new_paid >= total:
            new_status = "pagado"
        elif new_paid > 0:
            new_status = "parcial"
        else:
            new_status = "pendiente"

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

    except Exception as e:
        print("ERROR PAYMENT:", e)
        return {"error": str(e)}


@app.get("/sales/{sale_id}/payments")
async def get_payments(sale_id: str, request: Request):
    try:
        user_id = request.headers.get("x-user-id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id requerido")

        res = supabase.table("payments") \
            .select("id, amount, payment_type, payment_date, notes, created_at") \
            .eq("sale_id", sale_id) \
            .eq("user_id", user_id) \
            .order("payment_date", desc=False) \
            .execute()

        return {"payments": res.data or []}

    except Exception as e:
        print("ERROR GET PAYMENTS:", e)
        return {"error": str(e)}


@app.get("/receivables")
async def get_receivables(request: Request):
    """Cuentas por cobrar: ventas con saldo pendiente."""
    try:
        user_id = request.headers.get("x-user-id")
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id requerido")

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
                    "sale_date": s.get("sale_date") or s.get("created_at", "")[:10],
                })

        return {
            "receivables": receivables,
            "total_owed": round(total_owed, 2),
            "count": len(receivables),
        }

    except Exception as e:
        print("ERROR RECEIVABLES:", e)
        return {"error": str(e)}


# 🔥 FOLLOWUPS

@app.get("/followups")
def get_followups(request: Request):
    try:
        user_id = request.headers.get("x-user-id")

        if not user_id:
            return {"error": "user_id requerido en header x-user-id"}

        tz = ZoneInfo("America/Santo_Domingo")
        now = datetime.now(tz)

        start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_today = now.replace(hour=23, minute=59, second=59, microsecond=999999)

        res = supabase.table("followups") \
            .select("id, client_id, sale_id, type, scheduled_date, status, clients!inner(name, phone)") \
            .eq("user_id", user_id) \
            .eq("status", "pending") \
            .order("scheduled_date", desc=False) \
            .execute()

        overdue = []
        today = []
        upcoming = []

        for f in res.data:
            scheduled = datetime.fromisoformat(f["scheduled_date"])

            client_data = f.get("clients") or {}
            client_name = client_data.get("name", "Cliente")
            phone = client_data.get("phone", "")

            item = {
                "id": f["id"],
                "client_id": f["client_id"],
                "sale_id": f["sale_id"],
                "type": f["type"],
                "scheduled_date": f["scheduled_date"],
                "mensaje": generate_message(f["type"], client_name),
                "client_name": client_name,
                "phone": phone
            }

            if scheduled < start_today:
                overdue.append(item)
            elif start_today <= scheduled <= end_today:
                today.append(item)
            else:
                upcoming.append(item)

        return {
            "overdue": overdue,
            "today": today,
            "upcoming": upcoming,
            "total": len(overdue) + len(today) + len(upcoming)
        }

    except Exception as e:
        print("ERROR FOLLOWUPS:", e)
        return {"error": str(e)}

# 🔹 COMPLETAR FOLLOWUP

@app.post("/followups/{followup_id}/complete")
def complete_followup(followup_id: str):
    res = supabase.table("followups") \
        .update({"status": "sent"}) \
        .eq("id", followup_id) \
        .execute()

    return {
        "message": "Seguimiento marcado como enviado",
        "data": res.data
    }

@app.patch("/followups/{followup_id}")
def update_followup(followup_id: str, body: dict, x_user_id: Optional[str] = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="Missing x-user-id")

    # Verify ownership via client
    existing = supabase.table("followups").select("id, client_id").eq("id", followup_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Seguimiento no encontrado")

    client_id = existing.data[0]["client_id"]
    owner = supabase.table("clients").select("id").eq("id", client_id).eq("user_id", x_user_id).execute()
    if not owner.data:
        raise HTTPException(status_code=403, detail="No autorizado")

    allowed_fields = {"mensaje"}
    payload = {k: v for k, v in body.items() if k in allowed_fields}
    if not payload:
        raise HTTPException(status_code=400, detail="No hay campos válidos para actualizar")

    res = supabase.table("followups").update(payload).eq("id", followup_id).execute()
    return res.data

@app.get("/metrics/followups")
def followup_metrics(request: Request):
    try:
        user_id = request.headers.get("x-user-id")

        if not user_id:
            return {"error": "user_id requerido"}

        sent = supabase.table("followups") \
            .select("id", count="exact") \
            .eq("user_id", user_id) \
            .eq("status", "sent") \
            .execute()

        total_sent = sent.count or 0

        converted = supabase.table("sales") \
            .select("id", count="exact") \
            .eq("user_id", user_id) \
            .not_.is_("source_followup_id", None) \
            .execute()

        total_converted = converted.count or 0

        conversion_rate = 0
        if total_sent > 0:
            conversion_rate = round((total_converted / total_sent) * 100, 2)

        return {
            "sent_followups": total_sent,
            "converted_sales": total_converted,
            "conversion_rate": conversion_rate
        }

    except Exception as e:
        print("ERROR METRICS:", e)
        return {"error": str(e)}


# 🔹 DASHBOARD

@app.get("/dashboard")
def get_dashboard(x_user_id: Optional[str] = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="Missing x-user-id")

    try:
        tz = ZoneInfo("America/Santo_Domingo")
        now = datetime.now(tz)
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()

        # Profile
        profile_res = supabase.table("profiles") \
            .select("first_name, email, monthly_goal") \
            .eq("id", x_user_id) \
            .single() \
            .execute()
        profile = profile_res.data or {}
        first_name = profile.get("first_name") or profile.get("email", "").split("@")[0] or "Consultora"

        # Pending followups with client info
        followups_res = supabase.table("followups") \
            .select("id, type, scheduled_date, status, mensaje, clients(name, phone)") \
            .eq("user_id", x_user_id) \
            .eq("status", "pending") \
            .order("scheduled_date", desc=False) \
            .limit(50) \
            .execute()

        now_iso = now.isoformat()
        followups = []
        for f in (followups_res.data or []):
            client = f.get("clients") or {}
            followups.append({
                "id": f["id"],
                "type": f["type"],
                "scheduled_date": f["scheduled_date"],
                "status": f["status"],
                "mensaje": f.get("mensaje"),
                "client_name": client.get("name", "Cliente"),
                "client_phone": client.get("phone", ""),
                "is_overdue": f["scheduled_date"] < now_iso,
            })

        # Recent 5 clients
        recent_clients_res = supabase.table("clients") \
            .select("id, name, phone, skin_type, status") \
            .eq("user_id", x_user_id) \
            .order("created_at", desc=True) \
            .limit(5) \
            .execute()

        # This month's sales
        sales_res = supabase.table("sales") \
            .select("id, total, profit, status") \
            .eq("user_id", x_user_id) \
            .gte("created_at", start_of_month) \
            .execute()

        sales = sales_res.data or []
        ventas_mes = len(sales)
        revenue_mes = sum(float(s.get("total") or 0) for s in sales)
        profit_mes = sum(float(s.get("profit") or 0) for s in sales)

        # Conversion rate
        all_clients_res = supabase.table("clients") \
            .select("id, status") \
            .eq("user_id", x_user_id) \
            .execute()
        all_clients = all_clients_res.data or []
        total_clients = len(all_clients)
        customers = sum(1 for c in all_clients if c["status"] == "customer")
        conv_pct = round((customers / total_clients) * 100) if total_clients > 0 else 0

        # Receivables
        receivables_res = supabase.table("sales") \
            .select("id, total, amount_paid") \
            .eq("user_id", x_user_id) \
            .in_("status", ["pendiente", "parcial"]) \
            .execute()
        receivables = receivables_res.data or []
        total_owed = sum(
            round(float(r.get("total") or 0) - float(r.get("amount_paid") or 0), 2)
            for r in receivables
        )

        return {
            "first_name": first_name,
            "monthly_goal": profile.get("monthly_goal"),
            "followups": followups,
            "recent_clients": recent_clients_res.data or [],
            "ventas_mes": ventas_mes,
            "revenue_mes": round(revenue_mes, 2),
            "profit_mes": round(profit_mes, 2),
            "conv_pct": conv_pct,
            "total_owed": round(total_owed, 2),
            "receivables_count": len(receivables),
        }

    except Exception as e:
        print("ERROR DASHBOARD:", e)
        raise HTTPException(status_code=500, detail=str(e))


# 🔹 MÉTRICAS GENERALES

@app.get("/metrics")
def get_metrics(request: Request, period: str = "month"):
    try:
        user_id = request.headers.get("x-user-id")
        if not user_id:
            return {"error": "user_id requerido"}

        tz = ZoneInfo("America/Santo_Domingo")
        now = datetime.now(tz)

        # Rangos de fechas según período
        if period == "week":
            range_start = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
            range_end = now
            prev_range_start = range_start - timedelta(days=7)
            prev_range_end = range_start
        elif period == "last_month":
            first_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            range_end = first_this_month - timedelta(microseconds=1)
            range_start = range_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            prev_range_end = range_start
            prev_range_start = (range_start - timedelta(days=1)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        elif period == "year":
            range_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            range_end = now
            prev_range_start = range_start.replace(year=range_start.year - 1)
            prev_range_end = range_start
        else:  # month (default)
            range_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            range_end = now
            prev_range_start = (range_start - timedelta(days=1)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            prev_range_end = range_start

        start_iso = range_start.isoformat()
        end_iso = range_end.isoformat()
        prev_start_iso = prev_range_start.isoformat()
        prev_end_iso = prev_range_end.isoformat()

        # Consultas
        sales_res = supabase.table("sales") \
            .select("id, total, profit, payment_type, created_at, sale_date") \
            .eq("user_id", user_id) \
            .gte("created_at", start_iso) \
            .lte("created_at", end_iso) \
            .execute()

        prev_sales_res = supabase.table("sales") \
            .select("id, total, profit") \
            .eq("user_id", user_id) \
            .gte("created_at", prev_start_iso) \
            .lte("created_at", prev_end_iso) \
            .execute()

        profile_res = supabase.table("profiles") \
            .select("monthly_goal") \
            .eq("id", user_id) \
            .single() \
            .execute()

        clients_res = supabase.table("clients") \
            .select("id, status, skin_type, created_at") \
            .eq("user_id", user_id) \
            .execute()

        new_clients_res = supabase.table("clients") \
            .select("id") \
            .eq("user_id", user_id) \
            .gte("created_at", start_iso) \
            .lte("created_at", end_iso) \
            .execute()

        prev_new_clients_res = supabase.table("clients") \
            .select("id") \
            .eq("user_id", user_id) \
            .gte("created_at", prev_start_iso) \
            .lte("created_at", prev_end_iso) \
            .execute()

        followups_res = supabase.table("followups") \
            .select("id, status") \
            .eq("user_id", user_id) \
            .execute()

        converted_res = supabase.table("sales") \
            .select("id", count="exact") \
            .eq("user_id", user_id) \
            .not_.is_("source_followup_id", None) \
            .execute()

        # Procesamiento
        sales = sales_res.data or []
        prev_sales = prev_sales_res.data or []
        all_clients = clients_res.data or []
        monthly_goal = (profile_res.data or {}).get("monthly_goal")

        revenue = sum(float(s.get("total") or 0) for s in sales)
        revenue_prev = sum(float(s.get("total") or 0) for s in prev_sales)
        profit_total = sum(float(s.get("profit") or 0) for s in sales)
        profit_prev = sum(float(s.get("profit") or 0) for s in prev_sales)
        sales_count = len(sales)
        sales_count_prev = len(prev_sales)

        customers_n = len([c for c in all_clients if c["status"] == "customer"])
        prospects_n = len([c for c in all_clients if c["status"] == "prospect"])
        later_n = len([c for c in all_clients if c["status"] == "later"])
        total_clients = len(all_clients)
        conv_rate = round((customers_n / total_clients * 100) if total_clients > 0 else 0, 1)

        # Gráfica de ingresos: diaria (semana/mes) o mensual (año)
        chart_points = []
        if period == "year":
            monthly = defaultdict(float)
            for s in sales:
                date_key = (s.get("sale_date") or s.get("created_at") or "")[:7]
                if date_key:
                    monthly[date_key] += float(s.get("total") or 0)
            cur = range_start.date().replace(day=1)
            end_d = range_end.date().replace(day=1)
            while cur <= end_d:
                k = cur.strftime("%Y-%m")
                chart_points.append({"date": k, "revenue": round(monthly.get(k, 0.0), 2)})
                if cur.month == 12:
                    cur = cur.replace(year=cur.year + 1, month=1)
                else:
                    cur = cur.replace(month=cur.month + 1)
        else:
            daily = defaultdict(float)
            for s in sales:
                date_key = (s.get("sale_date") or s.get("created_at") or "")[:10]
                if date_key:
                    daily[date_key] += float(s.get("total") or 0)
            cur = range_start.date()
            end_d = range_end.date()
            while cur <= end_d:
                d = cur.isoformat()
                chart_points.append({"date": d, "revenue": round(daily.get(d, 0.0), 2)})
                cur += timedelta(days=1)

        # Desglose por tipo de pago
        payment_map: dict = defaultdict(lambda: {"total": 0.0, "count": 0})
        for s in sales:
            pt = s.get("payment_type") or "otro"
            payment_map[pt]["total"] += float(s.get("total") or 0)
            payment_map[pt]["count"] += 1
        by_payment = [
            {"type": k, "total": round(v["total"], 2), "count": v["count"]}
            for k, v in payment_map.items()
        ]

        # Top productos del período
        top_products = []
        sale_ids = [s["id"] for s in sales]
        if sale_ids:
            items_res = supabase.table("sale_items") \
                .select("quantity, price, products(name)") \
                .in_("sale_id", sale_ids) \
                .execute()
            prod_map: dict = defaultdict(lambda: {"quantity": 0, "revenue": 0.0})
            for item in (items_res.data or []):
                name = (item.get("products") or {}).get("name") or "Desconocido"
                qty = int(item.get("quantity") or 0)
                price = float(item.get("price") or 0)
                prod_map[name]["quantity"] += qty
                prod_map[name]["revenue"] += price * qty
            top_products = sorted(
                [{"name": k, "quantity": v["quantity"], "revenue": round(v["revenue"], 2)}
                 for k, v in prod_map.items()],
                key=lambda x: x["revenue"],
                reverse=True
            )[:8]

        # Seguimientos
        followups = followups_res.data or []
        sent_count = len([f for f in followups if f["status"] == "sent"])
        pending_count = len([f for f in followups if f["status"] == "pending"])
        converted_count = converted_res.count or 0
        followup_rate = round((converted_count / sent_count * 100) if sent_count > 0 else 0, 1)

        # Distribución tipo de piel
        skin_map: dict = defaultdict(int)
        for c in all_clients:
            st = c.get("skin_type") or "Sin especificar"
            skin_map[st] += 1
        skin_dist = sorted(
            [{"skin_type": k, "count": v} for k, v in skin_map.items()],
            key=lambda x: -x["count"]
        )

        return {
            "summary": {
                "revenue": round(revenue, 2),
                "revenue_prev": round(revenue_prev, 2),
                "profit": round(profit_total, 2),
                "profit_prev": round(profit_prev, 2),
                "sales_count": sales_count,
                "sales_count_prev": sales_count_prev,
                "new_clients": len(new_clients_res.data or []),
                "new_clients_prev": len(prev_new_clients_res.data or []),
                "conversion_rate": conv_rate,
                "monthly_goal": float(monthly_goal) if monthly_goal is not None else None,
            },
            "revenue_chart": chart_points,
            "by_payment_type": by_payment,
            "top_products": top_products,
            "followup_stats": {
                "sent": sent_count,
                "pending": pending_count,
                "converted": converted_count,
                "rate": followup_rate,
            },
            "client_pipeline": {
                "prospects": prospects_n,
                "customers": customers_n,
                "later": later_n,
                "total": total_clients,
            },
            "skin_type_dist": skin_dist,
        }

    except Exception as e:
        print("ERROR METRICS:", e)
        return {"error": str(e)}