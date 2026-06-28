# PharmaCloud

ERP multi-tenant pour pharmacies au Sénégal.

## Stack

| Couche | Technologie |
|--------|-------------|
| Backend | FastAPI + SQLAlchemy 2.0 + Pydantic V2 |
| Frontend | Next.js 15 + React 19 + Tailwind CSS |
| Base de données | SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Tests | pytest + Playwright |
| Déploiement | Docker / Render / Railway |

## Démarrage rapide

```bash
# Backend
cd backend
pip install -r requirements.txt
python -m app.seed     # Crée le compte admin
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd frontend
npm install
npm run dev            # http://localhost:3000
```

**Login** : `owner@pharmacie.sn` / `password123`

## Fonctionnalités

### Cœur métier
- Caisse (POS) avec gestion client, facture, historique
- Gestion des produits, catégories, départements
- Inventaire, mouvements de stock, alertes stock faible
- Bons de livraison, commandes fournisseurs
- Dépenses, rapports (CSV/PDF)

### Paiements mobile
- Orange Money (OAuth2 + WebPayment API)
- Wave (Checkout API + webhook HMAC)
- Free Money
- Mode sandbox sans clés API

### Réseau & Communication
- Carte inter-pharmacies (Leaflet)
- Messagerie entre pharmacies
- Notifications push navigateur (PWA)
- Email (SMTP réel / Ethereal auto / console)

### Multilingue
- Français, English, العربية
- RTL pour arabe

### Facturation & Import
- Facturation électronique (TVA 18%)
- Connexion grossistes (COPHAD, Pharma Plus, SDP)
- Import/Export Excel (CSV)

### Infrastructure
- Docker Compose (dev + prod)
- CI/CD GitHub Actions
- Déploiement Render / Railway (free tier)
- PostgreSQL via Alembic migrations
- PWA (service worker + manifest)

## Tests

```bash
# Backend (pytest)
cd backend && python -m pytest tests/ -v

# E2E complet (41 tests)
cd backend && python -m tests.run_e2e

# Frontend (TypeScript)
cd frontend && npx tsc --noEmit

# E2E (Playwright)
cd frontend && npx playwright test
```

## Structure du projet

```
backend/
  app/
    routers/       # 20+ endpoints groups
    models/        # SQLAlchemy models
    schemas/       # Pydantic schemas
    services/      # Payment, Email, Push, Tax
    main.py        # FastAPI app
    seed.py        # Minimal seed (admin only)
  tests/           # pytest + E2E
  alembic/         # Migrations PostgreSQL
frontend/
  app/             # Next.js App Router
  components/      # React components
  lib/             # API client, i18n, theme, push
  public/          # PWA manifest + sw.js
  tests/           # Playwright
scripts/           # Déploiement, backup, migration
docs/              # API, Security, Deployment guides
```

## Variables d'environnement

Voir `.env.production.example` pour toutes les variables.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite ou PostgreSQL |
| `SECRET_KEY` | JWT signing key |
| `ORANGE_MONEY_*` | Clés API Orange Money |
| `WAVE_API_KEY` | Clé API Wave |
| `SMTP_*` | Configuration email |

## Licence & Contact

**Dev** : Abdoulaye Sow — +221 77 662 14 10 / +221 70 837 21 27 — layedevops@gmail.com
