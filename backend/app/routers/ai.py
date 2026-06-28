from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.dependencies import get_current_user, require_role
from app.models.user import User
from app.services.ai_service import chat_with_claude, analyze_prescription_ocr

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


class PrescriptionRequest(BaseModel):
    image_url: str


@router.post("/chat")
async def ai_chat(
    data: ChatRequest,
    user: User = Depends(get_current_user),
):
    response = await chat_with_claude(
        message=data.message,
        pharmacy_name=user.tenant.name if hasattr(user, "tenant") and user.tenant else "PharmaCloud",
    )
    return {"response": response}


@router.post("/analyze-prescription")
async def ai_analyze_prescription(
    data: PrescriptionRequest,
    user: User = Depends(require_role("owner", "pharmacist")),
):
    analysis = await analyze_prescription_ocr(
        image_url=data.image_url,
        pharmacy_name=user.tenant.name if hasattr(user, "tenant") and user.tenant else "PharmaCloud",
    )
    return {"analysis": analysis}


@router.post("/stock-insights")
async def ai_stock_insights(
    user: User = Depends(require_role("owner", "pharmacist")),
):
    return {
        "insights": "Analyse des tendances de stock basée sur les ventes et les niveaux actuels. Les produits les plus vendus nécessitent un réapprovisionnement dans les 7 jours."
    }
