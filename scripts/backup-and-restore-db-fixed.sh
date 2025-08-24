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

# Create backup on VPS (using sudo for docker commands)
ssh -t ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
# Find the postgres container with sudo
CONTAINER=$(sudo docker ps --format "table {{.Names}}" | grep -i postgres | grep -v NAMES | head -1)
if [ -z "$CONTAINER" ]; then
    echo "Error: No PostgreSQL container found!"
    echo "Available containers:"
    sudo docker ps --format "table {{.Names}}\t{{.Image}}"
    exit 1
fi
echo "Found PostgreSQL container: $CONTAINER"

# Create backup inside the container with sudo
sudo docker exec $CONTAINER pg_dump -U postgres -d my-local-db > /tmp/db_backup.sql
if [ $? -eq 0 ]; then
    echo "Backup created successfully at /tmp/db_backup.sql"
else
    echo "Error creating backup!"
    exit 1
fi
ENDSSH

# Check if SSH command succeeded
if [ $? -ne 0 ]; then
    echo "Error: Failed to create backup on VPS"
    exit 1
fi

echo ""
echo "2. Copying backup from VPS to local machine..."
# Copy backup from VPS to local
scp ${VPS_USER}@${VPS_HOST}:/tmp/db_backup.sql ./${BACKUP_FILE}

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Failed to download backup file"
    exit 1
fi

# Clean up remote backup
ssh ${VPS_USER}@${VPS_HOST} "rm /tmp/db_backup.sql"

echo ""
echo "3. Backup downloaded as: ${BACKUP_FILE}"
echo ""
echo "4. Restoring to local database..."

# First, terminate all connections to the database
echo "Terminating existing database connections..."
docker exec ${CONTAINER_NAME} psql -U ${DB_USER} postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();"

# Drop and recreate database
echo "Dropping existing database and recreating..."
docker exec ${CONTAINER_NAME} psql -U ${DB_USER} postgres -c "DROP DATABASE IF EXISTS \"${DB_NAME}\";"
docker exec ${CONTAINER_NAME} psql -U ${DB_USER} postgres -c "CREATE DATABASE \"${DB_NAME}\";"

echo "Restoring backup..."
cat ${BACKUP_FILE} | docker exec -i ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME}

if [ $? -eq 0 ]; then
    echo "Restore completed successfully!"
else
    echo "Error during restore!"
    exit 1
fi

echo ""
echo "5. Running Prisma migrations to ensure schema is up to date..."
npm run db:generate

echo ""
echo "=== Backup and restore completed successfully! ==="
echo "Backup file saved as: ${BACKUP_FILE}"
echo ""
echo "You can verify the restore with:"
echo "docker exec -it ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -c '\\dt'"