import os
from typing import Optional

TAX_RATE = 0.18  # 18% TVA

def calculate_tax(amount: float, rate: Optional[float] = None) -> dict:
    r = rate or TAX_RATE
    return {
        "base": round(amount / (1 + r), 2),
        "tax": round(amount - amount / (1 + r), 2),
        "rate": r,
    }

def generate_invoice_number(tenant_slug: str, counter: int) -> str:
    import datetime
    year = datetime.datetime.now().year
    return f"FAC-{tenant_slug.upper()}-{year}-{counter:06d}"
