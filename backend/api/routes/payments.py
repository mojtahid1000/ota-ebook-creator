"""Payment API routes - SSLCommerz/bKash integration."""

from fastapi import APIRouter, Request
from pydantic import BaseModel
from services.payment_service import payment_service

router = APIRouter()


class CheckoutRequest(BaseModel):
    plan_id: str
    user_id: str
    user_email: str
    user_name: str


@router.get("/plans")
async def get_plans():
    """Get all available subscription plans."""
    return {"plans": payment_service.get_plans()}


@router.post("/checkout")
async def create_checkout(request: CheckoutRequest):
    """Create a payment session with SSLCommerz."""
    result = await payment_service.create_sslcommerz_session(
        plan_id=request.plan_id,
        user_id=request.user_id,
        user_email=request.user_email,
        user_name=request.user_name,
    )
    return result


@router.post("/ipn")
async def payment_notification(request: Request):
    """SSLCommerz Instant Payment Notification (IPN) handler."""
    form_data = await request.form()
    data = dict(form_data)

    status = data.get("status", "")
    tran_id = data.get("tran_id", "")
    val_id = data.get("val_id", "")
    user_id = data.get("value_a", "")
    plan_id = data.get("value_b", "")

    if status == "VALID" and val_id:
        # Verify with SSLCommerz
        verification = await payment_service.verify_payment(val_id)

        if verification.get("status") == "VALID" or verification.get("mock"):
            # TODO: Update subscription in Supabase
            # supabase.from("subscriptions").update({plan: plan_id, status: "active"}).eq("user_id", user_id)
            return {"status": "success", "user_id": user_id, "plan_id": plan_id}

    return {"status": "failed"}


@router.post("/verify")
async def verify_payment(val_id: str):
    """Manually verify a payment."""
    result = await payment_service.verify_payment(val_id)
    return result
