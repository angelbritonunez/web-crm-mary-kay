def calculate_profit(total: float, items: list) -> float:
    """Ganancia = total cobrado − 50% del precio de catálogo (costo Mary Kay)."""
    items_subtotal = sum(item.price * item.quantity for item in items)
    return round(total - items_subtotal * 0.5, 2)


def determine_payment_status(total: float, amount_paid: float) -> str:
    if amount_paid >= total and total > 0:
        return "pagado"
    elif amount_paid > 0:
        return "parcial"
    return "pendiente"
