# Migration SQLite → PostgreSQL

## Prérequis
- PostgreSQL 16+ installé
- Base de données créée

## Étapes

1. **Exporter les données SQLite**
```bash
cd backend
sqlite3 pharmacloud.db .dump > dump.sql
```

2. **Adapter le dump pour PostgreSQL**
```bash
# Remplacer les types SQLite par PostgreSQL
sed -i 's/INTEGER PRIMARY KEY AUTOINCREMENT/SERIAL PRIMARY KEY/g' dump.sql
sed -i 's/TEXT/VARCHAR/g' dump.sql
sed -i 's/BLOB/BYTEA/g' dump.sql
```

3. **Configurer DATABASE_URL**
```env
DATABASE_URL=postgresql://pharmacloud:password@localhost:5432/pharmacloud
```

4. **Importer**
```bash
psql -U pharmacloud -h localhost pharmacloud < dump.sql
```

5. **Vérifier**
```bash
python -c "from app.database import engine; engine.connect()"
```

## Rollback
```bash
psql -U pharmacloud -h localhost -c "DROP DATABASE pharmacloud;"
```

## Production
- Utiliser un service managé (AWS RDS, Supabase, Railway)
- Activer les backups automatiques
- Configurer la réplication pour haute disponibilité
