# 💊 PHARMACLOUD — Master Build Prompt
### Système de Gestion Pharmaceutique Multi-Tenant SaaS (Web + Mobile + Desktop)
> **Langue par défaut : Français** | Architecture: Multi-tenant | Déploiement: Free-tier optimisé

---

## 🎯 VISION PRODUIT

**PharmaCloud** est une plateforme SaaS pharmaceutique complète, multi-tenant, fonctionnant en mode online/offline avec synchronisation automatique. Chaque pharmacie dispose de son propre espace isolé, d'une boutique en ligne personnalisable, et d'outils IA pour accompagner les patients.

**Cible utilisateurs :**
- 👨‍⚕️ Pharmaciens & gérants (dashboard complet ERP)
- 👩‍💼 Personnel de pharmacie (caissiers, gestionnaires stock)
- 🛒 Clients finaux (boutique en ligne + app mobile)
- 🏥 Inter-pharmacies (réseau d'urgence & transfert de stock)

---

## 🏗️ ARCHITECTURE TECHNIQUE COMPLÈTE

### Stack Recommandée & Justifiée

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| **Backend API** | Python 3.12 + FastAPI (async) | Performances, typage fort, docs auto OpenAPI |
| **ORM** | SQLAlchemy 2.0 + Alembic | Migrations robustes, multi-DB |
| **Base de données** | SQLite (dev) → PostgreSQL (prod Neon.tech) | Neon = free-tier PostgreSQL serverless |
| **Cache / Queue** | Redis (Upstash free tier) | Sessions, jobs async, sync offline |
| **Frontend Web** | Next.js 14 + TypeScript + Tailwind CSS | SSR/SSG, App Router, performance |
| **Graphiques** | Recharts + Chart.js | Dashboards analytiques |
| **App Mobile** | React Native (Expo) | Code partagé web/mobile, OTA updates |
| **App Desktop** | Electron + React | Windows installer, offline complet |
| **Auth** | JWT (HS256, 60min) + Refresh Token + bcrypt | Sécurité standard, stateless |
| **IA / LLM** | Claude API (claude-haiku-3 = moins cher) | Conseils médicaments, analyse ordonnances |
| **Offline Sync** | PouchDB (client) ↔ CouchDB-style API | Sync automatique à reconnexion |
| **Notifications** | Firebase Cloud Messaging (free) | Push mobile/web |
| **Rappels** | node-cron + Expo Notifications | Rappels médicaments locaux |
| **Fichiers** | Cloudinary free tier ou Supabase Storage | Upload ordonnances, images produits |
| **Email** | Resend.com (free 3000/mois) | Confirmations commandes |
| **Déploiement Backend** | Render.com (free tier) | Spin-down ok pour SaaS usage modéré |
| **Déploiement Frontend** | Vercel (free tier) | CDN global, previews auto |
| **Base de données prod** | Neon.tech (free PostgreSQL serverless) | 0.5 GB gratuit |
| **Cron Jobs** | Cron-job.org (free) | Keep-alive + tâches planifiées |
| **DNS / URL custom** | Cloudflare (free) | Slugs pharmacies custom |

### ⚠️ Contraintes Free-Tier à Respecter
```
- Render.com: cold start ~30s → implémenter skeleton loaders
- Neon.tech: max 0.5 GB → archivage automatique données anciennes
- Vercel: 100 GB bandwidth/mois → optimiser images avec next/image
- Firebase FCM: gratuit illimité notifications
- Upstash Redis: 10,000 req/jour free → cache intelligent uniquement
- Cron-job.org: keep-alive toutes les 14min pour éviter sleep Render
```

---

## 🗄️ MODÈLE DE DONNÉES COMPLET

### Multi-Tenancy : Isolation par `tenant_id`

```sql
-- RÈGLE ABSOLUE : Chaque table métier contient tenant_id
-- Row-Level Security PostgreSQL activé sur TOUTES les tables

-- ═══ TENANTS (Pharmacies) ═══
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,        -- URL boutique ex: pharmacie-centrale
  custom_domain VARCHAR(255),               -- domaine custom optionnel
  logo_url TEXT,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  license_number VARCHAR(100),              -- numéro agrément pharmacie
  wilaya VARCHAR(100),                      -- région/département
  coordinates POINT,                        -- géolocalisation
  billing_plan VARCHAR(50) DEFAULT 'free',  -- free|starter|pro|enterprise
  billing_expires_at TIMESTAMP,
  settings JSONB DEFAULT '{}',              -- config couleurs, horaires, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ═══ USERS ═══
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL,  -- super_admin|owner|pharmacist|cashier|customer
  avatar_url TEXT,
  date_of_birth DATE,
  gender VARCHAR(10),
  address TEXT,
  -- Wizard first login
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  -- Préférences
  language VARCHAR(10) DEFAULT 'fr',
  notification_preferences JSONB DEFAULT '{}',
  last_login_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ═══ PRODUITS / MÉDICAMENTS ═══
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),               -- DCI (Dénomination Commune Internationale)
  barcode VARCHAR(100),
  category_id UUID REFERENCES categories(id),
  department_id UUID REFERENCES departments(id),
  range_id UUID REFERENCES ranges(id),
  description TEXT,
  composition TEXT,                         -- principes actifs
  dosage_form VARCHAR(100),                -- comprimé, sirop, injection...
  dosage_strength VARCHAR(100),            -- 500mg, 250mg/5ml...
  unit_of_measure VARCHAR(50),             -- boîte, flacon, tube...
  requires_prescription BOOLEAN DEFAULT false,
  contraindications TEXT,
  side_effects TEXT,
  storage_conditions TEXT,
  manufacturer VARCHAR(255),
  country_of_origin VARCHAR(100),
  -- Prix
  purchase_price DECIMAL(10,2),
  selling_price DECIMAL(10,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 0,
  -- Stock
  current_stock INTEGER DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 5,
  max_stock INTEGER DEFAULT 1000,
  -- Visibilité boutique
  is_visible_in_shop BOOLEAN DEFAULT true,
  images JSONB DEFAULT '[]',
  -- Dates
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index performance multi-tenant
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_barcode ON products(tenant_id, barcode);

-- ═══ STOCK MOVEMENTS ═══
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  product_id UUID REFERENCES products(id),
  movement_type VARCHAR(50),  -- in|out|adjustment|return|transfer
  quantity INTEGER NOT NULL,
  reason VARCHAR(255),
  reference_id UUID,           -- lien vers vente, commande, inventaire
  unit_cost DECIMAL(10,2),
  performed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ═══ VENTES / CAISSE ═══
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  sale_number VARCHAR(50) UNIQUE,          -- numéro ticket
  customer_id UUID REFERENCES users(id),
  cashier_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending',    -- pending|completed|cancelled|refunded
  payment_method VARCHAR(50),             -- cash|card|mobile_money|credit
  subtotal DECIMAL(10,2),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2),
  change_amount DECIMAL(10,2),
  notes TEXT,
  prescription_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL
);

-- ═══ INVENTAIRES ═══
CREATE TABLE inventories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  type VARCHAR(50),     -- general|periodic|spot
  status VARCHAR(50) DEFAULT 'in_progress',
  started_by UUID REFERENCES users(id),
  validated_by UUID REFERENCES users(id),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  notes TEXT
);

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID REFERENCES inventories(id),
  tenant_id UUID NOT NULL,
  product_id UUID REFERENCES products(id),
  theoretical_stock INTEGER,
  counted_stock INTEGER,
  variance INTEGER GENERATED ALWAYS AS (counted_stock - theoretical_stock) STORED,
  unit_cost DECIMAL(10,2),
  notes TEXT
);

-- ═══ COMMANDES EN LIGNE ═══
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  order_number VARCHAR(50) UNIQUE,
  customer_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending',
  -- pending|confirmed|preparing|ready|delivered|cancelled
  delivery_type VARCHAR(50),   -- pickup|delivery
  delivery_address TEXT,
  subtotal DECIMAL(10,2),
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2),
  payment_status VARCHAR(50) DEFAULT 'unpaid',
  payment_method VARCHAR(50),
  prescription_url TEXT,       -- ordonnance uploadée
  ai_analysis JSONB,           -- analyse IA de l'ordonnance
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  tenant_id UUID NOT NULL,
  product_id UUID REFERENCES products(id),
  quantity INTEGER,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2)
);

-- ═══ RAPPELS MÉDICAMENTS ═══
CREATE TABLE medication_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255),          -- nom libre si hors catalogue
  dosage VARCHAR(100),                -- ex: 2 comprimés
  frequency VARCHAR(50),              -- daily|twice_daily|weekly|custom
  times JSONB,                        -- ["08:00", "20:00"]
  start_date DATE,
  end_date DATE,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ═══ TRANSFERTS INTER-PHARMACIES ═══
CREATE TABLE inter_pharmacy_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requesting_tenant_id UUID REFERENCES tenants(id),
  supplying_tenant_id UUID REFERENCES tenants(id),
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255),
  quantity_needed INTEGER,
  status VARCHAR(50) DEFAULT 'pending',
  -- pending|accepted|rejected|fulfilled
  urgency VARCHAR(20) DEFAULT 'normal',  -- normal|urgent|critical
  message TEXT,
  response_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ═══ BONS DE LIVRAISON ═══
CREATE TABLE delivery_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  slip_number VARCHAR(50) UNIQUE,
  supplier_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  total_amount DECIMAL(10,2),
  received_by UUID REFERENCES users(id),
  received_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE delivery_slip_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slip_id UUID REFERENCES delivery_slips(id),
  product_id UUID REFERENCES products(id),
  quantity_ordered INTEGER,
  quantity_received INTEGER,
  unit_cost DECIMAL(10,2),
  expiry_date DATE
);

-- ═══ DÉPENSES ═══
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  category VARCHAR(100),
  amount DECIMAL(10,2),
  description TEXT,
  date DATE DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES users(id),
  receipt_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ═══ CAISSE / CLÔTURE ═══
CREATE TABLE cash_register_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  cashier_id UUID REFERENCES users(id),
  opening_amount DECIMAL(10,2),
  closing_amount DECIMAL(10,2),
  expected_amount DECIMAL(10,2),
  difference DECIMAL(10,2),
  opened_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'open',
  notes TEXT
);

-- ═══ PLANS DE FACTURATION ═══
CREATE TABLE billing_plans (
  id VARCHAR(50) PRIMARY KEY,     -- free|starter|pro|enterprise
  name VARCHAR(100),
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  max_users INTEGER,
  max_products INTEGER,
  max_orders_per_month INTEGER,
  features JSONB,
  is_active BOOLEAN DEFAULT true
);

-- ═══ SYNC OFFLINE ═══
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID REFERENCES users(id),
  entity_type VARCHAR(100),    -- sale|stock_movement|order|etc.
  entity_id UUID,
  operation VARCHAR(20),       -- create|update|delete
  payload JSONB,
  synced BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP
);
```

---

## 🔐 SYSTÈME D'AUTHENTIFICATION & RÔLES

### Rôles et Permissions

```python
ROLES = {
    "super_admin": {
        "description": "Administrateur plateforme PharmaCloud",
        "permissions": ["*"]  # Tout
    },
    "owner": {
        "description": "Propriétaire de la pharmacie",
        "permissions": [
            "pharmacy:manage", "users:manage", "billing:manage",
            "reports:view", "inventory:manage", "products:manage",
            "sales:manage", "shop:manage", "settings:manage"
        ]
    },
    "pharmacist": {
        "description": "Pharmacien diplômé",
        "permissions": [
            "sales:create", "inventory:view", "products:view",
            "orders:manage", "prescriptions:validate",
            "inter_pharmacy:request"
        ]
    },
    "cashier": {
        "description": "Caissier",
        "permissions": [
            "sales:create", "products:view",
            "cash_register:manage", "customers:view"
        ]
    },
    "customer": {
        "description": "Client de la pharmacie",
        "permissions": [
            "shop:browse", "orders:own", "reminders:own",
            "ai_assistant:use", "inter_pharmacy:view_map"
        ]
    }
}
```

### JWT Strategy
```python
# Access Token: 60 minutes
# Refresh Token: 7 jours (stocké en HttpOnly cookie)
# Payload JWT:
{
  "sub": "user_id",
  "tenant_id": "tenant_uuid",
  "role": "pharmacist",
  "exp": 1234567890,
  "iat": 1234567890
}

# Middleware FastAPI : validation tenant_id sur CHAQUE requête
# PostgreSQL RLS : tenant_id filtré automatiquement
```

---

## 🧙 WIZARD PREMIER LOGIN (Obligatoire)

### Étapes pour un Propriétaire de Pharmacie
```
Étape 1 — Informations Pharmacie
  ├── Nom commercial de la pharmacie
  ├── Numéro d'agrément / licence
  ├── Adresse complète + wilaya/département
  ├── Téléphone principal
  ├── Email professionnel
  └── Logo (upload, optionnel)

Étape 2 — Configuration Boutique en Ligne
  ├── Slug URL personnalisé (ex: pharmacie-centrale-dakar)
  │     → Validation unicité en temps réel
  │     → Aperçu URL: pharmacloud.app/shop/[slug]
  ├── Couleurs de marque (picker couleur)
  ├── Description de la pharmacie
  ├── Horaires d'ouverture
  └── Activer/désactiver boutique en ligne

Étape 3 — Localisation & Inter-Pharmacies
  ├── Géolocalisation (auto ou manuelle via carte)
  ├── Rejoindre le réseau inter-pharmacies (oui/non)
  └── Rayon de recherche urgence (km)

Étape 4 — Premier Utilisateur Staff
  ├── Inviter pharmaciens/caissiers par email
  └── Définir leurs rôles

Étape 5 — Configuration Caisse
  ├── Méthodes de paiement acceptées
  ├── Montant d'ouverture caisse par défaut
  └── Impression tickets (imprimante thermique)

Étape 6 — Import Produits (optionnel)
  ├── Import CSV template fourni
  ├── Ou commencer manuellement
  └── Médicaments de base pré-chargés (base publique OMS)
```

### Étapes pour un Client (App Mobile)
```
Étape 1 — Identité
  ├── Prénom, Nom
  ├── Date de naissance
  ├── Genre
  └── Photo profil (optionnel)

Étape 2 — Contact
  ├── Numéro de téléphone (vérification SMS)
  └── Adresse de livraison principale

Étape 3 — Santé (optionnel, chiffré)
  ├── Allergies connues
  ├── Médicaments pris régulièrement
  └── Médecin traitant

Étape 4 — Notifications
  ├── Activer rappels médicaments
  ├── Notifications commandes
  └── Offres pharmacies proches
```

---

## 📱 MODULES FONCTIONNELS DÉTAILLÉS

### MODULE 1 : CAISSE (Point de Vente)

```
1.1 VENTE EN COURS
├── Scanner code-barres (caméra mobile ou douchette USB)
├── Recherche produit (nom, DCI, code)
├── Ajout au panier avec quantité
├── Gestion des remises (%, montant fixe)
├── Modes de paiement: espèces / carte / mobile money / crédit
├── Rendu monnaie automatique
├── Impression ticket (thermique + PDF)
├── Lier ordonnance à la vente
└── Vente avec ou sans client identifié

1.2 LISTE VENTES EN COURS (Pending)
├── Ventes mises en attente
├── Reprendre une vente suspendue
└── Timer d'expiration auto (30 min)

1.3 FILTRE CAISSE
├── Filtrer par: date, caissier, méthode paiement, statut
├── Export CSV/PDF
└── Totaux agrégés

1.4 CLÔTURE CAISSE
├── Récapitulatif shift: total espèces, carte, mobile
├── Saisie montant compté physiquement
├── Calcul écart automatique
├── Rapport clôture imprimable
└── Historique clôtures

1.5 ENREGISTREMENT DÉPENSES
├── Catégories: loyer, salaires, fournitures, etc.
├── Upload justificatif (photo)
├── Intégration rapport comptable
└── Export mensuel
```

### MODULE 2 : INVENTAIRE

```
2.1 INVENTAIRE GÉNÉRAL
├── Liste tous les produits avec stock actuel
├── Filtres: catégorie, département, gamme, alertes
├── Export PDF/Excel

2.2 INVENTAIRE PÉRIODIQUE
├── Sélectionner périmètre (département, gamme, tous)
├── Feuille de comptage (printable, mode tablette)
├── Saisie quantités comptées
├── Calcul variance automatique
├── Validation avec signature pharmacien
└── Ajustement stock post-validation

2.3 IMPRESSION FICHE INVENTAIRE
├── Template A4 avec codes-barres
└── Format tablette optimisé terrain

2.4 RÉSULTAT INVENTAIRE
├── Rapport variance: surplus / manquants
├── Valeur stock avant/après
├── Écarts par valeur décroissante
└── Historique tous inventaires

2.5 SAISIE INVENTAIRE (Mode Terrain)
├── Interface simplifiée plein écran
├── Scan code-barres → saisie quantité
├── Sauvegarde offline instantanée
└── Sync automatique à reconnexion

2.6 VÉRIFICATION STOCK
├── Alertes stock minimum dépassé
├── Produits en rupture (stock = 0)
├── Produits sous seuil critique
└── Suggestion réapprovisionnement automatique
```

### MODULE 3 : PRODUITS / MÉDICAMENTS

```
3.1 CRÉATION PRODUIT
├── Formulaire complet avec tous champs DB
├── Upload images (jusqu'à 5)
├── Scanner code-barres pour auto-remplissage
├── Recherche dans base médicaments OMS (API publique)
├── Config alertes péremption
└── Activer/désactiver dans boutique

3.2 LISTE GÉNÉRALE
├── Vue tableau avec filtres avancés
├── Tri par: nom, stock, prix, péremption
├── Actions rapides: éditer, ajuster stock, désactiver
├── Indicateurs visuels: faible stock 🔴, péremption proche 🟡
└── Recherche full-text

3.3 HISTORIQUE PRODUIT
├── Mouvements de stock (entrées/sorties/ajustements)
├── Historique prix d'achat
├── Ventes du produit (graphique)
└── Transferts inter-pharmacies

3.4 MÉTHODES DE PAIEMENT
├── Configurer modes acceptés
├── Paramétrer intégrations Wave/Orange Money (si dispo)
└── Crédit client: gérer les comptes crédit

3.5 ALERTES

3.5.1 Dates de Péremption Approchantes
├── Produits expirant dans 30/60/90 jours (configurable)
├── Tri par urgence
└── Action rapide: démarque promotionnelle

3.5.2 Liste Produits Périmés
├── Produits expirés non retirés
├── Process de retrait stock
└── Rapport pour destruction

3.5.3 Produits Dormants
├── Sans mouvement depuis X jours (configurable)
├── Valeur immobilisée
└── Suggestions: promotion, retour fournisseur
```

### MODULE 4 : BONS DE LIVRAISON

```
4.1 NOUVEAU BON (Format Standard)
├── Sélection fournisseur
├── Ajout lignes produits
├── Quantités commandées vs reçues
├── Dates péremption par lot
├── Prix d'achat unitaire
└── Validation → MAJ stock automatique

4.2 NOUVEAU BON (Nouveau Format)
├── Import depuis PDF fournisseur (OCR IA)
├── Validation manuelle ligne par ligne
└── Gestion des écarts de livraison

4.3 RECHERCHE BONS
├── Par date, fournisseur, référence
├── Statut: en attente / reçu / partiel
└── Export PDF

4.4 LISTE RETOURS
├── Retours fournisseurs initiés
├── Motifs de retour
├── Statut remboursement/avoir
└── Impact stock (retrait)

4.5 LISTE MOTIFS
├── Gestion référentiel motifs retour
└── Stats par motif
```

### MODULE 5 : DÉPARTEMENTS & ORGANISATION

```
5.1 LISTE DÉPARTEMENTS
├── Arborescence: Département > Gamme > Produit
├── Drag & drop réorganisation
├── Compteur produits par nœud
└── Activer/désactiver

5.2 LISTE GAMMES
├── Gammes par département
└── Couleur de codage visuel

5.3 PRODUITS NON ORGANISÉS
├── Produits sans département assigné
└── Affectation en masse

5.4 MODIFIER ORGANISATION
├── Renommer, fusionner, déplacer
└── Historique modifications
```

### MODULE 6 : RAPPORTS & ANALYTIQUE

```
6.1 RAPPORT VENTES
├── CA journalier/hebdo/mensuel/annuel
├── Graphiques évolution (Recharts)
├── Top produits vendus
├── Performance par caissier
├── Taux de marge
├── Comparaison période précédente
└── Export PDF/Excel

6.2 RECHERCHE VENTES DÉTAILLÉE
├── Filtres: date, client, produit, caissier, paiement
├── Vue ticket individuel
├── Annulation/remboursement depuis rapport
└── Total filtré en temps réel

6.3 VENTES DÉTAILLÉES
├── Ligne par ligne avec marges
└── Visualisation graphique

6.4 RAPPORT COMPTABLE
├── Synthèse recettes - dépenses
├── TVA collectée
├── Balance caisse
└── Export format comptable
```

### MODULE 7 : BOUTIQUE EN LIGNE (Shop)

```
7.1 URL PERSONNALISÉE
Format: https://pharmacloud.app/shop/{slug-custom}
Ou domaine propre (plan Pro+): https://pharmaciecentrale.com

7.2 PAGE D'ACCUEIL BOUTIQUE
├── Header avec logo + couleurs pharmacie
├── Bannière promotionnelle (configurable)
├── Catégories en vedette
├── Produits mis en avant
├── Barre de recherche intelligente (IA)
├── Heures d'ouverture
├── Adresse + carte
└── Bouton "Commander en urgence"

7.3 CATALOGUE
├── Filtres: catégorie, prix, disponibilité, ordonnance requise
├── Tri: pertinence, prix, popularité
├── Vue grille/liste
├── Badge: Disponible / Sur commande / Rupture
├── Prix affiché (ou "Contactez-nous" selon config)
└── Variantes prix: générique vs princeps

7.4 FICHE PRODUIT
├── Images galerie
├── Description complète
├── Composition / posologie (si autorisé)
├── "Nécessite une ordonnance" badge
├── Ajouter au panier
├── Quantité
├── Produits alternatifs (IA)
└── "Questions ? Demandez au pharmacien" (chat IA)

7.5 COMMANDE EN LIGNE
Étape 1 — Panier
  ├── Liste articles, quantités modifiables
  ├── Sous-total dynamique
  └── Promo code

Étape 2 — Ordonnance (si médicaments sous prescription)
  ├── Upload photo/PDF ordonnance
  ├── Saisie manuelle médicaments souhaités
  ├── Analyse IA: extraction médicaments + posologie
  ├── Génération rapport patient: comment prendre chaque médicament
  └── Validation pharmacien requise avant confirmation

Étape 3 — Livraison
  ├── Retrait en pharmacie (gratuit)
  ├── Livraison à domicile (si activé, frais config)
  └── Adresse de livraison

Étape 4 — Paiement
  ├── À la livraison / retrait
  ├── Mobile Money (Wave, Orange Money)
  └── Carte bancaire (si intégré)

Étape 5 — Confirmation
  ├── Email/SMS récapitulatif
  ├── Numéro de suivi
  └── Estimation délai

7.6 SUIVI COMMANDE (Client)
├── Timeline: Reçue → Confirmée → En préparation → Prête → Livrée
├── Notifications push à chaque étape
└── Contact pharmacie direct
```

### MODULE 8 : ASSISTANT IA INTÉGRÉ

```
8.1 CHATBOT PATIENT (Boutique + App)
Interface: Chat conversationnel en français

Fonctionnalités:
├── Conseils symptômes → médicaments suggérés
│     ex: "J'ai mal à la tête" → paracétamol, ibuprofène...
│     avec: description, posologie standard, précautions
├── Affichage prix: Bas 💚 / Moyen 🟡 / Élevé 🔴
│     (basé sur catalogue pharmacie en cours)
├── Alternatives génériques vs princeps
├── Vérification interactions médicamenteuses
│     (si le patient liste ses traitements)
├── Rappel: "Je suis un assistant, consultez un pharmacien pour tout traitement"
├── Ajout direct au panier depuis chat
└── Escalade vers pharmacien humain (chat live optionnel)

Prompt système IA:
"""
Tu es PharmIA, l'assistant pharmacie de [Nom Pharmacie].
Tu aides les clients à identifier des médicaments adaptés à leurs symptômes.
Tu réponds TOUJOURS en français.
Pour chaque médicament suggéré, affiche:
- Nom commercial + générique
- Usage principal
- Posologie adulte standard
- Contre-indications principales
- Fourchette de prix (bas/moyen/élevé)
IMPORTANT: Rappelle toujours de consulter un professionnel de santé.
Ne prescris jamais, ne diagnostiques jamais.
"""

8.2 ANALYSE ORDONNANCE IA
├── Upload image/PDF ordonnance
├── OCR + extraction médicaments (Claude Vision)
├── Génération rapport patient:
│     • Nom médicament
│     • Pourquoi ce médicament
│     • Comment le prendre (heure, alimentation)
│     • Durée du traitement
│     • Effets secondaires à surveiller
├── Correspondance avec catalogue pharmacie
├── Ajout direct au panier
└── Flag médicaments non disponibles → alternatives suggérées

8.3 IA PHARMACIEN (Dashboard)
├── Analyse tendances ventes
├── Alertes prédictives rupture stock
├── Suggestions réapprovisionnement
└── Détection anomalies (ventes suspectes)
```

### MODULE 9 : RAPPELS MÉDICAMENTS (App Mobile)

```
9.1 CREATION RAPPEL
├── Médicament (depuis catalogue ou saisie libre)
├── Dosage (ex: 1 comprimé, 5ml)
├── Fréquence: 
│     • 1x/jour, 2x/jour, 3x/jour
│     • Tous les X heures
│     • Certains jours de la semaine
│     • Personnalisé
├── Horaires (time picker)
├── Date début / date fin (ou durée traitement)
├── Instructions spéciales (avec repas, à jeun...)
├── Associer à une commande / ordonnance
└── Activer notification push

9.2 LISTE RAPPELS ACTIFS
├── Vue calendrier + liste
├── Statut: Pris ✅ / Oublié ❌ / En attente ⏳
├── Éditer, suspendre, supprimer
└── Historique observance (%)

9.3 NOTIFICATION PUSH
├── Notification locale (fonctionne offline)
├── Message: "💊 Il est l'heure de prendre [médicament] - [dosage]"
├── Actions rapides: "Pris" / "Reporter 30min"
└── Badge application (iOS/Android)

9.4 RAPPORT OBSERVANCE
├── Taux de prise par médicament
├── Graphique semaine/mois
├── Export PDF (pour médecin)
└── Partage sécurisé avec pharmacien
```

### MODULE 10 : RÉSEAU INTER-PHARMACIES

```
10.1 CARTE DES PHARMACIES
├── Vue carte (Google Maps / OpenStreetMap gratuit)
├── Toutes pharmacies PharmaCloud dans zone
├── Indicateurs: 
│     • 🟢 Ouvert maintenant
│     • 🔴 Fermé
│     • ⭐ Garde
├── Distance et trajet
├── Stock disponible (si pharmacie partage)
└── Contact direct

10.2 DEMANDE D'URGENCE (Pharmacie → Pharmacie)
├── Initié par: pharmacien/propriétaire connecté
├── Formulaire:
│     • Médicament recherché (nom + dosage)
│     • Quantité nécessaire
│     • Niveau urgence: Normal / Urgent / Critique
│     • Message optionnel
│     • Pharmacies cibles (toutes ou sélection)
├── Notification push aux pharmacies cibles
├── Réponse: Disponible (qté) / Non disponible
├── Coordination transfert ou envoi patient
└── Historique demandes

10.3 CONFIGURATION PARTAGE
├── Activer/désactiver visibilité sur réseau
├── Choisir produits visibles inter-pharmacies
├── Auto-répondre si stock > seuil
└── Règles de tarification inter-pharmacies

SÉCURITÉ: Les clients finaux voient uniquement:
- Localisation des pharmacies
- Nom et contact
- Statut ouvert/fermé
Ils ne voient PAS les stocks inter-pharmacies ni les détails ERP.
```

### MODULE 11 : PLANS DE FACTURATION

```javascript
BILLING_PLANS = {
  free: {
    name: "Gratuit",
    price: 0,
    limits: {
      users: 2,
      products: 100,
      monthly_orders: 50,
      online_shop: false,
      ai_assistant: false,
      inter_pharmacy: false,
      custom_domain: false,
      support: "email"
    }
  },
  starter: {
    name: "Starter",
    price_monthly: 9900,  // FCFA
    price_yearly: 89000,
    limits: {
      users: 5,
      products: 500,
      monthly_orders: 500,
      online_shop: true,
      ai_assistant: 100,   // requêtes/mois
      inter_pharmacy: true,
      custom_domain: false,
      support: "email + chat"
    }
  },
  pro: {
    name: "Pro",
    price_monthly: 24900,
    price_yearly: 220000,
    limits: {
      users: 20,
      products: "unlimited",
      monthly_orders: "unlimited",
      online_shop: true,
      ai_assistant: "unlimited",
      inter_pharmacy: true,
      custom_domain: true,
      analytics_advanced: true,
      support: "prioritaire"
    }
  },
  enterprise: {
    name: "Entreprise",
    price: "sur devis",
    limits: {
      users: "unlimited",
      products: "unlimited",
      monthly_orders: "unlimited",
      white_label: true,
      api_access: true,
      dedicated_support: true,
      sla: "99.9%"
    }
  }
}
```

---

## 🔄 SYNCHRONISATION OFFLINE

```javascript
// Stratégie: Offline-First avec PouchDB côté client

// ARCHITECTURE SYNC:
// App (PouchDB local) ←→ Sync API ←→ PostgreSQL

// Priorités de sync (ordre):
1. Ventes (critique business)
2. Mouvements stock
3. Commandes clients
4. Rappels médicaments
5. Données catalogue (lecture seule, sync quotidien)

// Gestion conflits:
// Strategy: Last-Write-Wins avec timestamp serveur
// Exception: stocks → merge additif (somme des mouvements)

// Indicateur UI:
// 🟢 En ligne | 🟡 Synchronisation... | 🔴 Hors ligne (X opérations en attente)

// Queue persistence:
// Electron: SQLite local
// React Native: AsyncStorage + SQLite via expo-sqlite
// Web PWA: IndexedDB

// Code sync service:
class SyncService {
  async syncWhenOnline() {
    const queue = await this.getOfflineQueue();
    for (const operation of queue) {
      try {
        await this.sendToServer(operation);
        await this.markSynced(operation.id);
      } catch (e) {
        await this.handleConflict(operation, e);
      }
    }
  }
  
  onConnectivityRestored() {
    // Déclenché par: navigator.onLine + ping API
    this.syncWhenOnline();
    this.showToast("Connexion rétablie — Synchronisation en cours...");
  }
}
```

---

## 🎨 DESIGN SYSTEM & UI/UX

### Identité Visuelle PharmaCloud

```css
/* PALETTE COULEURS */
:root {
  /* Primaires */
  --color-primary: #0B6E4F;        /* Vert pharmacie profond */
  --color-primary-light: #12A87A;  /* Vert action */
  --color-primary-dark: #084D38;   /* Vert foncé */
  
  /* Secondaires */
  --color-accent: #F59E0B;         /* Ambre — urgences, alertes */
  --color-danger: #DC2626;         /* Rouge — erreurs, ruptures */
  --color-success: #16A34A;        /* Vert succès */
  --color-info: #2563EB;           /* Bleu info */
  
  /* Neutres */
  --color-bg: #F8FAFB;
  --color-surface: #FFFFFF;
  --color-border: #E2E8F0;
  --color-text-primary: #0F172A;
  --color-text-secondary: #64748B;
  --color-text-muted: #94A3B8;
  
  /* Sidebar */
  --sidebar-bg: #0B6E4F;
  --sidebar-text: #E8F5F0;
  --sidebar-active: #12A87A;
}

/* TYPOGRAPHIE */
/* Display: "Plus Jakarta Sans" — moderne, lisible en petite taille */
/* Body: "Inter" — excellent rendu écrans variés */
/* Données/Mono: "JetBrains Mono" — prix, codes, quantités */

/* COMPOSANTS CLÉS */
/* Cards: border-radius 12px, shadow légère, fond blanc */
/* Badges stock: pill colorés (rouge/jaune/vert) */
/* Tableaux: alternance lignes, hover highlight */
/* Modaux: overlay semi-transparent, animation slide-up */
/* Notifications: toast coin bas-droit, 4s auto-dismiss */
```

### Navigation Principale (Sidebar)

```
DASHBOARD  ─────────────────────────
  📊 Vue d'ensemble

CAISSE  ────────────────────────────
  🖥️  Nouvelle vente
  ⏳ En cours
  📋 Historique ventes
  💰 Clôture caisse
  💸 Dépenses

STOCK  ─────────────────────────────
  📦 Produits
  🏷️  Catégories
  📊 Inventaire
  🚚 Bons de livraison
  ↩️  Retours

BOUTIQUE EN LIGNE  ──────────────────
  🛒 Commandes
  🏪 Aperçu boutique
  ⚙️  Paramètres boutique

RÉSEAU  ────────────────────────────
  🗺️  Carte pharmacies
  🆘 Demandes urgence

RAPPORTS  ──────────────────────────
  📈 Ventes
  💹 Comptabilité
  📦 Stock

PARAMÈTRES  ────────────────────────
  👥 Utilisateurs
  💳 Facturation
  ⚙️  Pharmacie
  🔔 Notifications
```

---

## 📁 STRUCTURE DES FICHIERS

```
pharmacloud/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app factory
│   │   ├── config.py                  # Pydantic settings
│   │   ├── database.py                # SQLAlchemy engine
│   │   ├── dependencies.py            # JWT, tenant resolution
│   │   ├── models/                    # SQLAlchemy models
│   │   │   ├── tenant.py
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   ├── sale.py
│   │   │   ├── inventory.py
│   │   │   ├── order.py
│   │   │   ├── reminder.py
│   │   │   └── inter_pharmacy.py
│   │   ├── schemas/                   # Pydantic schemas (validation)
│   │   │   └── [même structure]
│   │   ├── routers/                   # Routes API
│   │   │   ├── auth.py
│   │   │   ├── tenants.py
│   │   │   ├── users.py
│   │   │   ├── products.py
│   │   │   ├── sales.py
│   │   │   ├── inventory.py
│   │   │   ├── orders.py
│   │   │   ├── shop.py
│   │   │   ├── reminders.py
│   │   │   ├── inter_pharmacy.py
│   │   │   ├── ai.py
│   │   │   ├── reports.py
│   │   │   ├── billing.py
│   │   │   └── sync.py
│   │   ├── services/                  # Business logic
│   │   │   ├── ai_service.py          # Claude API
│   │   │   ├── sync_service.py        # Offline sync
│   │   │   ├── notification_service.py
│   │   │   ├── billing_service.py
│   │   │   └── report_service.py
│   │   └── utils/
│   │       ├── tenant_middleware.py   # RLS middleware
│   │       ├── pdf_generator.py
│   │       └── barcode.py
│   ├── alembic/                       # Migrations DB
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                          # Next.js 14
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── wizard/page.tsx        # Onboarding wizard
│   │   ├── (dashboard)/               # Layout protégé
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # Dashboard
│   │   │   ├── caisse/
│   │   │   ├── produits/
│   │   │   ├── inventaire/
│   │   │   ├── bons-livraison/
│   │   │   ├── boutique/
│   │   │   ├── commandes/
│   │   │   ├── reseau/
│   │   │   ├── rapports/
│   │   │   └── parametres/
│   │   └── shop/
│   │       └── [slug]/                # Boutique publique
│   │           ├── page.tsx
│   │           ├── catalogue/
│   │           ├── produit/[id]/
│   │           ├── panier/
│   │           └── commande/
│   ├── components/
│   │   ├── ui/                        # shadcn/ui composants
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── pos/                       # Point de vente
│   │   ├── shop/                      # Boutique client
│   │   ├── ai/                        # Chat IA
│   │   └── shared/
│   ├── lib/
│   │   ├── api.ts                     # Client API
│   │   ├── offline-sync.ts            # PouchDB sync
│   │   ├── auth.ts
│   │   └── hooks/
│   ├── public/
│   └── next.config.js
│
├── mobile/                            # React Native Expo
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── home.tsx
│   │   │   ├── boutique.tsx
│   │   │   ├── rappels.tsx
│   │   │   ├── commandes.tsx
│   │   │   └── ia-assistant.tsx
│   │   ├── auth/
│   │   └── wizard/
│   ├── components/
│   ├── services/
│   │   ├── notifications.ts           # Expo Notifications
│   │   ├── offline.ts                 # SQLite local
│   │   └── api.ts
│   └── app.json
│
├── desktop/                           # Electron
│   ├── main.js                        # Process principal
│   ├── preload.js
│   ├── src/                           # React (partagé avec web)
│   ├── electron-builder.yml
│   └── installer/
│       └── windows-setup.nsi          # NSIS installer script
│
└── shared/                            # Code partagé
    ├── types/                         # TypeScript interfaces
    ├── constants/
    └── utils/
```

---

## 🔌 API ENDPOINTS COMPLETS

```python
# ══════════════════════════════════════
# AUTH
# ══════════════════════════════════════
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/me

# ══════════════════════════════════════
# ONBOARDING WIZARD
# ══════════════════════════════════════
GET    /api/v1/wizard/status
PUT    /api/v1/wizard/step/{step_number}
POST   /api/v1/wizard/complete

# ══════════════════════════════════════
# TENANT (Pharmacie)
# ══════════════════════════════════════
GET    /api/v1/tenant/me
PUT    /api/v1/tenant/me
GET    /api/v1/tenant/slug-check/{slug}
POST   /api/v1/tenant/logo

# ══════════════════════════════════════
# USERS
# ══════════════════════════════════════
GET    /api/v1/users
POST   /api/v1/users/invite
GET    /api/v1/users/{id}
PUT    /api/v1/users/{id}
DELETE /api/v1/users/{id}

# ══════════════════════════════════════
# PRODUCTS
# ══════════════════════════════════════
GET    /api/v1/products                    # Liste avec filtres
POST   /api/v1/products
GET    /api/v1/products/{id}
PUT    /api/v1/products/{id}
DELETE /api/v1/products/{id}
GET    /api/v1/products/{id}/history
POST   /api/v1/products/import-csv
GET    /api/v1/products/export-csv
GET    /api/v1/products/alerts/expiry
GET    /api/v1/products/alerts/low-stock
GET    /api/v1/products/alerts/dormant
GET    /api/v1/products/search?q={query}   # Recherche full-text
GET    /api/v1/products/barcode/{code}

# ══════════════════════════════════════
# CATEGORIES / DEPARTMENTS
# ══════════════════════════════════════
GET    /api/v1/categories
POST   /api/v1/categories
PUT    /api/v1/categories/{id}
DELETE /api/v1/categories/{id}
GET    /api/v1/departments
POST   /api/v1/departments
PUT    /api/v1/departments/reorder        # Drag & drop

# ══════════════════════════════════════
# SALES (Caisse)
# ══════════════════════════════════════
GET    /api/v1/sales
POST   /api/v1/sales
GET    /api/v1/sales/{id}
PUT    /api/v1/sales/{id}/status
POST   /api/v1/sales/{id}/refund
GET    /api/v1/sales/pending
GET    /api/v1/sales/report

# Cash Register
POST   /api/v1/cash-register/open
POST   /api/v1/cash-register/close
GET    /api/v1/cash-register/current
GET    /api/v1/cash-register/history

# Expenses
GET    /api/v1/expenses
POST   /api/v1/expenses
DELETE /api/v1/expenses/{id}

# ══════════════════════════════════════
# INVENTORY
# ══════════════════════════════════════
GET    /api/v1/inventories
POST   /api/v1/inventories
GET    /api/v1/inventories/{id}
PUT    /api/v1/inventories/{id}
POST   /api/v1/inventories/{id}/validate
GET    /api/v1/inventories/{id}/items
POST   /api/v1/inventories/{id}/items
PUT    /api/v1/inventories/{id}/items/{item_id}
GET    /api/v1/stock-movements

# ══════════════════════════════════════
# DELIVERY SLIPS
# ══════════════════════════════════════
GET    /api/v1/delivery-slips
POST   /api/v1/delivery-slips
GET    /api/v1/delivery-slips/{id}
PUT    /api/v1/delivery-slips/{id}/receive
GET    /api/v1/returns
POST   /api/v1/returns
GET    /api/v1/return-reasons

# ══════════════════════════════════════
# ORDERS (Boutique en ligne)
# ══════════════════════════════════════
GET    /api/v1/orders                      # Dashboard pharmacie
POST   /api/v1/orders                      # Client crée commande
GET    /api/v1/orders/{id}
PUT    /api/v1/orders/{id}/status
POST   /api/v1/orders/{id}/prescription    # Upload ordonnance

# ══════════════════════════════════════
# SHOP PUBLIC (sans auth, filtré par slug)
# ══════════════════════════════════════
GET    /api/v1/shop/{slug}                 # Infos pharmacie
GET    /api/v1/shop/{slug}/products        # Catalogue public
GET    /api/v1/shop/{slug}/products/{id}
POST   /api/v1/shop/{slug}/orders          # Passer commande

# ══════════════════════════════════════
# REMINDERS
# ══════════════════════════════════════
GET    /api/v1/reminders
POST   /api/v1/reminders
GET    /api/v1/reminders/{id}
PUT    /api/v1/reminders/{id}
DELETE /api/v1/reminders/{id}
GET    /api/v1/reminders/adherence-report

# ══════════════════════════════════════
# INTER-PHARMACY NETWORK
# ══════════════════════════════════════
GET    /api/v1/network/pharmacies          # Carte toutes pharmacies
GET    /api/v1/network/requests            # Mes demandes
POST   /api/v1/network/requests            # Nouvelle demande
PUT    /api/v1/network/requests/{id}/respond

# ══════════════════════════════════════
# AI
# ══════════════════════════════════════
POST   /api/v1/ai/chat                     # Chatbot patient
POST   /api/v1/ai/analyze-prescription     # Analyse ordonnance
POST   /api/v1/ai/stock-insights           # Insights pharmacien

# ══════════════════════════════════════
# REPORTS
# ══════════════════════════════════════
GET    /api/v1/reports/sales
GET    /api/v1/reports/inventory
GET    /api/v1/reports/accounting
GET    /api/v1/reports/export/{type}       # pdf|excel

# ══════════════════════════════════════
# BILLING
# ══════════════════════════════════════
GET    /api/v1/billing/plans
GET    /api/v1/billing/subscription
POST   /api/v1/billing/upgrade

# ══════════════════════════════════════
# SYNC (Offline)
# ══════════════════════════════════════
POST   /api/v1/sync/push                   # Upload queue offline
GET    /api/v1/sync/pull                   # Récupérer changements
GET    /api/v1/sync/status
```

---

## 🚀 PLAN DE DÉPLOIEMENT FREE-TIER

### Configuration Render.com (Backend)

```yaml
# render.yaml
services:
  - type: web
    name: pharmacloud-api
    env: python
    buildCommand: pip install -r requirements.txt && alembic upgrade head
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: pharmacloud-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: REDIS_URL
        sync: false
    autoDeploy: true

  # Keep-alive via cron-job.org toutes les 14 minutes
  # URL: https://pharmacloud-api.onrender.com/health
```

### Configuration Vercel (Frontend)

```json
// vercel.json
{
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://pharmacloud-api.onrender.com",
    "NEXT_PUBLIC_APP_NAME": "PharmaCloud"
  },
  "rewrites": [
    { "source": "/shop/:slug*", "destination": "/shop/[slug]" }
  ]
}
```

### Configuration Neon.tech (PostgreSQL)

```sql
-- Activer Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON products
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
-- Répéter pour chaque table métier
```

### Electron Builder (Windows Installer)

```yaml
# electron-builder.yml
appId: com.pharmacloud.app
productName: PharmaCloud
directories:
  output: dist
win:
  target: nsis
  icon: assets/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  installerLanguages: [French]
  language: 1036
  createDesktopShortcut: true
  createStartMenuShortcut: true
offline:
  # SQLite bundlé pour mode offline total
  # Sync automatique au démarrage si internet disponible
```

---

## ✅ CE QU'IL FAUT AJOUTER (vs architecture exemple)

### ➕ AJOUTS RECOMMANDÉS

1. **Ordonnances numériques** — Upload, OCR IA, historique par patient
2. **Programme fidélité clients** — Points, remises automatiques
3. **Alertes péremption proactives** — Email/SMS aux fournisseurs pour retours
4. **Mode veille (screensaver)** — Dashboard vitrine pour écran pharmacie
5. **QR Code commande** — Client scanne en magasin pour pré-remplir panier
6. **Gestion lots (batch)** — Traçabilité par numéro de lot
7. **Multi-caisse** — Plusieurs postes en simultané (plan Pro)
8. **Export comptable** — Format SAGE, EBP, QuickBooks
9. **API publique** — Pour intégration logiciels tiers (plan Enterprise)
10. **Rapport observance médicaments** — Données agrégées anonymisées

### ➖ CE QUI PEUT ÊTRE SIMPLIFIÉ (V1)

1. **Intégrations bancaires Wave/Orange Money** — Simuler en V1, intégrer en V2
2. **OCR ordonnances** — V1: upload simple, validation manuelle; V2: OCR automatique
3. **Chat live pharmacien/patient** — V1: bouton "Appeler", V2: chat intégré
4. **Domaine custom** — V1: sous-domaine seulement (pharmacloud.app/shop/slug)
5. **App desktop Electron** — V1: PWA installable, V2: Electron complet

---

## 🛡️ SÉCURITÉ — CHECKLIST OBLIGATOIRE

```
□ HTTPS partout (Let's Encrypt via Render/Vercel)
□ CORS strict: seulement domaines autorisés
□ Rate limiting: 100 req/min par IP, 1000 req/min par token
□ Input validation: Pydantic sur tous les schemas
□ SQL injection: SQLAlchemy ORM (pas de requêtes raw)
□ XSS: sanitisation HTML côté React
□ JWT: expiration courte + refresh rotation
□ Mots de passe: bcrypt cost factor 12
□ Upload fichiers: validation MIME type, taille max 10MB
□ Logs sécurité: tentatives connexion échouées
□ Données santé: chiffrement AES-256 pour données patient sensibles
□ RGPD/données personnelles: consentement explicite, droit à l'oubli
□ Multi-tenant: vérification tenant_id sur CHAQUE endpoint
□ Audit log: toutes actions critiques tracées avec user+timestamp
```

---

## 🌍 INTERNATIONALISATION

```javascript
// Langue par défaut: Français (fr)
// Langues supportées V1: fr, ar (arabe), wo (wolof - Sénégal)
// Langue V2: en

// i18n avec next-intl
// Format monnaie: FCFA (XOF) par défaut
// Format date: DD/MM/YYYY
// Format heure: 24h
// Décimales: virgule (1.500,00 FCFA)
```

---

## 📋 ORDRE DE DÉVELOPPEMENT RECOMMANDÉ

```
SPRINT 1 (Semaines 1-2): Fondations
├── Setup projet (monorepo Turborepo)
├── Backend: FastAPI + auth + multi-tenant
├── Base de données + migrations
├── Frontend: Next.js + layout + auth
└── CI/CD: GitHub Actions → Render + Vercel

SPRINT 2 (Semaines 3-4): Core ERP
├── Module Produits (CRUD complet)
├── Module Caisse (POS basique)
├── Module Inventaire
└── Dashboard principal

SPRINT 3 (Semaines 5-6): Boutique + Commandes
├── Shop public (catalogue + commandes)
├── Upload ordonnances
├── Gestion commandes pharmacien
└── Notifications email

SPRINT 4 (Semaines 7-8): IA + Mobile
├── Intégration Claude API (chatbot)
├── App React Native (Expo) — rappels
├── Notifications push Firebase
└── Sync offline basique

SPRINT 5 (Semaines 9-10): Réseau + Billing
├── Réseau inter-pharmacies
├── Plans de facturation
├── Wizard onboarding
└── Rapports avancés

SPRINT 6 (Semaines 11-12): Polish + Desktop
├── PWA (installable web)
├── Electron Windows installer
├── Tests E2E (Playwright)
├── Performance optimisations
└── Documentation API (OpenAPI auto)
```

---

## 🔧 VARIABLES D'ENVIRONNEMENT

```env
# Backend (.env)
DATABASE_URL=postgresql://user:pass@neon.tech/pharmacloud
SECRET_KEY=your-jwt-secret-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-haiku-3-5-sonnet  # Haiku = moins cher pour chatbot

REDIS_URL=redis://default:pass@upstash.io:6379
CLOUDINARY_URL=cloudinary://...
RESEND_API_KEY=re_...
FIREBASE_CREDENTIALS=./firebase-credentials.json

ENVIRONMENT=production
ALLOWED_ORIGINS=https://pharmacloud.vercel.app,https://*.pharmacloud.app

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://pharmacloud-api.onrender.com/api/v1
NEXT_PUBLIC_FIREBASE_CONFIG={"apiKey":"..."}
NEXT_PUBLIC_GOOGLE_MAPS_KEY=...
NEXT_PUBLIC_DEFAULT_CURRENCY=XOF
NEXT_PUBLIC_DEFAULT_LANGUAGE=fr
```

---

*Document généré par PharmaCloud Design System*
*Version: 1.0 | Langue: Français | Région: Afrique de l'Ouest (FCFA)*
