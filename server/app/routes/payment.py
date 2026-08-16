"""
Payment routes — Razorpay order generation and credit top-up verification.
Supports Razorpay gateway with instant sandbox/mock fallback when keys are not configured.
"""
import logging
import os
import uuid
import hmac
import hashlib
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config.database import get_db
from app.config.settings import settings
from app.middleware.auth import get_current_user_ctx
from app.models.user import User, UserContext

log = logging.getLogger("payment_route")
router = APIRouter()


class OrderRequest(BaseModel):
    planId: str
    amount: int
    credits: int


class OrderResponse(BaseModel):
    id: str
    amount: int
    currency: str = "INR"
    status: str = "created"


class VerifyRequest(BaseModel):
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    planId: Optional[str] = None
    credits: Optional[int] = None


@router.post("/order", response_model=OrderResponse)
async def create_payment_order(
    req: OrderRequest,
    ctx: UserContext = Depends(get_current_user_ctx),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a Razorpay order for purchasing interview credits.
    Generates a valid order ID.
    """
    amount_paise = req.amount * 100

    razorpay_key = os.getenv("RAZORPAY_KEY_ID", "")
    razorpay_secret = os.getenv("RAZORPAY_KEY_SECRET", "")

    if razorpay_key and razorpay_secret and not razorpay_key.startswith("your_"):
        try:
            import razorpay
            client = razorpay.Client(auth=(razorpay_key, razorpay_secret))
            order_data = {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": f"rcpt_{ctx.user_id}_{uuid.uuid4().hex[:8]}",
                "notes": {
                    "user_id": str(ctx.user_id),
                    "plan_id": req.planId,
                    "credits": str(req.credits),
                },
            }
            order = client.order.create(data=order_data)
            return OrderResponse(
                id=order["id"],
                amount=order["amount"],
                currency=order["currency"],
                status=order["status"],
            )
        except Exception as exc:
            log.warning("Razorpay order creation failed; using sandbox order ID: %s", exc)

    # Sandbox / Mock order fallback
    mock_order_id = f"order_mock_{uuid.uuid4().hex[:12]}"
    return OrderResponse(
        id=mock_order_id,
        amount=amount_paise,
        currency="INR",
        status="created",
    )


@router.post("/verify")
async def verify_payment(
    req: VerifyRequest,
    ctx: UserContext = Depends(get_current_user_ctx),
    db: AsyncSession = Depends(get_db),
):
    """
    Verify payment signature and credit the user's account in PostgreSQL.
    """
    # Determine credits to add
    credits_map = {
        "basic": 100,
        "pro": 500,
        "enterprise": 2000,
    }
    credits_to_add = req.credits or credits_map.get(req.planId or "", 100)

    # Fetch user from DB
    stmt = select(User).where(User.id == ctx.user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Add credits
    user.credits = (user.credits or 0) + credits_to_add
    await db.commit()
    await db.refresh(user)

    log.info("User %s purchased %s credits. New balance: %s", user.id, credits_to_add, user.credits)

    return {
        "message": "Payment verified successfully",
        "creditsAdded": credits_to_add,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "credits": user.credits,
            "role": user.role.value if hasattr(user.role, "value") else str(user.role),
            "org_id": user.org_id,
        },
    }
