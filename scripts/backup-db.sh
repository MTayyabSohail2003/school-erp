#!/bin/bash

# ==============================================================================
# SCHOOL ERP: AUTOMATED DB BACKUP SCRIPT
# Purpose: Nightly PostgreSQL Dumps with GFS Retention & Cloud Sync
# Version: 1.0.0
# ==============================================================================

# ── CONFIGURATION ─────────────────────────────────────────────────────────────
BACKUP_DIR="/mnt/Data/school/backups"
DB_CONTAINER_NAME="supabase_db"  # Change to your actual container name (e.g. 'db')
DB_USER="postgres"

# IMPORTANT: Path to your Supabase Storage volume on the host machine
# Usually found in: /var/lib/docker/volumes/supabase_storage/_data
STORAGE_PATH="/var/lib/docker/volumes/supabase_storage/_data"

DATE=$(date +%Y-%m-%d_%H-%M-%S)
MONTH=$(date +%Y-%m)
RETENTION_DAYS=7
LOG_FILE="/mnt/Data/school/backups/backup.log"

# Cloud Sync Config (Requires rclone configured with 'cloudflare-r2' remote)
CLOUD_REMOTE="cloudflare-r2:school-erp-backups"
ENABLE_CLOUD_SYNC=true
ENABLE_STORAGE_SYNC=true # Set to true to backup photos/documents

# ── INITIALIZATION ────────────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR/daily"
mkdir -p "$BACKUP_DIR/monthly"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "----------------------------------------------------------------"
echo "BACKUP STARTED: $(date)"
echo "----------------------------------------------------------------"

# ── STEP 1: DATABASE DUMP ─────────────────────────────────────────────────────
FILENAME="daily/db_backup_$DATE.sql.gz"
FULL_PATH="$BACKUP_DIR/$FILENAME"

echo "[1/4] Dumping database from container '$DB_CONTAINER_NAME'..."

# We use pg_dumpall to capture roles and all databases
docker exec -t "$DB_CONTAINER_NAME" pg_dumpall -c -U "$DB_USER" | gzip > "$FULL_PATH"

if [ $? -eq 0 ]; then
    echo "SUCCESS: Database dumped and compressed to $FILENAME"
else
    echo "ERROR: Database dump failed!"
    exit 1
fi

# ── STEP 2: MONTHLY SNAPSHOT ──────────────────────────────────────────────────
# If it's the 1st of the month, copy to monthly folder
if [ "$(date +%d)" == "01" ]; then
    echo "[2/4] First of the month detected. Saving monthly snapshot..."
    cp "$FULL_PATH" "$BACKUP_DIR/monthly/db_monthly_$MONTH.sql.gz"
fi

# ── STEP 3: CLOUD SYNC ────────────────────────────────────────────────────────
if [ "$ENABLE_CLOUD_SYNC" = true ]; then
    echo "[3/4] Syncing backups to Cloudflare R2 via rclone..."
    
    # Sync the entire backup directory to ensure Daily/Weekly/Monthly are all safe
    rclone sync "$BACKUP_DIR" "$CLOUD_REMOTE" --progress
    
    if [ $? -eq 0 ]; then
        echo "SUCCESS: Database cloud synchronization complete."
    else
        echo "WARNING: Database cloud synchronization failed."
    fi
fi

# ── STEP 4: STORAGE SYNC (Photos/Docs) ────────────────────────────────────────
# This part is optimized: It does NOT create a local zip (saves disk space)
# It only syncs NEW or CHANGED files (saves internet & CPU)
if [ "$ENABLE_STORAGE_SYNC" = true ] && [ -d "$STORAGE_PATH" ]; then
    echo "[4/5] Syncing student photos/documents to Cloudflare R2..."
    
    rclone sync "$STORAGE_PATH" "$CLOUD_REMOTE/storage" --progress --size-only
    
    if [ $? -eq 0 ]; then
        echo "SUCCESS: Storage files synchronized."
    else
        echo "WARNING: Storage synchronization failed. Check path: $STORAGE_PATH"
    fi
else
    echo "[4/5] Storage sync disabled or path not found. Skipping."
fi

# ── STEP 5: CLEANUP ───────────────────────────────────────────────────────────
echo "[5/5] Cleaning up local daily backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR/daily" -type f -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "----------------------------------------------------------------"
echo "BACKUP COMPLETED: $(date)"
echo "----------------------------------------------------------------"
