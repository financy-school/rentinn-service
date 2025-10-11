#!/bin/bash
# Comprehensive .env updater for RentInn Service
# This script reads environment variables from command line arguments
# and updates the .env file accordingly

set -e

ENV_FILE="/home/ubuntu/rentinn-service/.env"

echo "📝 Updating .env file with all configuration..."

# Backup existing .env
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Backup created"
fi

# Function to update or add environment variable
update_env_var() {
    local key=$1
    local value=$2
    
    if [ -f "$ENV_FILE" ]; then
        # Remove old line if exists
        sed -i "/^${key}=/d" "$ENV_FILE"
    fi
    
    # Add new value
    echo "${key}=${value}" >> "$ENV_FILE"
}

# Parse command line arguments (format: KEY=VALUE)
for arg in "$@"; do
    if [[ $arg == *"="* ]]; then
        key="${arg%%=*}"
        value="${arg#*=}"
        update_env_var "$key" "$value"
    fi
done

# If no arguments provided, create default configuration
if [ $# -eq 0 ]; then
    echo "⚠️  No arguments provided. Creating default configuration..."
    
    # Create comprehensive default .env
    cat > "$ENV_FILE" <<'EOF'
# Database Configuration (MySQL)
DB_HOST=host.docker.internal
DB_PORT=3306
DB_USERNAME=rentinn_user
DB_PASSWORD=RentInn@User2024
DB_NAME=rentinn_db
DB_DATABASE=rentinn_db

# Application Configuration
PORT=4200
SERVICE_PORT=4200
SERVICE_NAME=rentinn-service
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-RentInn2024

# AWS Configuration for Documents
AWS_DOCS_REGION=ap-south-1
AWS_DOCS_ACCESS_KEY=
AWS_DOCS_SECRET_ACCESS_KEY=
DOCS_BUCKET_NAME=

# AWS Configuration (General)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=

# Email Configuration
EMAIL_FROM=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=true
EMAIL_SENDING_ENABLED=true

# Push Notifications
PUSH_NOTIFICATION_ENABLED=true

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=config/firebase/firebase-adminsdk.json

# Master DB Sync
MASTER_DB_SYNC=true
EOF
fi

# Secure the file
chmod 600 "$ENV_FILE"

echo "✅ .env file updated successfully!"
echo ""
echo "Current configuration (sensitive values hidden):"
sed 's/\(PASSWORD\|SECRET\|KEY\)=.*/\1=***HIDDEN***/g' "$ENV_FILE" | grep -E "^[A-Z_]+"

echo ""
echo "🔄 To apply changes, restart your Docker container:"
echo "  cd /home/ubuntu/rentinn-service"
echo "  docker-compose restart"
