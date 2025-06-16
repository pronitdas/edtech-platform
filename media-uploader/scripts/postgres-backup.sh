#!/bin/bash

# PostgreSQL Backup Script
# Usage: ./postgres-backup.sh [database_name]

set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_DB=${1:-${POSTGRES_DB:-development}}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup filename
BACKUP_FILE="$BACKUP_DIR/${POSTGRES_DB}_backup_${DATE}.sql"

echo "Starting PostgreSQL backup..."
echo "Database: $POSTGRES_DB"
echo "User: $POSTGRES_USER"
echo "Backup file: $BACKUP_FILE"

# Create backup
pg_dump -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-password > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

echo "Backup completed: $BACKUP_FILE"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "${POSTGRES_DB}_backup_*.sql.gz" -mtime +7 -delete

echo "Old backups cleaned up (kept last 7 days)"
echo "Backup process completed successfully" 