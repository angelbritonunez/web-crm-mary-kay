import re
import random
import string
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from pydantic import BaseModel
from app.db import supabase

MEMBERSHIP_DAYS = 30


def _days_remaining(activated_at: str | None, role: str) -> int | None:
    """Returns days left in membership for consultoras, None for other roles."""
    if role != "consultora" or not activated_at:
        return None
    s = re.sub(r"\.(\d+)", lambda m: f".{(m.group(1) + '000000')[:6]}", activated_at.replace("Z", "+00:00"))
    activated = datetime.fromisoformat(s)
    remaining = (activated + timedelta(days=MEMBERSHIP_DAYS) - datetime.now(timezone.utc)).days
    return max(remaining, 0)


def _deactivate_expired_consultoras():
    """Sets is_active=False for consultoras whose 30-day membership has expired."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=MEMBERSHIP_DAYS)).isoformat()
    supabase.table("profiles") \
        .update({"is_active": False}) \
        .eq("role", "consultora") \
        .eq("is_active", True) \
        .lt("activated_at", cutoff) \
        .execute()

router = APIRouter(prefix="/admin", tags=["admin"])

ROLES = ("consultora", "admin", "operador")


# ── Helpers ────────────────────────────────────────────────────────────────────

def get_caller_role(x_user_id: Optional[str]) -> str:
    """Returns the role of the caller, raises 403 if not admin/operador."""
    if not x_user_id:
        raise HTTPException(status_code=400, detail="Missing x-user-id")
    profile = supabase.table("profiles").select("role").eq("id", x_user_id).single().execute()
    role = profile.data.get("role") if profile.data else None
    if role not in ("admin", "operador"):
        raise HTTPException(status_code=403, detail="Acceso denegado")
    return role


def generate_password(length: int = 10) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(random.choices(chars, k=length))


# ── Schemas ────────────────────────────────────────────────────────────────────

class CreateUserRequest(BaseModel):
    email: str
    first_name: str
    last_name: Optional[str] = ""
    phone: Optional[str] = ""
    role: str = "consultora"


class PatchUserRequest(BaseModel):
    is_active: Optional[bool] = None
    notes: Optional[str] = None


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/users")
def list_users(x_user_id: Optional[str] = Header(None)):
    caller_role = get_caller_role(x_user_id)

    _deactivate_expired_consultoras()

    query = supabase.table("profiles").select(
        "id, email, first_name, last_name, role, is_active, notes, created_at, activated_at, last_seen_at"
    )
    # Operador only sees consultoras
    if caller_role == "operador":
        query = query.eq("role", "consultora")
    profiles_res = query.execute()
    profiles = profiles_res.data or []

    result = []
    for p in profiles:
        result.append({
            **p,
            "last_sign_in_at": p.get("last_seen_at"),
            "days_remaining":  _days_remaining(p.get("activated_at"), p.get("role", "")),
        })

    return {"status": "success", "data": result}


@router.post("/users")
def create_user(body: CreateUserRequest, x_user_id: Optional[str] = Header(None)):
    caller_role = get_caller_role(x_user_id)

    # Operador can only create consultoras
    if body.role not in ROLES:
        raise HTTPException(status_code=400, detail="Rol inválido")
    if caller_role == "operador" and body.role != "consultora":
        raise HTTPException(status_code=403, detail="El operador solo puede crear consultoras")

    password = generate_password()

    try:
        user_res = supabase.auth.admin.create_user({
            "email": body.email,
            "password": password,
            "email_confirm": True,
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creando usuario: {str(e)}")

    new_user = user_res.user
    if not new_user:
        raise HTTPException(status_code=500, detail="No se pudo crear el usuario")

    # Upsert profile — trigger may have already created a row on auth.users insert
    supabase.table("profiles").upsert({
        "id": str(new_user.id),
        "email": body.email,
        "first_name": body.first_name,
        "last_name": body.last_name,
        "phone": body.phone or "",
        "role": body.role,
        "is_active": True,
        "must_change_password": True,
    }).execute()

    return {
        "status": "success",
        "user_id": str(new_user.id),
        "email": body.email,
        "temp_password": password,
    }


@router.patch("/users/{user_id}")
def patch_user(user_id: str, body: PatchUserRequest, x_user_id: Optional[str] = Header(None)):
    get_caller_role(x_user_id)  # admin or operador

    payload = {}
    if body.is_active is not None:
        payload["is_active"] = body.is_active
        if body.is_active:
            # Check if this is a consultora to reset the membership counter
            target = supabase.table("profiles").select("role").eq("id", user_id).single().execute()
            if target.data and target.data.get("role") == "consultora":
                payload["activated_at"] = datetime.now(timezone.utc).isoformat()
    if body.notes is not None:
        payload["notes"] = body.notes

    if not payload:
        raise HTTPException(status_code=400, detail="Nada que actualizar")

    supabase.table("profiles").update(payload).eq("id", user_id).execute()
    return {"status": "success"}


@router.delete("/users/{user_id}")
def delete_user(user_id: str, x_user_id: Optional[str] = Header(None)):
    caller_role = get_caller_role(x_user_id)

    if caller_role != "admin":
        raise HTTPException(status_code=403, detail="Solo el admin puede eliminar usuarios")

    # Prevent self-deletion
    if user_id == x_user_id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")

    # Only allow deleting consultoras and operadores
    target = supabase.table("profiles").select("role").eq("id", user_id).single().execute()
    if not target.data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if target.data.get("role") == "admin":
        raise HTTPException(status_code=403, detail="No se puede eliminar un admin")

    try:
        supabase.auth.admin.delete_user(user_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error eliminando usuario: {str(e)}")

    return {"status": "success"}


@router.post("/users/{user_id}/reset-password")
def reset_password(user_id: str, x_user_id: Optional[str] = Header(None)):
    get_caller_role(x_user_id)  # admin or operador

    new_password = generate_password()

    try:
        supabase.auth.admin.update_user_by_id(user_id, {"password": new_password})
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reseteando contraseña: {str(e)}")

    return {"status": "success", "temp_password": new_password}


@router.get("/dashboard")
def admin_dashboard(x_user_id: Optional[str] = Header(None)):
    caller_role = get_caller_role(x_user_id)
    if caller_role != "admin":
        raise HTTPException(status_code=403, detail="Solo el admin puede ver este dashboard")

    _deactivate_expired_consultoras()

    tz = ZoneInfo("America/Santo_Domingo")
    now = datetime.now(tz)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()

    # ── 1. Platform stats ─────────────────────────────────────────────────────
    profiles_res = supabase.table("profiles").select(
        "id, first_name, last_name, email, role, is_active, activated_at, last_seen_at"
    ).execute()
    profiles = profiles_res.data or []

    consultoras = [p for p in profiles if p["role"] == "consultora"]
    total_users = len(consultoras)
    active_users = len([p for p in consultoras if p["is_active"]])
    inactive_users = total_users - active_users

    expiring_soon = []
    for p in consultoras:
        if not p["is_active"]:
            continue
        days = _days_remaining(p.get("activated_at"), p.get("role", ""))
        if days is not None and days <= 7:
            name = f"{p.get('first_name') or ''} {p.get('last_name') or ''}".strip() or p["email"]
            expiring_soon.append({"id": p["id"], "name": name, "days_remaining": days})

    # ── 2. This month activity (all consultoras) ──────────────────────────────
    sales_month_res = supabase.table("sales").select("id, total, user_id, created_at, sale_date").execute()
    all_sales = sales_month_res.data or []

    def effective_date(s: dict) -> str:
        return (s.get("sale_date") or s.get("created_at") or "")[:10]

    start_date = now.replace(day=1).date().isoformat()
    end_date = now.date().isoformat()
    sales_month = [s for s in all_sales if start_date <= effective_date(s) <= end_date]

    sales_count = len(sales_month)
    revenue_month = sum(float(s.get("total") or 0) for s in sales_month)

    clients_month_res = supabase.table("clients").select("id", count="exact").gte("created_at", start_of_month).execute()
    new_clients = clients_month_res.count or 0

    followups_res = supabase.table("followups").select("id, status").execute()
    followups = followups_res.data or []
    followups_sent = len([f for f in followups if f["status"] == "sent"])
    followups_pending = len([f for f in followups if f["status"] == "pending"])

    # ── 3. Monthly trend (last 6 months) ──────────────────────────────────────
    first_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    six_months_ago = first_this_month
    for _ in range(5):
        prev = six_months_ago - timedelta(days=1)
        six_months_ago = prev.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    monthly_map: dict = defaultdict(float)
    for s in all_sales:
        date_key = effective_date(s)[:7]
        if date_key >= six_months_ago.strftime("%Y-%m"):
            monthly_map[date_key] += float(s.get("total") or 0)

    monthly_trend = []
    cur = six_months_ago.date().replace(day=1)
    end_d = now.date().replace(day=1)
    while cur <= end_d:
        k = cur.strftime("%Y-%m")
        monthly_trend.append({"month": k, "revenue": round(monthly_map.get(k, 0.0), 2)})
        if cur.month == 12:
            cur = cur.replace(year=cur.year + 1, month=1)
        else:
            cur = cur.replace(month=cur.month + 1)

    # ── 4. Per-consultora breakdown ───────────────────────────────────────────

    sales_per_user: dict = defaultdict(lambda: {"count": 0, "revenue": 0.0})
    for s in sales_month:
        uid = s.get("user_id")
        if uid:
            sales_per_user[uid]["count"] += 1
            sales_per_user[uid]["revenue"] += float(s.get("total") or 0)

    all_clients_res = supabase.table("clients").select("user_id, status").execute()
    customers_per_user: dict = defaultdict(int)
    for c in (all_clients_res.data or []):
        if c.get("status") == "customer":
            customers_per_user[c["user_id"]] += 1

    consultoras_breakdown = []
    for p in consultoras:
        uid = p["id"]
        name = f"{p.get('first_name') or ''} {p.get('last_name') or ''}".strip() or p["email"]
        s = sales_per_user.get(uid, {"count": 0, "revenue": 0.0})
        consultoras_breakdown.append({
            "id": uid,
            "name": name,
            "email": p["email"],
            "is_active": p["is_active"],
            "sales_count": s["count"],
            "revenue": round(s["revenue"], 2),
            "total_customers": customers_per_user.get(uid, 0),
            "last_sign_in": p.get("last_seen_at"),
            "days_remaining": _days_remaining(p.get("activated_at"), p.get("role", "")),
        })
    consultoras_breakdown.sort(key=lambda x: x["revenue"], reverse=True)

    return {
        "platform": {
            "total_users": total_users,
            "active": active_users,
            "inactive": inactive_users,
            "expiring_soon": expiring_soon,
        },
        "this_month": {
            "sales_count": sales_count,
            "revenue": round(revenue_month, 2),
            "new_clients": new_clients,
            "followups_sent": followups_sent,
            "followups_pending": followups_pending,
        },
        "monthly_trend": monthly_trend,
        "consultoras": consultoras_breakdown,
    }
