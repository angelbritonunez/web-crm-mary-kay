import json
import jwt
import httpx
from jwt.algorithms import ECAlgorithm
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.db import supabase
from app.config import ALLOWED_ORIGIN, SUPABASE_URL

from app.routers import clients, products, sales, followups, metrics, dashboard, admin, auth

app = FastAPI()

if ALLOWED_ORIGIN == "*":
    allowed_origins = ["*"]
else:
    base = ALLOWED_ORIGIN.rstrip("/")
    www = base.replace("://", "://www.") if "://www." not in base else base
    nowww = base.replace("://www.", "://") if "://www." in base else base
    allowed_origins = list({base, www, nowww})

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["x-user-id", "content-type", "authorization"],
)

# JWKS cache: {kid: public_key_object}
_jwks_cache: dict = {}
_jwks_loaded = False


async def _ensure_jwks() -> None:
    global _jwks_loaded
    if _jwks_loaded:
        return
    try:
        url = f"{SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=5)
            resp.raise_for_status()
        for key in resp.json().get("keys", []):
            kid = key.get("kid")
            alg = key.get("alg")
            if kid and alg == "ES256":
                _jwks_cache[kid] = ECAlgorithm.from_jwk(json.dumps(key))
        _jwks_loaded = True
    except Exception as e:
        print(f"Warning: JWKS load failed: {e}")


@app.middleware("http")
async def validate_jwt_middleware(request: Request, call_next):
    x_user_id = request.headers.get("x-user-id")
    # Public endpoints (no x-user-id) — skip validation
    if not x_user_id:
        return await call_next(request)

    authorization = request.headers.get("authorization")
    if not authorization or not authorization.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"detail": "Token de autorización requerido"})

    token = authorization.split(" ", 1)[1]

    await _ensure_jwks()

    # If JWKS couldn't be loaded (e.g. no connectivity), fall through to let the route handle it
    if not _jwks_cache:
        return await call_next(request)

    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        public_key = _jwks_cache.get(kid)
        if not public_key:
            return JSONResponse(status_code=401, content={"detail": "Token inválido"})
        payload = jwt.decode(token, public_key, algorithms=["ES256"], audience="authenticated")
    except jwt.ExpiredSignatureError:
        return JSONResponse(status_code=401, content={"detail": "Sesión expirada"})
    except jwt.InvalidTokenError:
        return JSONResponse(status_code=401, content={"detail": "Token inválido"})

    if payload.get("sub") != x_user_id:
        return JSONResponse(status_code=403, content={"detail": "Token no corresponde al usuario"})

    return await call_next(request)


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
