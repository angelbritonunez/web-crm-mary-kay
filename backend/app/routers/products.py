from fastapi import APIRouter
from app.db import supabase

router = APIRouter(prefix="/products", tags=["products"])


@router.get("")
def get_products():
    res = supabase.table("products").select("id, name, price, category").order("name").execute()
    return {"status": "success", "data": res.data}
