import re
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from app.db import supabase

MEMBERSHIP_DAYS = 30

router = APIRouter(tags=["auth"])


@router.get("/auth/me")
def get_me(x_user_id: Optional[str] = Header(None)):
    """Returns the authenticated user's profile. Returns 403 if account is inactive."""
    if not x_user_id:
        raise HTTPException(status_code=400, detail="Missing x-user-id")

    res = supabase.table("profiles") \
        .select("role, is_active, must_change_password, activated_at, subscription_plan") \
        .eq("id", x_user_id) \
        .single() \
        .execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    profile = res.data

    if not profile.get("is_active", True):
        raise HTTPException(
            status_code=403,
            detail="Tu cuenta está desactivada. Comunícate con tu administrador."
        )

    # Auto-deactivate consultoras whose membership has expired
    if profile.get("role") == "consultora":
        activated_at = profile.get("activated_at")
        if activated_at:
            s = re.sub(r"\.(\d+)", lambda m: f".{(m.group(1) + '000000')[:6]}", activated_at.replace("Z", "+00:00"))
            activated = datetime.fromisoformat(s)
            if datetime.now(timezone.utc) > activated + timedelta(days=MEMBERSHIP_DAYS):
                supabase.table("profiles").update({"is_active": False}).eq("id", x_user_id).execute()
                raise HTTPException(
                    status_code=403,
                    detail="Tu membresía ha vencido. Comunícate con tu administrador para renovarla."
                )

    # Track last activity — fire-and-forget, never fail the request
    try:
        supabase.table("profiles") \
            .update({"last_seen_at": datetime.now(timezone.utc).isoformat()}) \
            .eq("id", x_user_id) \
            .execute()
    except Exception:
        pass

    return {
        "role": profile["role"],
        "must_change_password": profile.get("must_change_password", False),
        "subscription_plan": profile.get("subscription_plan", "free"),
    }
