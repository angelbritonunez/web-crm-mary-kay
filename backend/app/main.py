from fastapi import FastAPI, Request
from app.db import supabase
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

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
        res = supabase.table("clients").insert(client.dict()).execute()
        return res.data
    except Exception as e:
        return {"error": str(e)}

# 🔥 SALES

@app.post("/sales")
async def create_sale(sale: SaleRequest, request: Request):
    try:
        user_id = request.headers.get("x-user-id")

        if not user_id:
            return {"error": "user_id requerido en header x-user-id"}

        # 🔹 1. CREAR VENTA
        sale_data = {
            "user_id": user_id,
            "client_id": sale.client_id,
            "total": sale.total,
            "discount": sale.discount,
            "payment_type": sale.payment_type,
            "status": "pendiente"
        }

        sale_res = supabase.table("sales").insert(sale_data).execute()

        if not sale_res.data:
            return {"error": "Error creando la venta"}

        created_sale = sale_res.data[0]

        # 🔹 2. ITEMS
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

        # 🔹 3. FOLLOWUPS (2+2+2)
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

# 🔥 FOLLOWUPS (FIX COMPLETO)

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
            .select("id, client_id, sale_id, type, scheduled_date, status, clients(name, phone)") \
            .eq("user_id", user_id) \
            .eq("status", "pending") \
            .order("scheduled_date", desc=False) \
            .execute()

        overdue = []
        today = []
        upcoming = []

        for f in res.data:
            scheduled = datetime.fromisoformat(f["scheduled_date"])

            item = {
                "id": f["id"],
                "client_id": f["client_id"],
                "sale_id": f["sale_id"],
                "type": f["type"],
                "scheduled_date": f["scheduled_date"],
                "mensaje": generate_message(f["type"]),
                "client_name": f["clients"]["name"] if f.get("clients") else "Cliente",
                "phone": f["clients"]["phone"] if f.get("clients") else ""
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

# 🔹 MENSAJES

def generate_message(followup_type):
    if followup_type == "day2":
        return "Hola hermosa 💕 ¿cómo te ha ido con tu rutina?"
    elif followup_type == "week2":
        return "Hola hermosa ✨ ¿cómo sientes tu piel?"
    elif followup_type == "month2":
        return "Hola hermosa 😍 ¿quieres reponer productos?"
    return "Hola, ¿cómo estás?"