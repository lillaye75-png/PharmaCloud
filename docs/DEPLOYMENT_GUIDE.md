# Guide de Déploiement — PharmaCloud

## Option 1: Render (recommandé — gratuit)

### Prérequis
- Compte GitHub
- Compte Render (https://render.com)

### Étapes
1. **Forker/Cloner** le repo sur GitHub
2. **Aller sur Render** → New → Blueprint
3. **Connecter votre repo** GitHub
4. **Configurer les secrets** dans Render Dashboard:
   - `SECRET_KEY` → générer avec `python -c "import secrets; print(secrets.token_hex(32))"`
5. **Déployer** — Render crée automatiquement:
   - Backend (FastAPI) sur `https://pharmacloud-backend.onrender.com`
   - Frontend (Next.js) sur `https://pharmacloud-frontend.onrender.com`
   - Base de données PostgreSQL

### Variables d'environnement (Render Dashboard)
| Variable | Valeur |
|----------|--------|
| `SECRET_KEY` | Générée automatiquement |
| `ENVIRONMENT` | `production` |
| `ALLOWED_ORIGINS` | `https://pharmacloud-frontend.onrender.com` |
| `NEXT_PUBLIC_API_URL` | `https://pharmacloud-backend.onrender.com/api/v1` |

## Option 2: Railway (alternative gratuite)

1. Créer un compte sur https://railway.app
2. New Project → Deploy from GitHub repo
3. Railway détecte automatiquement Python et Node
4. Ajouter PostgreSQL via Railway Dashboard
5. Configurer les variables d'environnement

## Option 3: VPS (Dedicated Server)

### Prérequis
- Serveur Ubuntu 22.04+ avec Docker
- Domaine pointé vers le serveur

### Installation rapide
```bash
# Cloner le repo
git clone https://github.com/votre-repo/pharmacloud.git
cd pharmacloud

# Lancer le script de déploiement
bash scripts/deploy.sh

# Ou avec Docker
docker compose -f docker-compose.prod.yml up -d
```

### Nginx SSL (Let's Encrypt)
```bash
sudo apt install nginx certbot python3-certbot-nginx
sudo nano /etc/nginx/sites-available/pharmacloud
# Configurer avec le fichier nginx/pharmacloud.conf
sudo certbot --nginx -d pharmacie.sn
```

## CI/CD
Le fichier `.github/workflows/ci.yml` exécute automatiquement:
1. `backend-lint` — Vérification syntaxique Python
2. `frontend-tsc` — Vérification TypeScript
3. `backend-tests` — Tests pytest
4. `deploy` — Déploiement automatique sur Render (si configuré)

Pour activer le déploiement automatique:
1. Aller sur Render → Dashboard → Votre service → Settings
2. Copier le `Service ID` et générer un `Deploy Key`
3. Ajouter les secrets GitHub:
   - `RENDER_SERVICE_ID`: votre service ID
   - `RENDER_DEPLOY_KEY`: votre deploy key
