import uuid
from typing import Optional
from fastapi import HTTPException


def require_user_id(user_id: Optional[str]) -> str:
    """Validates that x-user-id is present and is a valid UUID. Raises 400 otherwise."""
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing x-user-id")
    try:
        uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="x-user-id inválido")
    return user_id
