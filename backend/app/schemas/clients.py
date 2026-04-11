from pydantic import BaseModel
from typing import Optional

# Skin types defined by the Mary Kay product catalog
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

# prospect → no purchases yet | customer → auto-transitioned on first sale | later → deferred prospect
VALID_STATUS = ["prospect", "customer", "later"]


class ClientRequest(BaseModel):
    name: str
    phone: str
    skin_type: str
    status: Optional[str] = "prospect"
    email: Optional[str] = None
    followup_enabled: Optional[bool] = True  # if False, no 2+2+2 followups are created on sale
