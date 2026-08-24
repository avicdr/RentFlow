#!/bin/bash
# scripts/backup-mongo.sh — Daily MongoDB backup
# Crontab: 0 2 * * * /var/www/rentflow/scripts/backup-mongo.sh >> /var/log/rentflow/mongo-backup.log 2>&1

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/var/backups/mongodb"
MONGO_URI="mongodb://rentflow_app:CHANGE_PASSWORD@127.0.0.1:27017/rentflow?authSource=rentflow"
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."
mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR/$DATE" --gzip
tar -czf "$BACKUP_DIR/rentflow-$DATE.tar.gz" -C "$BACKUP_DIR" "$DATE"
rm -rf "$BACKUP_DIR/$DATE"
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +"$RETENTION_DAYS" -delete
echo "[$(date)] Backup complete: rentflow-$DATE.tar.gz"
