#!/bin/bash
# Migration SQLite → PostgreSQL
# Usage: bash scripts/migrate-to-postgres.sh

set -e

echo "🔍 Vérification des prérequis..."
command -v psql >/dev/null 2>&1 || { echo "❌ psql requis"; exit 1; }
command -v python >/dev/null 2>&1 || { echo "❌ python requis"; exit 1; }

PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"
PG_USER="${PG_USER:-pharmacloud}"
PG_PASS="${PG_PASS:-pharmacloud_secret}"
PG_DB="${PG_DB:-pharmacloud}"

export DATABASE_URL="postgresql://${PG_USER}:${PG_PASS}@${PG_HOST}:${PG_PORT}/${PG_DB}"

echo "📦 Installation des dépendances..."
pip install psycopg2-binary alembic

echo "🗄️  Création de la base de données..."
PGPASSWORD=$PG_PASS psql -h $PG_HOST -p $PG_PORT -U $PG_USER -tc \
  "SELECT 1 FROM pg_database WHERE datname = '$PG_DB'" | grep -q 1 \
  || PGPASSWORD=$PG_PASS psql -h $PG_HOST -p $PG_PORT -U $PG_USER -c "CREATE DATABASE $PG_DB"

echo "🔄 Exécution des migrations Alembic..."
cd backend
alembic upgrade head

echo "🌱 Seed de la base de données..."
python -m app.seed

echo "✅ Migration terminée! Base PostgreSQL prête sur $PG_HOST:$PG_PORT/$PG_DB"
