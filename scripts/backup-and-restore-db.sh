#!/bin/bash

# VPS Connection Details
VPS_USER="champ"
VPS_HOST="69.62.68.65"

# Database Details (from docker-compose.yaml)
DB_NAME="my-local-db"
DB_USER="postgres"
DB_PASSWORD="redisPrismaNaver2025@"
CONTAINER_NAME="learn-english-postgres-1"

# Backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="db_backup_${TIMESTAMP}.sql"

echo "=== Database Backup and Restore Script ==="
echo ""
echo "1. Creating backup on VPS..."

# Create backup on VPS
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
# Find the postgres container (might have a different name on VPS)
CONTAINER=$(docker ps --format "table {{.Names}}" | grep -E "postgres|db" | head -1)
echo "Found PostgreSQL container: $CONTAINER"

# Create backup inside the container
docker exec $CONTAINER pg_dump -U postgres -d my-local-db > /tmp/db_backup.sql
echo "Backup created at /tmp/db_backup.sql"
ENDSSH

echo ""
echo "2. Copying backup from VPS to local machine..."
# Copy backup from VPS to local
scp ${VPS_USER}@${VPS_HOST}:/tmp/db_backup.sql ./${BACKUP_FILE}

# Clean up remote backup
ssh ${VPS_USER}@${VPS_HOST} "rm /tmp/db_backup.sql"

echo ""
echo "3. Backup downloaded as: ${BACKUP_FILE}"
echo ""
echo "4. Restoring to local database..."

# Stop local app connections if running
echo "Stopping any local app connections..."

# Restore to local database
echo "Dropping existing database and recreating..."
docker exec -e PGPASSWORD="${DB_PASSWORD}" ${CONTAINER_NAME} psql -U ${DB_USER} -c "DROP DATABASE IF EXISTS \"${DB_NAME}\";"
docker exec -e PGPASSWORD="${DB_PASSWORD}" ${CONTAINER_NAME} psql -U ${DB_USER} -c "CREATE DATABASE \"${DB_NAME}\";"

echo "Restoring backup..."
docker exec -i -e PGPASSWORD="${DB_PASSWORD}" ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} < ${BACKUP_FILE}

echo ""
echo "5. Running Prisma migrations to ensure schema is up to date..."
npm run db:generate

echo ""
echo "=== Backup and restore completed successfully! ==="
echo "Backup file saved as: ${BACKUP_FILE}"
echo ""
echo "You can verify the restore with:"
echo "docker exec -it ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -c '\\dt'"