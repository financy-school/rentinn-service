# #!/bin/bash

# # ========= CONFIGURATION =========
# # Source EC2 (where DB currently exists)
# SOURCE_KEY="terraform/test.pem"
# SOURCE_USER="ubuntu"
# SOURCE_IP="13.203.202.112"

# # Destination EC2 (where DB will be imported)
# DEST_KEY="terraform/test.pem"
# DEST_USER="ubuntu"
# DEST_IP="3.7.125.170"

# # Database settings
# # Source DB
# SRC_DB_HOST="localhost"
# SRC_DB_PORT="3306"
# SRC_DB_NAME="myapp_db"
# SRC_DB_USER="root"         # Assuming root unless specified
# SRC_DB_PASS="mypassword"

# # Destination DB
# DEST_DB_HOST="localhost"   # inside the EC2 instance, not docker directly
# DEST_DB_PORT="3306"
# DEST_DB_NAME="rentinn_db"
# DEST_DB_USER="rentinn_user"
# DEST_DB_PASS="RentInn@User2024"

# # Temporary dump file name
# DUMP_FILE="dump.sql"
# # =================================

# echo "🔄 Step 1: Dumping source DB from $SOURCE_IP..."
# ssh -i "$SOURCE_KEY" "$SOURCE_USER@$SOURCE_IP" \
#   "mysqldump -h $SRC_DB_HOST -P $SRC_DB_PORT -u $SRC_DB_USER -p'$SRC_DB_PASS' $SRC_DB_NAME > $DUMP_FILE"

# echo "📤 Step 2: Copying dump file from source to local..."
# scp -i "$SOURCE_KEY" "$SOURCE_USER@$SOURCE_IP:$DUMP_FILE" .

# echo "📦 Step 3: Sending dump file to destination EC2..."
# scp -i "$DEST_KEY" "$DUMP_FILE" "$DEST_USER@$DEST_IP:~"

# echo "🧹 Step 4: Cleaning up local dump file..."
# rm -f "$DUMP_FILE"

# echo "🛠️ Step 5: Creating destination DB on $DEST_IP if it doesn't exist..."
# ssh -i "$DEST_KEY" "$DEST_USER@$DEST_IP" \
#   "mysql -h $DEST_DB_HOST -P $DEST_DB_PORT -u $DEST_DB_USER -p'$DEST_DB_PASS' -e 'CREATE DATABASE IF NOT EXISTS $DEST_DB_NAME;'"

# echo "📥 Step 6: Importing dump into destination DB..."
# ssh -i "$DEST_KEY" "$DEST_USER@$DEST_IP" \
#   "mysql -h $DEST_DB_HOST -P $DEST_DB_PORT -u $DEST_DB_USER -p'$DEST_DB_PASS' $DEST_DB_NAME < $DUMP_FILE"

# echo "🧼 Step 7: Cleaning up dump file from destination EC2..."
# ssh -i "$DEST_KEY" "$DEST_USER@$DEST_IP" "rm -f $DUMP_FILE"

# echo "✅ Migration complete!"





#!/bin/bash

# ========= CONFIGURATION =========
# Destination EC2 (where DB will be imported)
DEST_KEY="terraform/test.pem"
DEST_USER="ubuntu"
DEST_HOST="3.7.125.170"

# Local dump file path (the file you already downloaded)
LOCAL_DUMP_FILE="$HOME/Downloads/dump.sql"

# Destination DB settings
DEST_DB_HOST="localhost"
DEST_DB_PORT="3306"
DEST_DB_NAME="rentinn_db"
DEST_DB_USER="rentinn_user"
DEST_DB_PASS="RentInn@User2024"

# Temporary dump file name on destination server
REMOTE_DUMP_FILE="dump.sql"
# =================================

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Step 1: Verifying local dump file exists...${NC}"
if [ ! -f "$LOCAL_DUMP_FILE" ]; then
    echo -e "${RED}❌ Error: Dump file not found at $LOCAL_DUMP_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dump file found: $LOCAL_DUMP_FILE${NC}"

echo -e "${BLUE}📦 Step 2: Uploading dump file to destination EC2 ($DEST_HOST)...${NC}"
scp -i "$DEST_KEY" "$LOCAL_DUMP_FILE" "$DEST_USER@$DEST_HOST:~/$REMOTE_DUMP_FILE"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Failed to upload dump file${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dump file uploaded successfully${NC}"

echo -e "${BLUE}🛠️ Step 3: Creating destination database if it doesn't exist...${NC}"
ssh -i "$DEST_KEY" "$DEST_USER@$DEST_HOST" \
  "mysql -h $DEST_DB_HOST -P $DEST_DB_PORT -u $DEST_DB_USER -p'$DEST_DB_PASS' -e 'CREATE DATABASE IF NOT EXISTS $DEST_DB_NAME;'"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Failed to create database${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Database ready${NC}"

echo -e "${BLUE}📥 Step 4: Importing dump into destination database...${NC}"
ssh -i "$DEST_KEY" "$DEST_USER@$DEST_HOST" \
  "mysql -h $DEST_DB_HOST -P $DEST_DB_PORT -u $DEST_DB_USER -p'$DEST_DB_PASS' $DEST_DB_NAME < $REMOTE_DUMP_FILE"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: Failed to import dump${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Database imported successfully${NC}"

echo -e "${BLUE}🧼 Step 5: Cleaning up dump file from destination EC2...${NC}"
ssh -i "$DEST_KEY" "$DEST_USER@$DEST_HOST" "rm -f $REMOTE_DUMP_FILE"
echo -e "${GREEN}✓ Cleanup complete${NC}"

echo -e "${GREEN}✅ Migration complete! Database imported to $DEST_HOST${NC}"
echo -e "${BLUE}📊 Database details:${NC}"
echo -e "   Host: $DEST_DB_HOST:$DEST_DB_PORT"
echo -e "   Database: $DEST_DB_NAME"
echo -e "   User: $DEST_DB_USER"