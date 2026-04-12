from fastapi import APIRouter, Header, HTTPException, Request
from typing import Optional
from app.db import supabase
from app.services.followup_service import generate_message, categorize_followups

router = APIRouter(prefix="/followups", tags=["followups"])


@router.get("")
def get_followups(request: Request):
    try:
        user_id = request.headers.get("x-user-id")
        if not user_id:
            return {"error": "user_id requerido en header x-user-id"}

        # clients!inner excludes orphaned followups with no associated client row
        res = supabase.table("followups") \
            .select("id, client_id, sale_id, type, scheduled_date, status, mensaje, clients!inner(name, phone, status)") \
            .eq("user_id", user_id) \
            .eq("status", "pending") \
            .order("scheduled_date", desc=False) \
            .execute()

        items = []
        for f in res.data:
            client_data = f.get("clients") or {}
            client_status = client_data.get("status", "customer")
            items.append({
                "id": f["id"],
                "client_id": f["client_id"],
                "sale_id": f["sale_id"],
                "type": f["type"],
                "scheduled_date": f["scheduled_date"],
                "mensaje": f.get("mensaje") or generate_message(f["type"], client_data.get("name", ""), client_status),
                "client_name": client_data.get("name", "Cliente"),
                "client_status": client_status,
                "phone": client_data.get("phone", ""),
            })

        categorized = categorize_followups(items)
        return {
            **categorized,
            "total": sum(len(v) for v in categorized.values()),
        }

    except Exception as e:
        print("ERROR FOLLOWUPS:", e)
        return {"error": str(e)}


@router.post("/{followup_id}/complete")
def complete_followup(followup_id: str):
    """Called when the consultant sends the WhatsApp message manually."""
    res = supabase.table("followups") \
        .update({"status": "sent"}) \
        .eq("id", followup_id) \
        .execute()

    return {"message": "Seguimiento marcado como enviado", "data": res.data}


@router.patch("/{followup_id}")
def update_followup(followup_id: str, body: dict, x_user_id: Optional[str] = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="Missing x-user-id")

    existing = supabase.table("followups").select("id, client_id").eq("id", followup_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Seguimiento no encontrado")

    # Authorization via client ownership (no direct user_id on followup update path)
    client_id = existing.data[0]["client_id"]
    owner = supabase.table("clients").select("id").eq("id", client_id).eq("user_id", x_user_id).execute()
    if not owner.data:
        raise HTTPException(status_code=403, detail="No autorizado")

    # Whitelist to prevent unintended mutations of status or scheduled_date
    allowed_fields = {"mensaje"}
    payload = {k: v for k, v in body.items() if k in allowed_fields}
    if not payload:
        raise HTTPException(status_code=400, detail="No hay campos válidos para actualizar")

    res = supabase.table("followups").update(payload).eq("id", followup_id).execute()
    return res.data
