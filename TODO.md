# PharmaCloud — TODO

## ✅ Fait

### Auth & Core
- [x] Fix 401 auth (api.ts setToken + clearToken + auto-redirect)
- [x] Fix login page (utilise api.setToken)
- [x] Fix sidebar logout button
- [x] Redirection login → /caisse (pas la landing page)

### Backend
- [x] UUID serialization (inventory.py, delivery_slips.py)
- [x] Categories trailing slash routes
- [x] DELETE /categories/departments/{id} endpoint
- [x] Sale model: customer_name, customer_phone, customer_email
- [x] Sale detail/delete/items endpoints
- [x] Stock auto-decrement on order delivery
- [x] PDF/CSV export endpoints (rapports)
- [x] GPS coordonnées (lat/lng) sur Tenant
- [x] Description sur Tenant (boutique en ligne)
- [x] Validation des stocks avant vente
- [x] PUT /sales/{id} endpoint
- [x] Pagination sur listes produits
- [x] Service email (SMTP) pour notifications
- [x] API paiements mobile (Orange Money, Wave, Free Money)

### Frontend Pages
- [x] Landing page moderne (hero, features, stats, testimonials, pricing, footer dev)
- [x] Dashboard temps réel (ventes, stock, alertes)
- [x] Inventaire: cartes cliquables + détail + Nouvel inventaire form
- [x] Produits: Edit/Delete + page détail + Nouveau produit form
- [x] Bons livraison: Nouveau bon form + liste
- [x] Mouvements de stock
- [x] Ventes (caisse): customer info + invoice popup + historique actions
- [x] Catégories/Départements: CRUD complet
- [x] Utilisateurs: invite, liste, delete
- [x] Dépenses: ajout, liste, suppression
- [x] Paramètres: pharmacie éditable + boutique en ligne + notifications + sécurité
- [x] Commandes: suivi statuts + paiement
- [x] Boutique en ligne publique (shop/[slug])
- [x] Configuration boutique (description, horaires, livraison, logo)
- [x] Rapports: indicateurs + téléchargement CSV/PDF
- [x] Réseau: carte Leaflet + liste pharmacies + demande inter-pharmacie
- [x] Assistance: FAQ + chat IA + contact
- [x] Paiements: méthodes disponibles

### UI/UX
- [x] favicon.svg
- [x] URLs localhost → NEXT_PUBLIC_API_URL
- [x] Dark mode (toggle + localStorage)
- [x] Sidebar responsive mobile
- [x] Tableaux responsive (overflow-x-auto)
- [x] Landing page avec maquette dashboard + mockup mobile

### Infrastructure
- [x] Docker Compose (backend + frontend + PostgreSQL)
- [x] Dockerfile frontend (multi-stage) + backend
- [x] CI/CD (GitHub Actions)
- [x] Nginx config
- [x] .env.production.example
- [x] .dockerignore (backend + frontend)

### Qualité
- [x] Tests backend (7/7 pytest — health, login, register, products, seed)
- [x] Tests Playwright E2E (login, dashboard navigation)
- [x] Tests d'intégration avancés — 12 tests (products, sales, reports, categories, expenses)
- [x] SECURITY.md
- [x] CHANGELOG.md

### Paiements & Notifications
- [x] Paiement mobile réel — service Orange Money OAuth2 + Wave Checkout API + sandbox
- [x] Email/SMTP réel — 3 niveaux (SMTP → Ethereal → console) + templates
- [x] Notifications push navigateur (backend + frontend + sw.js)
- [x] PWA — sw.js (cache + push + notificationclick) + manifest.json

### Facturation & Grossistes & Import
- [x] Facturation électronique (impôts) (backend + frontend)
- [x] Connexion grossistes (commande automatique) (backend + frontend)
- [x] Import/Export Excel des produits et ventes (backend + frontend)

### Multilingue
- [x] Support multilingue (Français + Anglais + Arabe) — i18n.ts + sidebar + RTL

### Infrastructure & Déploiement
- [x] Déploiement VPS — Render/Railway blueprints + CI/CD auto-deploy + Guide complet
- [x] Base de données PostgreSQL — Alembic migrations + guide migration + dual DB
- [x] Docker Compose (backend + frontend + PostgreSQL)
- [x] Dockerfile frontend (multi-stage) + backend
- [x] CI/CD (GitHub Actions)
- [x] Nginx config
- [x] .env.production.example
- [x] .dockerignore (backend + frontend)

### Technique & Qualité
- [x] Migration Pydantic V2 (ConfigDict au lieu de class Config)
- [x] Migration datetime.utcnow → datetime.now(datetime.UTC)
- [x] Audit de sécurité complet — docs/SECURITY_AUDIT.md
- [x] Documentation API complète — docs/API.md

### Déploiement Production
- [x] Render backend — déployé et live (`https://pharmacloud-backend.onrender.com`)
- [x] Vercel frontend — déployé et live (`https://pharma-cloud.vercel.app`)
- [x] CORS wildcard — résolu les erreurs de préflight
- [x] Base Neon PostgreSQL — UUID types, schéma propre
- [x] bcrypt/passlib — compatibilité Python 3.14 résolue
- [x] Seed admin — `owner@pharmacie.sn` / `password123`
- [x] Assistant IA — Clé Anthropic ajoutée (`ANTHROPIC_API_KEY`)
- [x] Auto-polling — Dashboard (30s), Produits (15s), Commandes (30s)
- [x] Wizard onboarding — visible uniquement à la première connexion
- [x] Wizard caché du sidebar après complétion

---

## 🔜 Idées futures
- [ ] Application mobile (React Native / Flutter)
- [ ] Ajouter des crédits Anthropic pour activer le chatbot IA
- [ ] Configurer cron-job.org pour éviter le cold start Render (ping /health toutes les 14min)
- [ ] Clés API réelles Orange Money / Wave pour paiements en production
- [ ] SMTP réel (SendGrid / Mailgun / Resend) pour les emails transactionnels
- [ ] Tests Playwright E2E contre la production

---

**Backend**: http://localhost:8001 (uvicorn, --reload)
**Frontend**: http://localhost:3000 (next dev)
**Login test**: owner@pharmacie.sn / password123

**Dev**: Abdoulaye Sow — +221 77 662 14 10 / +221 70 837 21 27 — layedevops@gmail.com
