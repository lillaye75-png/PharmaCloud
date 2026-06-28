#!/bin/bash
if [ -z "$1" ]; then echo "Usage: ./restore-db.sh <backup-file>"; exit 1; fi
gunzip -c "$1" | psql -U pharmacloud -h localhost pharmacloud
echo "✅ Restored from $1"
