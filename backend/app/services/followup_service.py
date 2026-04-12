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


def generate_message(followup_type: str, client_name: str = "", client_status: str = "customer") -> str:
    """Returns the WhatsApp message template for the given followup type and client status."""
    name = get_first_name(client_name)

    if client_status == "prospect":
        if followup_type == "day2":
            return (
                f"Hola {name}, \n\n"
                "Me quedé pensando en tu piel después del facial 👀\n"
                "De verdad siento que con una rutina sencilla puedes ver un cambio muy bonito.\n"
                "Si en algún momento quieres empezar aunque sea con un producto, yo te ayudo 💖"
            )
        elif followup_type == "week2":
            return (
                f"Hola {name} Paso por aquí porque muchas veces dejamos esto para después 😅 "
                "pero de verdad tu piel tiene mucho potencial\n"
                "Si quieres, empezamos con algo básico y te voy guiando paso a paso 💕"
            )
        elif followup_type == "month2":
            return (
                f"Hola {name}  \n\n"
                "¿Cómo estás? Paso por aquí porque estoy ayudando a varias chicas a empezar a cuidar su piel desde cero\n"
                "Me acordé de ti porque sé que querías mejorarla✨\n"
                "Si aún te interesa, te puedo orientar sin compromiso"
            )
    else:
        if followup_type == "day2":
            return (
                f"Hola {name}, \n\n"
                "Paso por aquí para saber cómo te ha ido con los productos 👀✨\n"
                "Cuéntame, ¿cómo has sentido tu piel estos días?"
            )
        elif followup_type == "week2":
            return (
                f"Hola {name},\n\n"
                "Estaba pensando en ti porque ya tienes unos días usando tus productos 🤭\n"
                "¿Cómo vas con tu rutina? Si quieres, te ayudo a ajustarla para que veas mejores resultados"
            )
        elif followup_type == "month2":
            return (
                f"Hola {name},\n\n"
                "Paso por aquí porque tenía días pensando en ti 🤭\n"
                "¿Cómo te ha ido con tu piel y los productos?"
            )

    return f"Hola {name}, ¿cómo estás?"


def build_followup_schedule(client_id: str, user_id: str, sale_id: str = None) -> list:
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
