import re
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

TZ_RD = ZoneInfo("America/Santo_Domingo")  # UTC-4, no daylight saving


def _parse_dt(s: str) -> datetime:
    """Parse Supabase ISO timestamps robustly (handles Z suffix and non-6-digit fractional seconds)."""
    s = s.replace("Z", "+00:00")
    # Normalize fractional seconds to exactly 6 digits (Python 3.10 fromisoformat is strict)
    s = re.sub(r"\.(\d+)", lambda m: f".{(m.group(1) + '000000')[:6]}", s)
    return datetime.fromisoformat(s)


def get_first_name(full_name: str) -> str:
    if not full_name:
        return "hermosa"  # fallback when client has no name on record
    return full_name.split(" ")[0]


def generate_message(followup_type: str, client_name: str = "") -> str:
    """Returns the WhatsApp message template for the given followup type (day2 / week2 / month2)."""
    first_name = get_first_name(client_name)

    if followup_type == "day2":
        return f"Hola {first_name} 💕, ¿cómo te ha ido con tu rutina?"
    elif followup_type == "week2":
        return f"Hola {first_name} ✨, ¿cómo has sentido tu piel?"
    elif followup_type == "month2":
        return f"Hola {first_name} 😍, ¿quieres reponer productos?"

    return f"Hola {first_name}, ¿cómo estás?"


def build_followup_schedule(client_id: str, sale_id: str, user_id: str) -> list:
    """Generates the three followups of the 2+2+2 cycle: 2 days, 2 weeks, 2 months after sale."""
    now = datetime.now(TZ_RD)

    return [
        {
            "client_id": client_id,
            "sale_id": sale_id,
            "user_id": user_id,
            "type": "day2",
            "scheduled_date": (now + timedelta(days=2)).isoformat(),
            "status": "pending",
        },
        {
            "client_id": client_id,
            "sale_id": sale_id,
            "user_id": user_id,
            "type": "week2",
            "scheduled_date": (now + timedelta(days=14)).isoformat(),
            "status": "pending",
        },
        {
            "client_id": client_id,
            "sale_id": sale_id,
            "user_id": user_id,
            "type": "month2",
            "scheduled_date": (now + timedelta(days=60)).isoformat(),
            "status": "pending",
        },
    ]


def categorize_followups(followups: list) -> dict:
    """Splits followups into overdue, today, and upcoming buckets relative to current RD time."""
    now = datetime.now(TZ_RD)
    start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_today = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    overdue, today, upcoming = [], [], []

    for f in followups:
        scheduled = _parse_dt(f["scheduled_date"])
        if scheduled < start_today:
            overdue.append(f)
        elif start_today <= scheduled <= end_today:
            today.append(f)
        else:
            upcoming.append(f)

    return {"overdue": overdue, "today": today, "upcoming": upcoming}
