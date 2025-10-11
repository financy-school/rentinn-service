#!/bin/bash
# Script to be called by Terraform with Typeform environment variables
# Usage: ./apply-typeform-env.sh

set -e

ENV_FILE="/home/ubuntu/rentinn-service/.env"

echo "📝 Applying Typeform environment variables to .env..."

# Get variables from Terraform environment or script arguments
DB_HOST="${DB_HOST:-host.docker.internal}"
DB_PORT="${DB_PORT:-3306}"
DB_USERNAME="${DB_USERNAME:-rentinn_user}"
DB_PASSWORD="${DB_PASSWORD:-RentInn@User2024}"
DB_NAME="${DB_NAME:-rentinn_db}"
DB_DATABASE="${DB_DATABASE:-rentinn_db}"

SERVICE_NAME="${SERVICE_NAME:-rentinn-service}"
SERVICE_PORT="${SERVICE_PORT:-4200}"
PORT="${PORT:-4200}"
NODE_ENV="${NODE_ENV:-production}"

JWT_SECRET="${JWT_SECRET:-your-super-secret-jwt-key-change-this-in-production-RentInn2024}"

AWS_DOCS_REGION="${AWS_DOCS_REGION:-ap-south-1}"
AWS_DOCS_ACCESS_KEY="${AWS_DOCS_ACCESS_KEY:-}"
AWS_DOCS_SECRET_ACCESS_KEY="${AWS_DOCS_SECRET_ACCESS_KEY:-}"
DOCS_BUCKET_NAME="${DOCS_BUCKET_NAME:-}"

AWS_REGION="${AWS_REGION:-ap-south-1}"
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-}"
AWS_BUCKET_NAME="${AWS_BUCKET_NAME:-}"

EMAIL_FROM="${EMAIL_FROM:-}"
SMTP_HOST="${SMTP_HOST:-smtp.gmail.com}"
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_USER="${SMTP_USER:-}"
SMTP_PASS="${SMTP_PASS:-}"
SMTP_SECURE="${SMTP_SECURE:-true}"
EMAIL_SENDING_ENABLED="${EMAIL_SENDING_ENABLED:-true}"

PUSH_NOTIFICATION_ENABLED="${PUSH_NOTIFICATION_ENABLED:-true}"
FIREBASE_SERVICE_ACCOUNT_PATH="${FIREBASE_SERVICE_ACCOUNT_PATH:-config/firebase/firebase-adminsdk.json}"

MASTER_DB_SYNC="${MASTER_DB_SYNC:-true}"

# Backup existing .env
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Backup created: $ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Create new .env file with all variables
cat > "$ENV_FILE" <<EOF
# Database Configuration (MySQL)
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
DB_DATABASE=${DB_DATABASE}

# Application Configuration
PORT=${PORT}
SERVICE_PORT=${SERVICE_PORT}
SERVICE_NAME=${SERVICE_NAME}
NODE_ENV=${NODE_ENV}

# JWT Configuration
JWT_SECRET=${JWT_SECRET}

# AWS Configuration for Documents
AWS_DOCS_REGION=${AWS_DOCS_REGION}
AWS_DOCS_ACCESS_KEY=${AWS_DOCS_ACCESS_KEY}
AWS_DOCS_SECRET_ACCESS_KEY=${AWS_DOCS_SECRET_ACCESS_KEY}
DOCS_BUCKET_NAME=${DOCS_BUCKET_NAME}

# AWS Configuration (General)
AWS_REGION=${AWS_REGION}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
AWS_BUCKET_NAME=${AWS_BUCKET_NAME}

# Email Configuration
EMAIL_FROM=${EMAIL_FROM}
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
SMTP_SECURE=${SMTP_SECURE}
EMAIL_SENDING_ENABLED=${EMAIL_SENDING_ENABLED}

# Push Notifications
PUSH_NOTIFICATION_ENABLED=${PUSH_NOTIFICATION_ENABLED}

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=${FIREBASE_SERVICE_ACCOUNT_PATH}

# Master DB Sync
MASTER_DB_SYNC=${MASTER_DB_SYNC}
EOF

# Secure the file
chmod 600 "$ENV_FILE"

echo "✅ .env file created successfully!"
echo ""
echo "📊 Configuration summary (sensitive values hidden):"
echo "  DB_HOST=${DB_HOST}"
echo "  DB_PORT=${DB_PORT}"
echo "  DB_USERNAME=${DB_USERNAME}"
echo "  DB_NAME=${DB_NAME}"
echo "  SERVICE_PORT=${SERVICE_PORT}"
echo "  NODE_ENV=${NODE_ENV}"
echo "  EMAIL_FROM=${EMAIL_FROM}"
echo "  SMTP_HOST=${SMTP_HOST}"
echo "  AWS_REGION=${AWS_REGION}"
echo "  PUSH_NOTIFICATION_ENABLED=${PUSH_NOTIFICATION_ENABLED}"

echo ""
echo "🔄 Restarting Docker container to apply changes..."
cd /home/ubuntu/rentinn-service
docker-compose restart

echo ""
echo "✅ All done! Service is being restarted with new configuration."
echo "📝 Check logs with: docker logs rentinn-service -f"
EOF
