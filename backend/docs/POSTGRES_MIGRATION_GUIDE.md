# Migration PostgreSQL — Guide Complet

## Prérequis
- PostgreSQL 16+ installé (local ou distant)
- Base de données créée: `CREATE DATABASE pharmacloud;`
- Les variables d'environnement configurées

## Étape 1: Installer PostgreSQL (local)

### Windows
```powershell
# Télécharger depuis https://www.postgresql.org/download/windows/
# Ou via winget (si disponible)
winget install PostgreSQL.PostgreSQL 16
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Docker (recommandé)
```bash
docker run -d --name pharmacloud-db \
  -e POSTGRES_USER=pharmacloud \
  -e POSTGRES_PASSWORD=pharmacloud_secret \
  -e POSTGRES_DB=pharmacloud \
  -p 5432:5432 \
  postgres:16-alpine
```

## Étape 2: Configurer les variables d'environnement

```env
DATABASE_URL=postgresql://pharmacloud:pharmacloud_secret@localhost:5432/pharmacloud
```

## Étape 3: Exécuter les migrations

```bash
cd backend
alembic upgrade head
```

## Étape 4: Seed la base de données

```bash
python -m app.seed
```

## Étape 5: Vérifier

```bash
python -m pytest tests/ -v
```

## Rollback
```bash
alembic downgrade -1
```

## Commandes utiles Alembic
| Commande | Description |
|----------|-------------|
| `alembic current` | Version actuelle |
| `alembic history` | Historique des migrations |
| `alembic upgrade head` | Appliquer toutes les migrations |
| `alembic downgrade -1` | Reculer d'une migration |
| `alembic revision --autogenerate -m "description"` | Créer une migration automatique |
