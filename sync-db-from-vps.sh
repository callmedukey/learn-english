#!/bin/bash

# Complete PostgreSQL Database Sync Script
# This script runs your existing backup-db.sh on VPS and restores it locally
# Run this on your LOCAL machine

set -e  # Exit on error

# Configuration
VPS_USER="champ"
VPS_HOST="69.62.68.65"
VPS_PROJECT_PATH="/home/champ/learn-english"

echo "=== PostgreSQL Database Sync from VPS ==="
echo "VPS: $VPS_USER@$VPS_HOST"
echo "Project: $VPS_PROJECT_PATH"
echo ""

# Step 1: Run backup-db.sh on VPS
echo "Step 1: Creating backup on VPS using backup-db.sh..."

# Run the existing backup script with sudo
ssh -t "$VPS_USER@$VPS_HOST" "cd $VPS_PROJECT_PATH && sudo ./backup-db.sh"

if [ $? -ne 0 ]; then
    echo "✗ Failed to create backup on VPS"
    exit 1
fi

# Get the latest backup file
echo "Finding latest backup file..."
LATEST_BACKUP=$(ssh "$VPS_USER@$VPS_HOST" "ls -t $VPS_PROJECT_PATH/backups/*.gz 2>/dev/null | head -1")

if [ -z "$LATEST_BACKUP" ]; then
    echo "✗ No backup file found on VPS"
    exit 1
fi

BACKUP_FILENAME=$(basename "$LATEST_BACKUP")
echo "✓ Found backup: $BACKUP_FILENAME"

# Step 2: Download backup
echo ""
echo "Step 2: Downloading backup from VPS..."
LOCAL_BACKUP_DIR="./backups"
mkdir -p "$LOCAL_BACKUP_DIR"

# Download the backup
scp "$VPS_USER@$VPS_HOST:$LATEST_BACKUP" "$LOCAL_BACKUP_DIR/"

if [ $? -eq 0 ]; then
    echo "✓ Downloaded: $BACKUP_FILENAME"
    
    # Decompress
    echo "Decompressing backup..."
    gunzip -f "$LOCAL_BACKUP_DIR/$BACKUP_FILENAME"
    SQL_FILE="$LOCAL_BACKUP_DIR/${BACKUP_FILENAME%.gz}"
    echo "✓ Ready to restore: $(basename $SQL_FILE)"
else
    echo "✗ Failed to download backup"
    exit 1
fi

# Step 3: Restore to local database
echo ""
echo "Step 3: Restoring to local database..."
echo ""
echo "⚠️  WARNING: This will REPLACE ALL DATA in your local database!"
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY == "yes" ]]; then
    echo "Restore cancelled"
    echo "Backup file saved at: $SQL_FILE"
    exit 0
fi

# Check if docker-compose file exists
if [ ! -f "docker-compose.yml" ] && [ ! -f "docker-compose.yaml" ]; then
    echo "Error: docker-compose.yml not found in current directory"
    echo "Please run this script from your local project directory"
    exit 1
fi

# Start local PostgreSQL
echo "Starting local PostgreSQL..."
docker-compose up -d postgres >/dev/null 2>&1

# Wait for PostgreSQL to be ready
echo -n "Waiting for PostgreSQL to be ready"
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
        echo " ✓"
        break
    fi
    echo -n "."
    sleep 1
done

# Get local container ID
LOCAL_CONTAINER=$(docker-compose ps -q postgres)

if [ -z "$LOCAL_CONTAINER" ]; then
    echo "Error: Local PostgreSQL container not found"
    echo "Make sure docker-compose.yml is in the current directory"
    exit 1
fi

# Restore the database
echo "Restoring database..."
docker exec -i -e PGPASSWORD="redisPrismaNaver2025@" $LOCAL_CONTAINER \
    psql -U postgres -d my-local-db < "$SQL_FILE" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ Database restored successfully!"
    
    # Show statistics
    echo ""
    echo "Database Statistics:"
    echo "-------------------"
    docker exec -e PGPASSWORD="redisPrismaNaver2025@" $LOCAL_CONTAINER \
        psql -U postgres -d my-local-db --tuples-only -c "
        SELECT 'Tables: ' || COUNT(*)
        FROM information_schema.tables 
        WHERE table_schema = 'public';" 2>/dev/null | xargs
    
    docker exec -e PGPASSWORD="redisPrismaNaver2025@" $LOCAL_CONTAINER \
        psql -U postgres -d my-local-db --tuples-only -c "
        SELECT 'Total rows: ' || COALESCE(SUM(n_live_tup), 0)
        FROM pg_stat_user_tables;" 2>/dev/null | xargs
    
    docker exec -e PGPASSWORD="redisPrismaNaver2025@" $LOCAL_CONTAINER \
        psql -U postgres -d my-local-db --tuples-only -c "
        SELECT 'Database size: ' || pg_size_pretty(pg_database_size('my-local-db'));" 2>/dev/null | xargs
    
    echo ""
    echo "=== ✓ Sync completed successfully! ==="
    echo "Backup saved at: $SQL_FILE"
    echo ""
    echo "You can now use your local database with the data from VPS!"
else
    echo "✗ Restore failed!"
    echo "Backup file is saved at: $SQL_FILE"
    echo "You can try to restore it manually with:"
    echo "docker exec -i your_postgres_container psql -U postgres -d my-local-db < $SQL_FILE"
    exit 1
fi