from pydantic import BaseModel
from typing import List, Optional


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
    notes: Optional[str] = None
    sale_date: Optional[str] = None
    initial_payment: Optional[float] = None


class PaymentRequest(BaseModel):
    amount: float
    payment_type: str
    payment_date: Optional[str] = None
    notes: Optional[str] = None
