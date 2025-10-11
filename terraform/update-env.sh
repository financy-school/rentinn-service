#!/bin/bash
# Update .env file with MySQL credentials

set -e

ENV_FILE="/home/ubuntu/rentinn-service/.env"

echo "📝 Updating .env file with MySQL credentials..."

# Backup existing .env
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Backup created"
fi

# Update or add database configuration
echo "🔧 Configuring database connection..."

# Create temporary file with database settings
cat > /tmp/db_config <<EOF
# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=rentinn_user
DB_PASSWORD=RentInn@User2024
DB_NAME=rentinn_db
EOF

# If .env exists, update it; otherwise create it
if [ -f "$ENV_FILE" ]; then
    # Remove old DB_ lines
    sed -i '/^DB_HOST=/d' "$ENV_FILE"
    sed -i '/^DB_PORT=/d' "$ENV_FILE"
    sed -i '/^DB_USER=/d' "$ENV_FILE"
    sed -i '/^DB_PASSWORD=/d' "$ENV_FILE"
    sed -i '/^DB_NAME=/d' "$ENV_FILE"
    
    # Append new DB config
    cat /tmp/db_config >> "$ENV_FILE"
else
    # Create new .env file
    cat /tmp/db_config > "$ENV_FILE"
    
    # Add other common settings if creating from scratch
    cat >> "$ENV_FILE" <<EOF

# Application Configuration
PORT=4200
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# AWS Configuration (optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
EOF
fi

# Secure the file
chmod 600 "$ENV_FILE"

echo "✅ .env file updated successfully!"
echo ""
echo "Database configuration:"
cat /tmp/db_config

# Cleanup
rm /tmp/db_config

echo ""
echo "🔄 Please restart your Docker container:"
echo "  cd /home/ubuntu/rentinn-service"
echo "  docker-compose restart"
