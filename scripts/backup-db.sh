#!/bin/bash
BACKUP_DIR="/var/backups/pharmacloud"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U pharmacloud -h localhost pharmacloud > "$BACKUP_DIR/pharmacloud_$DATE.sql"
gzip "$BACKUP_DIR/pharmacloud_$DATE.sql"
echo "✅ Backup: $BACKUP_DIR/pharmacloud_$DATE.sql.gz"
# Keep last 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
