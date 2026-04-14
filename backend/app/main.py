from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import supabase
from app.config import ALLOWED_ORIGIN

from app.routers import clients, products, sales, followups, metrics, dashboard, admin, auth

app = FastAPI()

allowed_origins = ["*"] if ALLOWED_ORIGIN == "*" else [ALLOWED_ORIGIN]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["x-user-id", "content-type", "authorization"],
)

app.include_router(clients.router)
app.include_router(products.router)
app.include_router(sales.router)
app.include_router(followups.router)
app.include_router(metrics.router)
app.include_router(dashboard.router)
app.include_router(admin.router)
app.include_router(auth.router)


@app.get("/")
def root():
    return {"message": "API running"}


@app.get("/test-db")
def test_db():
    try:
        res = supabase.table("clients").select("*").limit(1).execute()
        return {"status": "ok", "data": res.data}
    except Exception as e:
        return {"status": "error", "message": str(e)}
