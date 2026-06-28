import os
from typing import Optional

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-haiku-3-5-sonnet")


async def chat_with_claude(
    message: str,
    pharmacy_name: str = "PharmaCloud",
    system_prompt: Optional[str] = None,
) -> str:
    if not ANTHROPIC_API_KEY:
        return "🤖 Mode démo — Connectez une clé API Claude pour activer l'assistant IA."

    default_system = (
        f"Tu es PharmIA, l'assistant pharmacie de {pharmacy_name}. "
        "Tu aides les clients à identifier des médicaments adaptés à leurs symptômes. "
        "Tu réponds TOUJOURS en français. "
        "Pour chaque médicament suggéré, affiche: nom commercial + générique, usage principal, "
        "posologie adulte standard, contre-indications principales, fourchette de prix (bas/moyen/élevé). "
        "IMPORTANT: Rappelle toujours de consulter un professionnel de santé. "
        "Ne prescris jamais, ne diagnostiques jamais."
    )

    import httpx

    payload = {
        "model": ANTHROPIC_MODEL,
        "max_tokens": 1024,
        "system": system_prompt or default_system,
        "messages": [{"role": "user", "content": message}],
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["content"][0]["text"]
    except Exception as e:
        return f"Erreur IA: {str(e)}"


async def analyze_prescription_ocr(
    image_url: str,
    pharmacy_name: str = "PharmaCloud",
) -> str:
    if not ANTHROPIC_API_KEY:
        return "Mode démo — Fonction IA non disponible sans clé API."

    import httpx

    system = (
        f"Tu es un assistant pharmaceutique pour {pharmacy_name}. "
        "Analyse cette ordonnance et extrait: "
        "1. La liste des médicaments prescrits avec dosage et posologie. "
        "2. Pour chaque médicament, donne: nom, pourquoi ce médicament, "
        "comment le prendre (heure, alimentation), durée du traitement, "
        "effets secondaires à surveiller. "
        "Réponds en français, de façon claire et structurée."
    )

    payload = {
        "model": ANTHROPIC_MODEL,
        "max_tokens": 2048,
        "system": system,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Analyse cette ordonnance et génère un rapport patient."},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            }
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["content"][0]["text"]
    except Exception as e:
        return f"Erreur analyse ordonnance: {str(e)}"
