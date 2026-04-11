from pydantic import BaseModel
from typing import List, Optional


class SaleItem(BaseModel):
    product_id: str
    quantity: int
    price: float  # catalog price in DOP


class SaleRequest(BaseModel):
    client_id: str
    total: float    # amount charged to the client (may differ from catalog subtotal due to discounts)
    discount: float
    payment_type: str
    items: List[SaleItem]
    source_followup_id: Optional[str] = None  # set when the sale originates from a pending followup
    notes: Optional[str] = None
    sale_date: Optional[str] = None           # manual date (YYYY-MM-DD); falls back to created_at if omitted
    initial_payment: Optional[float] = None   # upfront payment; determines initial payment status


class PaymentRequest(BaseModel):
    amount: float
    payment_type: str   # "efectivo" | "transferencia"
    payment_date: Optional[str] = None  # YYYY-MM-DD; defaults to today if omitted
    notes: Optional[str] = None
