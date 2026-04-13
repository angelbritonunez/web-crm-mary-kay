from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from app.db import supabase
from app.schemas.clients import ClientRequest, VALID_SKIN_TYPES, VALID_STATUS
from app.services.followup_service import build_followup_schedule
from app.utils import require_user_id

router = APIRouter(prefix="/clients", tags=["clients"])


@router.post("")
def create_client(client: ClientRequest, x_user_id: Optional[str] = Header(None)):
    require_user_id(x_user_id)

    if client.skin_type not in VALID_SKIN_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de piel inválido")

    if client.status not in VALID_STATUS:
        raise HTTPException(status_code=400, detail="Status inválido")

    try:
        payload = client.dict()
        payload["user_id"] = x_user_id
        res = supabase.table("clients").insert(payload).execute()
        created = res.data[0] if res.data else None

        # Prospects with followup_enabled get their own 2+2+2 cycle (no sale_id)
        if created and client.status == "prospect" and client.followup_enabled:
            followups = build_followup_schedule(created["id"], x_user_id)
            supabase.table("followups").insert(followups).execute()

        return res.data
    except HTTPException:
        raise
    except Exception as e:
        print("ERROR CLIENTS:", e)
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.get("")
def get_clients(x_user_id: Optional[str] = Header(None)):
    require_user_id(x_user_id)

    response = supabase.table("clients") \
        .select("*") \
        .eq("user_id", x_user_id) \
        .execute()

    return {"status": "success", "data": response.data}


@router.patch("/{client_id}")
def update_client(client_id: str, client: ClientRequest, x_user_id: Optional[str] = Header(None)):
    require_user_id(x_user_id)

    # Ownership check: double .eq on user_id acts as authorization guard
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


@router.delete("/{client_id}")
def delete_client(client_id: str, x_user_id: Optional[str] = Header(None)):
    require_user_id(x_user_id)

    existing = supabase.table("clients").select("id").eq("id", client_id).eq("user_id", x_user_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    supabase.table("clients").delete().eq("id", client_id).eq("user_id", x_user_id).execute()
    return {"status": "success"}
