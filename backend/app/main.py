from fastapi import FastAPI, Request, Header, HTTPException
from app.db import supabase
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

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
def create_client(client: ClientRequest):
    try:
        if client.skin_type not in VALID_SKIN_TYPES:
            raise HTTPException(status_code=400, detail="Tipo de piel inválido")

        if client.status not in VALID_STATUS:
            raise HTTPException(status_code=400, detail="Status inválido")

        res = supabase.table("clients").insert(client.dict()).execute()
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

        sale_data = {
            "user_id": user_id,
            "client_id": sale.client_id,
            "total": sale.total,
            "discount": sale.discount,
            "payment_type": sale.payment_type,
            "status": "pendiente",
            "source_followup_id": sale.source_followup_id
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

        return {
            "venta": created_sale,
            "items": items,
            "followups": followups
        }

    except Exception as e:
        print("ERROR BACKEND:", e)
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