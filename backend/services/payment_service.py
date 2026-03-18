"""Payment Service - SSLCommerz and bKash integration for Bangladesh."""

import os
import logging
import httpx
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Plan definitions
PLANS = {
    "free": {
        "name": "Free",
        "bn": "ফ্রি",
        "price_bdt": 0,
        "ebooks_per_month": 1,
        "tokens_budget": 200_000,
        "features": ["১ ইবুক/মাস", "শুধু PDF", "বেসিক ফন্ট"],
    },
    "pro": {
        "name": "Pro",
        "bn": "প্রো",
        "price_bdt": 999,
        "ebooks_per_month": 10,
        "tokens_budget": 2_000_000,
        "features": ["১০ ইবুক/মাস", "PDF + DOCX", "সব ফন্ট", "AI কভার", "প্রায়োরিটি"],
    },
    "unlimited": {
        "name": "Unlimited",
        "bn": "আনলিমিটেড",
        "price_bdt": 2499,
        "ebooks_per_month": -1,  # Unlimited
        "tokens_budget": -1,  # Unlimited
        "features": ["আনলিমিটেড ইবুক", "সব ফরম্যাট", "সব ফিচার", "কাস্টম ব্র্যান্ডিং", "VIP সাপোর্ট"],
    },
}


class SSLCommerzConfig(BaseModel):
    store_id: str = ""
    store_pass: str = ""
    is_sandbox: bool = True

    @property
    def base_url(self) -> str:
        if self.is_sandbox:
            return "https://sandbox.sslcommerz.com"
        return "https://securepay.sslcommerz.com"


class PaymentService:
    """Handle SSLCommerz and bKash payments."""

    def __init__(self):
        self.sslcommerz = SSLCommerzConfig(
            store_id=os.environ.get("SSLCOMMERZ_STORE_ID", ""),
            store_pass=os.environ.get("SSLCOMMERZ_STORE_PASS", ""),
            is_sandbox=os.environ.get("SSLCOMMERZ_SANDBOX", "true").lower() == "true",
        )

    async def create_sslcommerz_session(
        self,
        plan_id: str,
        user_id: str,
        user_email: str,
        user_name: str,
    ) -> dict:
        """Create an SSLCommerz payment session."""
        plan = PLANS.get(plan_id)
        if not plan or plan["price_bdt"] == 0:
            return {"success": False, "error": "Invalid plan or free plan"}

        payload = {
            "store_id": self.sslcommerz.store_id,
            "store_passwd": self.sslcommerz.store_pass,
            "total_amount": plan["price_bdt"],
            "currency": "BDT",
            "tran_id": f"OTA-{user_id[:8]}-{plan_id}",
            "success_url": f"{os.environ.get('APP_URL', 'http://localhost:3000')}/subscription?status=success",
            "fail_url": f"{os.environ.get('APP_URL', 'http://localhost:3000')}/subscription?status=fail",
            "cancel_url": f"{os.environ.get('APP_URL', 'http://localhost:3000')}/subscription?status=cancel",
            "ipn_url": f"{os.environ.get('API_URL', 'http://localhost:8000')}/api/payments/ipn",
            "cus_name": user_name,
            "cus_email": user_email,
            "cus_phone": "01700000000",
            "cus_add1": "Dhaka",
            "cus_city": "Dhaka",
            "cus_country": "Bangladesh",
            "shipping_method": "NO",
            "product_name": f"OTA Ebook Creator - {plan['name']} Plan",
            "product_category": "Digital Service",
            "product_profile": "non-physical-goods",
            "value_a": user_id,
            "value_b": plan_id,
        }

        if not self.sslcommerz.store_id:
            # Return mock session for development
            return {
                "success": True,
                "session_url": f"{self.sslcommerz.base_url}/gwprocess/v4/gw.php",
                "mock": True,
                "plan": plan,
                "message": "SSLCommerz credentials not configured. Set SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASS.",
            }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.sslcommerz.base_url}/gwprocess/v4/api.php",
                    data=payload,
                )
                data = response.json()

                if data.get("status") == "SUCCESS":
                    return {
                        "success": True,
                        "session_url": data["GatewayPageURL"],
                        "session_key": data.get("sessionkey"),
                    }
                else:
                    return {
                        "success": False,
                        "error": data.get("failedreason", "Payment session creation failed"),
                    }
        except Exception as e:
            logger.error(f"SSLCommerz error: {e}")
            return {"success": False, "error": str(e)}

    async def verify_payment(self, val_id: str) -> dict:
        """Verify a payment with SSLCommerz."""
        if not self.sslcommerz.store_id:
            return {"success": True, "mock": True, "status": "VALID"}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.sslcommerz.base_url}/validator/api/validationserverAPI.php",
                    params={
                        "val_id": val_id,
                        "store_id": self.sslcommerz.store_id,
                        "store_passwd": self.sslcommerz.store_pass,
                    },
                )
                return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_plans(self) -> list[dict]:
        """Return all available plans."""
        return [
            {"id": plan_id, **plan_data}
            for plan_id, plan_data in PLANS.items()
        ]


payment_service = PaymentService()
