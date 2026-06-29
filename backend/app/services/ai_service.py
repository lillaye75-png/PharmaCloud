from typing import Optional
from app.config import settings


PHARMA_KEYWORDS = {
    "toux": "Sirop toux (Dextromethorphane) – 1 càc 3x/j – Éviter si asthme sévère. ~1500-3000 FCFA",
    "fièvre": "Paracétamol 500mg – 1 comprimé 3x/j (max 4g/j) – Éviter si insuffisance hépatique. ~500-1500 FCFA",
    "douleur": "Ibuprofène 400mg – 1 comprimé 2-3x/j – À prendre pendant repas. ~1000-2500 FCFA",
    "mal de tête": "Paracétamol 1g – 1 comprimé 2-3x/j – Ne pas dépasser 4g/j. ~500-1500 FCFA",
    "diarrhée": "Smecta 3g – 1 sachet 3x/j – Espacer les prises. ~1500-3000 FCFA",
    "allergie": "Cétirizine 10mg – 1 comprimé/j – Peut causer somnolence. ~1000-3000 FCFA",
    "nausée": "Métoclopramide 10mg – 1 comprimé 3x/j – À prendre avant repas. ~1000-2500 FCFA",
    "insomnie": "Mélatonine 2mg – 1 comprimé au coucher – À éviter chez enfants. ~2000-5000 FCFA",
    "maux de ventre": "Spasfon 80mg – 2 comprimés 3x/j – Soulage les spasmes. ~1500-3500 FCFA",
    "paludisme": "Artéméther-Luméfantrine (Coartem) – selon poids – Traitement 3 jours. ~3000-8000 FCFA",
    "hypertension": "Amlodipine 5mg – 1 comprimé/j – Suivi médical obligatoire. ~2000-6000 FCFA",
    "diabète": "Metformine 500mg – 1 comprimé 2-3x/j – Avec repas. ~2000-5000 FCFA",
    "infection": "Amoxicilline 500mg – 1 gélule 3x/j – Terminer le traitement. ~2000-4000 FCFA",
    "plaie": "Bétadine solution – Application locale 2x/j – Ne pas ingérer. ~1500-3000 FCFA",
    "brûlure": "Biafine crème – Application 2-3x/j – Protection solaire si exposition. ~3000-6000 FCFA",
}

GREETINGS = ["bonjour", "salut", "hello", "bonsoir", "salam"]
THANKS = ["merci", "thanks", "merci beaucoup"]


def _keyword_response(message: str) -> Optional[str]:
    msg_lower = message.lower()
    matches = []
    for keyword, response in PHARMA_KEYWORDS.items():
        if keyword in msg_lower:
            matches.append((msg_lower.index(keyword) if keyword in msg_lower else 999, response))
    if matches:
        matches.sort(key=lambda x: x[0])
        return matches[0][1]
    if any(w in msg_lower for w in GREETINGS):
        return (
            "Bonjour ! Je suis PharmIA, votre assistant pharmacie. "
            "Posez-moi vos questions sur les médicaments, symptômes, posologies, ou contre-indications."
        )
    if any(w in msg_lower for w in THANKS):
        return "De rien ! N'hésitez pas si vous avez d'autres questions. Prenez soin de vous."
    return None


def _build_system_prompt(pharmacy_name: str) -> str:
    return (
        f"Tu es PharmIA, l'assistant pharmacie de {pharmacy_name}. "
        "Tu aides les clients à identifier des médicaments adaptés à leurs symptômes. "
        "Tu réponds TOUJOURS en français. "
        "Pour chaque médicament suggéré, affiche: nom commercial + générique, usage principal, "
        "posologie adulte standard, contre-indications principales, fourchette de prix (bas/moyen/élevé). "
        "IMPORTANT: Rappelle toujours de consulter un professionnel de santé. "
        "Ne prescris jamais, ne diagnostiques jamais."
    )


