from pydantic import BaseModel
from typing import Optional

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


class ClientRequest(BaseModel):
    name: str
    phone: str
    skin_type: str
    status: Optional[str] = "prospect"
    email: Optional[str] = None
    followup_enabled: Optional[bool] = True
