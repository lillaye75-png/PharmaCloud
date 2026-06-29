from typing import Optional
import json
import re
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
    "conseil": "Important: Consultez toujours un pharmacien ou médecin avant tout traitement. Je suis une IA d'assistance et non un professionnel de santé."
}


def _keyword_response(message: str) -> Optional[str]:
    msg_lower = message.lower()
    matches = []
    for keyword, response in PHARMA_KEYWORDS.items():
        if keyword in msg_lower:
            matches.append((msg_lower.index(keyword) if keyword in msg_lower else 999, response))
    if matches:
        matches.sort(key=lambda x: x[0])
        return matches[0][1]
    if any(w in msg_lower for w in ["bonjour", "salut", "hello"]):
        return "Bonjour ! Je suis PharmIA, votre assistant pharmacie. Posez-moi vos questions sur les médicaments, symptômes, posologies, ou contre-indications."
    if any(w in msg_lower for w in ["merci", "thanks"]):
        return "De rien ! N'hésitez pas si vous avez d'autres questions. Prenez soin de vous."
    return None


async def chat_with_assistant(
    message: str,
    pharmacy_name: str = "PharmaCloud",
    system_prompt: Optional[str] = None,
) -> str:
    keyword_result = _keyword_response(message)
    if keyword_result and not settings.GOOGLE_API_KEY:
        return f"🤖 {keyword_result}\n\n_Pour des réponses complètes, connectez une clé API Google Gemini (gratuite) dans Paramètres. Sans clé, je réponds aux questions courantes._"

    default_system = (
        f"Tu es PharmIA, l'assistant pharmacie de {pharmacy_name}. "
        "Tu aides les clients à identifier des médicaments adaptés à leurs symptômes. "
        "Tu réponds TOUJOURS en français. "
        "Pour chaque médicament suggéré, affiche: nom commercial + générique, usage principal, "
        "posologie adulte standard, contre-indications principales, fourchette de prix (bas/moyen/élevé). "
        "IMPORTANT: Rappelle toujours de consulter un professionnel de santé. "
        "Ne prescris jamais, ne diagnostiques jamais."
    )

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel(
            settings.GEMINI_MODEL,
            system_instruction=system_prompt or default_system,
        )
        resp = model.generate_content(message)
        return resp.text
    except Exception as e:
        err = str(e)
        if "API_KEY" in err or "api key" in err or "not found" in err:
            return "Clé API Google Gemini invalide. Obtenez-en une gratuite sur https://aistudio.google.com/apikey"
        keyword_fallback = _keyword_response(message)
        if keyword_fallback:
            return f"🤖 {keyword_fallback}\n\n_Source: base de connaissances locale (mode hors-ligne)_"
        return f"Erreur IA: {err}"


async def analyze_prescription_ocr(
    image_url: str,
    pharmacy_name: str = "PharmaCloud",
) -> str:
    if not settings.GOOGLE_API_KEY:
        return "Mode hors-ligne — Fonction analyse d'ordonnance disponible uniquement avec une clé API Google Gemini (gratuite)."

    system = (
        f"Tu es un assistant pharmaceutique pour {pharmacy_name}. "
        "Analyse cette ordonnance et extrait: "
        "1. La liste des médicaments prescrits avec dosage et posologie. "
        "2. Pour chaque médicament, donne: nom, pourquoi ce médicament, "
        "comment le prendre (heure, alimentation), durée du traitement, "
        "effets secondaires à surveiller. "
        "Réponds en français, de façon claire et structurée."
    )

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel(settings.GEMINI_MODEL, system_instruction=system)
        resp = model.generate_content([{"mime_type": "image/jpeg", "data": image_url}])
        return resp.text
    except Exception as e:
        return f"Erreur analyse ordonnance: {str(e)}"
