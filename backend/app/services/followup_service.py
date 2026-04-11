from datetime import datetime, timedelta
from zoneinfo import ZoneInfo


def get_first_name(full_name: str) -> str:
    if not full_name:
        return "hermosa"
    return full_name.split(" ")[0]


def generate_message(followup_type: str, client_name: str = "") -> str:
    first_name = get_first_name(client_name)

    if followup_type == "day2":
        return f"Hola {first_name} 💕, ¿cómo te ha ido con tu rutina?"
    elif followup_type == "week2":
        return f"Hola {first_name} ✨, ¿cómo has sentido tu piel?"
    elif followup_type == "month2":
        return f"Hola {first_name} 😍, ¿quieres reponer productos?"

    return f"Hola {first_name}, ¿cómo estás?"


def build_followup_schedule(client_id: str, sale_id: str, user_id: str) -> list:
    now = datetime.now(ZoneInfo("America/Santo_Domingo"))

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
    tz = ZoneInfo("America/Santo_Domingo")
    now = datetime.now(tz)
    start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_today = now.replace(hour=23, minute=59, second=59, microsecond=999999)

    overdue = []
    today = []
    upcoming = []

    for f in followups:
        scheduled = datetime.fromisoformat(f["scheduled_date"])
        if scheduled < start_today:
            overdue.append(f)
        elif start_today <= scheduled <= end_today:
            today.append(f)
        else:
            upcoming.append(f)

    return {"overdue": overdue, "today": today, "upcoming": upcoming}
