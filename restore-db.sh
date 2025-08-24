#!/bin/bash

# Configuration
DB_NAME="my-local-db"
DB_USER="postgres"
DB_PASSWORD="redisPrismaNaver2025@"
DB_HOST="localhost"
DB_PORT="5432"
LOCAL_BACKUP_DIR="./backups"

# Find the most recent .sql file
RESTORE_FILE=$(ls -t $LOCAL_BACKUP_DIR/*.sql 2>/dev/null | head -1)

if [ -z "$RESTORE_FILE" ]; then
    echo "No SQL backup file found in $LOCAL_BACKUP_DIR"
    echo "Please run download-backup.sh first"
    exit 1
fi

echo "Found backup file: $RESTORE_FILE"
echo "WARNING: This will replace all data in the local database!"
read -p "Continue? (y/n): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled"
    exit 1
fi

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

echo "Restoring database from backup..."

# First, ensure the docker container is running
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Restore the database
docker exec -i $(docker-compose ps -q postgres) psql \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    < "$RESTORE_FILE"

if [ $? -eq 0 ]; then
    echo "Database restored successfully!"
    
    # Show table count
    docker exec $(docker-compose ps -q postgres) psql \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"
else
    echo "Restore failed!"
    exit 1
fi

unset PGPASSWORD