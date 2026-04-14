from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from collections import defaultdict
from app.db import supabase
from app.utils import require_user_id

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/followups")
def followup_metrics(request: Request):
    """Conversion rate: how many sent followups resulted in a sale (source_followup_id set)."""
    try:
        user_id = require_user_id(request.headers.get("x-user-id"))

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
        conversion_rate = round((total_converted / total_sent) * 100, 2) if total_sent > 0 else 0

        return {
            "sent_followups": total_sent,
            "converted_sales": total_converted,
            "conversion_rate": conversion_rate,
        }

    except HTTPException:
        raise
    except Exception as e:
        print("ERROR METRICS FOLLOWUPS:", e)
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.get("")
def get_metrics(request: Request, period: str = "month"):
    """
    Business metrics for the selected period. Accepted values: week, month, last_month, year.
    Each period is compared against its equivalent prior period for growth indicators.
    """
    try:
        user_id = require_user_id(request.headers.get("x-user-id"))

        tz = ZoneInfo("America/Santo_Domingo")
        now = datetime.now(tz)

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

        all_sales_res = supabase.table("sales") \
            .select("id, total, profit, payment_type, created_at, sale_date") \
            .eq("user_id", user_id) \
            .execute()

        def effective_date(s: dict) -> str:
            """sale_date (manual entry) takes precedence over created_at."""
            return s.get("sale_date") or s.get("created_at", "")[:10]

        start_date = range_start.date().isoformat()
        end_date = range_end.date().isoformat()
        prev_start_date = prev_range_start.date().isoformat()
        prev_end_date = prev_range_end.date().isoformat()

        all_sales = all_sales_res.data or []
        sales_res_data = [s for s in all_sales if start_date <= effective_date(s) <= end_date]
        prev_sales_res_data = [s for s in all_sales if prev_start_date <= effective_date(s) <= prev_end_date]

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

        sales = sales_res_data
        prev_sales = prev_sales_res_data
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

        # Revenue chart: monthly buckets for year view, daily buckets for all others.
        # sale_date (manual entry) takes precedence over created_at (system timestamp).
        chart_points = []
        if period == "year":
            monthly: dict = defaultdict(float)
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
            daily: dict = defaultdict(float)
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

        payment_map: dict = defaultdict(lambda: {"total": 0.0, "count": 0})
        for s in sales:
            pt = s.get("payment_type") or "otro"
            payment_map[pt]["total"] += float(s.get("total") or 0)
            payment_map[pt]["count"] += 1
        by_payment = [
            {"type": k, "total": round(v["total"], 2), "count": v["count"]}
            for k, v in payment_map.items()
        ]

        # Top 8 products by revenue for the period
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
                reverse=True,
            )[:8]

        followups = followups_res.data or []
        sent_count = len([f for f in followups if f["status"] == "sent"])
        pending_count = len([f for f in followups if f["status"] == "pending"])
        converted_count = converted_res.count or 0
        followup_rate = round((converted_count / sent_count * 100) if sent_count > 0 else 0, 1)

        # Skin type distribution is not filtered by period (reflects the full client base)
        skin_map: dict = defaultdict(int)
        for c in all_clients:
            st = c.get("skin_type") or "Sin especificar"
            skin_map[st] += 1
        skin_dist = sorted(
            [{"skin_type": k, "count": v} for k, v in skin_map.items()],
            key=lambda x: -x["count"],
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

    except HTTPException:
        raise
    except Exception as e:
        print("ERROR METRICS:", e)
        raise HTTPException(status_code=500, detail="Error interno del servidor")