async def _call_gemini_via_rest(message: str, system_prompt: str) -> str:
    import httpx

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GOOGLE_API_KEY}"
    payload = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [
            {
                "parts": [{"text": message}]
            }
        ],
        "generationConfig": {
            "maxOutputTokens": 1024,
            "temperature": 0.7,
        },
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, json=payload)
        data = resp.json()
        if resp.status_code != 200:
            err_msg = data.get("error", {}).get("message", str(data))
            raise RuntimeError(err_msg)
        candidates = data.get("candidates", [])
        if not candidates:
            raise RuntimeError("Aucune réponse générée")
        return candidates[0]["content"]["parts"][0]["text"]


async def chat_with_assistant(
    message: str,
    pharmacy_name: str = "PharmaCloud",
    system_prompt: Optional[str] = None,
) -> str:
    has_key = bool(settings.GOOGLE_API_KEY and settings.GOOGLE_API_KEY.strip())

    keyword_result = _keyword_response(message)
    if keyword_result and not has_key:
        return (
            f"🤖 {keyword_result}\n\n"
            "_Pour des réponses complètes, connectez une clé API Google Gemini (gratuite) dans Paramètres. "
            "Sans clé, je réponds aux questions courantes._"
        )

    prompt = system_prompt or _build_system_prompt(pharmacy_name)

    if has_key:
        try:
            return await _call_gemini_via_rest(message, prompt)
        except Exception as e:
            err = str(e)
            if "API_KEY" in err.upper() or "not found" in err.lower() or "invalid" in err.lower() or "permission" in err.lower() or "403" in err or "400" in err:
                return (
                    f"❌ Clé API Google Gemini invalide ({err[:100]}).\n\n"
                    "Obtenez une nouvelle clé gratuite sur https://aistudio.google.com/apikey\n"
                    "Puis mettez-la dans Render Dashboard → Environment → GOOGLE_API_KEY"
                )

    keyword_fallback = _keyword_response(message)
    if keyword_fallback:
        return f"🤖 {keyword_fallback}\n\n_Source: base de connaissances locale (mode hors-ligne)_"

    return (
        "Je suis désolé, je n'ai pas trouvé de réponse dans ma base de connaissances locale. "
        "Connectez une clé API Google Gemini (gratuite) pour activer les réponses complètes.\n\n"
        "Ou contactez layedevops@gmail.com pour obtenir de l'aide."
    )


async def analyze_prescription_ocr(
    image_url: str,
    pharmacy_name: str = "PharmaCloud",
) -> str:
    has_key = bool(settings.GOOGLE_API_KEY and settings.GOOGLE_API_KEY.strip())
    if not has_key:
        return (
            "Mode hors-ligne — Fonction analyse d'ordonnance disponible uniquement "
            "avec une clé API Google Gemini (gratuite) sur https://aistudio.google.com/apikey"
        )

    system = (
        f"Tu es un assistant pharmaceutique pour {pharmacy_name}. "
        "Analyse cette ordonnance et extrait: "
        "1. La liste des médicaments prescrits avec dosage et posologie. "
        "2. Pour chaque médicament, donne: nom, pourquoi ce médicament, "
        "comment le prendre (heure, alimentation), durée du traitement, "
        "effets secondaires à surveiller. "
        "Réponds en français, de façon claire et structurée."
    )

    import httpx
    import base64

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            img_resp = await client.get(image_url)
            img_resp.raise_for_status()
            img_b64 = base64.b64encode(img_resp.content).decode("utf-8")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GOOGLE_API_KEY}"
        payload = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [
                {
                    "parts": [
                        {"text": "Analyse cette ordonnance et génère un rapport patient."},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": img_b64,
                            }
                        },
                    ]
                }
            ],
        }
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, json=payload)
            data = resp.json()
            if resp.status_code != 200:
                return f"Erreur API: {data.get('error', {}).get('message', str(data))}"
            candidates = data.get("candidates", [])
            if not candidates:
                return "Aucune analyse générée"
            return candidates[0]["content"]["parts"][0]["text"]
    except Exception as e:
        return f"Erreur analyse ordonnance: {str(e)}"
