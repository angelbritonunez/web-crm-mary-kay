def calculate_profit(total: float, items: list) -> float:
    """Mary Kay rule: consultant cost is 50% of catalog price. Profit = charged - cost."""
    items_subtotal = sum(item.price * item.quantity for item in items)
    return round(total - items_subtotal * 0.5, 2)


def determine_payment_status(total: float, amount_paid: float) -> str:
    """Returns 'pagado', 'parcial', or 'pendiente' based on how much has been paid."""
    if amount_paid >= total and total > 0:
        return "pagado"
    elif amount_paid > 0:
        return "parcial"
    return "pendiente"
