#!/bin/bash

# VPS Connection Details
VPS_USER="champ"
VPS_HOST="69.62.68.65"

# Database Details
DB_NAME="my-local-db"
DB_USER="postgres"
DB_PASSWORD="redisPrismaNaver2025@"
LOCAL_CONTAINER="learn-english-postgres-1"

# Backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="db_backup_${TIMESTAMP}.sql"

echo "=== VPS Database Backup and Local Restore ==="
echo ""
echo "1. Creating backup on VPS..."

# Create backup on VPS with sudo
ssh -t ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
# Find the postgres container
CONTAINER=$(sudo docker ps --format "table {{.Names}}" | grep -E "postgres|db" | grep -v NAMES | head -1)
echo "Found PostgreSQL container: $CONTAINER"

# Create backup inside the container
sudo docker exec $CONTAINER pg_dump -U postgres -d my-local-db > /tmp/db_backup.sql
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
echo "4. Preparing local database for restore..."

# Kill existing connections to the database
docker exec ${LOCAL_CONTAINER} psql -U ${DB_USER} -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" postgres

# Drop and recreate database
echo "Dropping existing database..."
docker exec ${LOCAL_CONTAINER} psql -U ${DB_USER} -c "DROP DATABASE IF EXISTS \"${DB_NAME}\";" postgres
echo "Creating new database..."
docker exec ${LOCAL_CONTAINER} psql -U ${DB_USER} -c "CREATE DATABASE \"${DB_NAME}\";" postgres

echo ""
echo "5. Restoring backup to local database..."
cat ${BACKUP_FILE} | docker exec -i ${LOCAL_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME}

echo ""
echo "6. Verifying restore..."
TABLE_COUNT=$(docker exec ${LOCAL_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "Restored database has ${TABLE_COUNT} tables"

echo ""
echo "7. Running Prisma generate..."
npm run db:generate

echo ""
echo "=== Backup and restore completed! ==="
echo "Backup file: ${BACKUP_FILE}"
echo ""
echo "To view tables: docker exec -it ${LOCAL_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} -c '\\dt'"