#!/bin/bash

# Configuration
VPS_USER="champ"
VPS_HOST="69.62.68.65"
VPS_PATH="/home/champ/learn-english/backups"
LOCAL_BACKUP_DIR="./backups"

# Create local backup directory
mkdir -p "$LOCAL_BACKUP_DIR"

echo "Connecting to VPS to list available backups..."

# List available backups
ssh "$VPS_USER@$VPS_HOST" "ls -lh $VPS_PATH/*.gz 2>/dev/null | tail -5"

echo ""
echo "Downloading latest backup..."

# Get the latest backup file
LATEST_BACKUP=$(ssh "$VPS_USER@$VPS_HOST" "ls -t $VPS_PATH/*.gz 2>/dev/null | head -1")

if [ -z "$LATEST_BACKUP" ]; then
    echo "No backup files found on VPS"
    exit 1
fi

BACKUP_FILENAME=$(basename "$LATEST_BACKUP")

# Download the backup
scp "$VPS_USER@$VPS_HOST:$LATEST_BACKUP" "$LOCAL_BACKUP_DIR/"

if [ $? -eq 0 ]; then
    echo "Downloaded: $LOCAL_BACKUP_DIR/$BACKUP_FILENAME"
    
    # Decompress the backup
    gunzip -k "$LOCAL_BACKUP_DIR/$BACKUP_FILENAME"
    echo "Decompressed backup ready for restore"
else
    echo "Download failed!"
    exit 1
fi