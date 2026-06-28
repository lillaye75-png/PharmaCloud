# Changelog

## [1.0.0] — 2026-06-27

### Added
- ERP pharmaceutique multi-tenant complet
- Caisse intelligente avec scan code-barres
- Gestion des stocks avec inventaire et alertes
- Gestion des produits, catégories, départements
- Boutique en ligne avec URL personnalisée
- Commandes et gestion des livraisons
- Réseau inter-pharmacies avec carte Leaflet
- Assistant IA (PharmIA) powered by Claude
- Rapports et analyses avec export PDF/CSV
- Gestion des utilisateurs et rôles
- Dépenses et suivi financier
- Paiements mobile (Orange Money, Wave, Free Money)
- Notifications email
- Mode sombre
- Dashboard temps réel
- Landing page moderne

### Fixed
- Authentification 401 sur toutes les API
- UUID serialization dans inventory et delivery_slips
- Routes catégories trailing slash
- Boutons d'action manquants (edit, delete)
- Inventaire non cliquable

### Backend
- GPS coordinates (lat/lng) sur le modèle Tenant
- Description pour la boutique en ligne
- Validation des stocks avant création de vente
- Endpoint PUT /sales/{id} pour modifier une vente
- Pagination sur les listes produits
- Service email (SMTP) pour notifications
- API paiements mobile (Orange Money, Wave, Free Money)
- Stock auto-décrémenté à la livraison commande

### Frontend
- Carte Leaflet pour le réseau inter-pharmacies
- Page configuration boutique (description, horaires, livraison)
- Page Assistance avec FAQ + chat IA
- Page Paiements avec méthodes disponibles
- Dashboard avec données temps réel (ventes, stock, alertes)
- Mode sombre (dark mode) avec toggle
- Notifications + Sécurité (onglets parametres)
- Sidebar: Assistance, Configuration boutique

### Infrastructure
- Docker Compose (backend + frontend + PostgreSQL)
- CI/CD GitHub Actions
- Nginx configuration
- .env.production.example
- Backend tests (7/7 passants)
- Playwright E2E tests
- SECURITY.md + CHANGELOG.md
