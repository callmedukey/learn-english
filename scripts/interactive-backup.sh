#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Interactive VPS Database Backup Script ===${NC}"
echo ""
echo -e "${YELLOW}This script will guide you through backing up your VPS database${NC}"
echo -e "${YELLOW}and restoring it to your local environment.${NC}"
echo ""

# Step 1: Get VPS container name
echo -e "${GREEN}Step 1: Finding PostgreSQL container on VPS${NC}"
echo "Please run this command after SSHing to your VPS:"
echo ""
echo -e "${BLUE}ssh champ@69.62.68.65${NC}"
echo ""
echo "Then run:"
echo -e "${BLUE}sudo docker ps | grep postgres${NC}"
echo ""
read -p "Enter the PostgreSQL container name from VPS: " VPS_CONTAINER

# Step 2: Create backup command
echo ""
echo -e "${GREEN}Step 2: Creating backup on VPS${NC}"
echo "Run this command on your VPS:"
echo ""
echo -e "${BLUE}sudo docker exec ${VPS_CONTAINER} pg_dump -U postgres -d my-local-db > ~/db_backup.sql${NC}"
echo ""
read -p "Press Enter after the backup is created..."

# Step 3: Download backup
echo ""
echo -e "${GREEN}Step 3: Downloading backup to local machine${NC}"
echo "Downloading backup file..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="vps_db_backup_${TIMESTAMP}.sql"
scp champ@69.62.68.65:~/db_backup.sql ./${BACKUP_FILE}

if [ -f "${BACKUP_FILE}" ]; then
    echo -e "${GREEN}✓ Backup downloaded successfully as ${BACKUP_FILE}${NC}"
    
    # Clean up remote file
    echo "Cleaning up remote backup..."
    ssh champ@69.62.68.65 "rm ~/db_backup.sql"
else
    echo -e "${YELLOW}⚠ Failed to download backup${NC}"
    exit 1
fi

# Step 4: Prepare local database
echo ""
echo -e "${GREEN}Step 4: Preparing local database${NC}"
echo "Terminating existing connections..."
docker exec learn-english-postgres-1 psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'my-local-db' AND pid <> pg_backend_pid();" postgres

echo "Dropping existing database..."
docker exec learn-english-postgres-1 psql -U postgres -c "DROP DATABASE IF EXISTS \"my-local-db\";" postgres

echo "Creating fresh database..."
docker exec learn-english-postgres-1 psql -U postgres -c "CREATE DATABASE \"my-local-db\";" postgres

# Step 5: Restore backup
echo ""
echo -e "${GREEN}Step 5: Restoring backup to local database${NC}"
cat ${BACKUP_FILE} | docker exec -i learn-english-postgres-1 psql -U postgres -d my-local-db

# Step 6: Verify
echo ""
echo -e "${GREEN}Step 6: Verifying restore${NC}"
TABLE_COUNT=$(docker exec learn-english-postgres-1 psql -U postgres -d my-local-db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo -e "Restored database has${BLUE}${TABLE_COUNT}${NC}tables"

# Step 7: Update Prisma
echo ""
echo -e "${GREEN}Step 7: Updating Prisma client${NC}"
npm run db:generate

echo ""
echo -e "${GREEN}=== ✓ Backup and restore completed! ===${NC}"
echo -e "Backup file saved as: ${BLUE}${BACKUP_FILE}${NC}"
echo ""
echo "You can verify the data with:"
echo -e "${BLUE}docker exec -it learn-english-postgres-1 psql -U postgres -d my-local-db${NC}"