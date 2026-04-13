from fastapi import APIRouter, Header, HTTPException
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Optional
from app.db import supabase
from app.utils import require_user_id

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
def get_dashboard(x_user_id: Optional[str] = Header(None)):
    """
    Aggregates all data needed for the main dashboard in a single request
    (followups, recent clients, month metrics, receivables).
    """
    require_user_id(x_user_id)

    try:
        tz = ZoneInfo("America/Santo_Domingo")
        now = datetime.now(tz)
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()

        profile_res = supabase.table("profiles") \
            .select("first_name, email, monthly_goal") \
            .eq("id", x_user_id) \
            .single() \
            .execute()
        profile = profile_res.data or {}
        # Fallback chain: first_name → local part of email → generic label
        first_name = profile.get("first_name") or profile.get("email", "").split("@")[0] or "Consultora"

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
                "mensaje": f.get("mensaje"),  # reads stored message; may have been edited by consultant
                "client_name": client.get("name", "Cliente"),
                "client_phone": client.get("phone", ""),
                "is_overdue": f["scheduled_date"] < now_iso,  # ISO string comparison is safe here
            })

        recent_clients_res = supabase.table("clients") \
            .select("id, name, phone, skin_type, status") \
            .eq("user_id", x_user_id) \
            .order("created_at", desc=True) \
            .limit(5) \
            .execute()

        sales_res = supabase.table("sales") \
            .select("id, total, profit, status") \
            .eq("user_id", x_user_id) \
            .gte("created_at", start_of_month) \
            .execute()

        sales = sales_res.data or []
        ventas_mes = len(sales)
        revenue_mes = sum(float(s.get("total") or 0) for s in sales)
        profit_mes = sum(float(s.get("profit") or 0) for s in sales)

        all_clients_res = supabase.table("clients") \
            .select("id, status") \
            .eq("user_id", x_user_id) \
            .execute()
        all_clients = all_clients_res.data or []
        total_clients = len(all_clients)
        customers = sum(1 for c in all_clients if c["status"] == "customer")
        conv_pct = round((customers / total_clients) * 100) if total_clients > 0 else 0

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

    except HTTPException:
        raise
    except Exception as e:
        print("ERROR DASHBOARD:", e)
        raise HTTPException(status_code=500, detail="Error interno del servidor")
