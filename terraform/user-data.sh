#!/bin/bash
set -e

# Redirect output to log file
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "=========================================="
echo "RentInn Service - Deployment Started"
echo "=========================================="
echo "Timestamp: $(date)"
echo ""

# Update system
echo "Step 1: Updating system packages..."
apt-get update
apt-get upgrade -y

# Install required packages
echo "Step 2: Installing required packages..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    gnupg \
    lsb-release \
    git \
    nginx \
    mysql-server \
    ufw

# Install Docker
echo "Step 3: Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add ubuntu user to docker group
usermod -aG docker ubuntu

# Install Docker Compose standalone
echo "Step 4: Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Configure MySQL
echo "Step 5: Configuring MySQL..."
systemctl start mysql
systemctl enable mysql

# Set MySQL root password and create database
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${db_password}';"
mysql -u root -p${db_password} -e "CREATE DATABASE IF NOT EXISTS ${db_name};"
mysql -u root -p${db_password} -e "CREATE USER IF NOT EXISTS '${db_user}'@'localhost' IDENTIFIED BY '${db_password}';"
mysql -u root -p${db_password} -e "GRANT ALL PRIVILEGES ON ${db_name}.* TO '${db_user}'@'localhost';"
mysql -u root -p${db_password} -e "CREATE USER IF NOT EXISTS '${db_user}'@'%' IDENTIFIED BY '${db_password}';"
mysql -u root -p${db_password} -e "GRANT ALL PRIVILEGES ON ${db_name}.* TO '${db_user}'@'%';"
mysql -u root -p${db_password} -e "FLUSH PRIVILEGES;"

# Configure MySQL to allow remote connections
sed -i 's/bind-address.*/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf
systemctl restart mysql

# Clone repository
echo "Step 6: Cloning repository..."
cd /home/ubuntu

# Set up Git credentials if token is provided
if [ -n "${github_token}" ] && [ "${github_token}" != "" ]; then
    REPO_URL=$(echo ${github_repo_url} | sed "s|https://|https://${github_token}@|")
else
    REPO_URL=${github_repo_url}
fi

# Clone the repository
sudo -u ubuntu git clone $REPO_URL rentinn-service
cd rentinn-service

# Create .env file
echo "Step 7: Creating environment configuration..."
cat > .env << EOL
# Service Configuration
SERVICE_NAME=rentinn-service
SERVICE_PORT=${service_port}
PORT=${service_port}
NODE_ENV=production

# Database Configuration
DB_HOST=host.docker.internal
DB_PORT=3306
DB_USERNAME=${db_user}
DB_PASSWORD=${db_password}
DB_NAME=${db_name}
DB_DATABASE=${db_name}

# JWT Configuration
JWT_SECRET=${jwt_secret}
JWT_EXPIRATION=7d

# AWS Configuration (General)
AWS_REGION=${aws_region}
AWS_BUCKET_NAME=${aws_bucket_name}
AWS_ACCESS_KEY_ID=${aws_access_key}
AWS_SECRET_ACCESS_KEY=${aws_secret_key}

# AWS Documents Configuration
AWS_DOCS_REGION=${aws_docs_region}
AWS_DOCS_ACCESS_KEY=${aws_docs_access_key}
AWS_DOCS_SECRET_ACCESS_KEY=${aws_docs_secret_access_key}
DOCS_BUCKET_NAME=${docs_bucket_name}

# Email Configuration
EMAIL_FROM=${email_from}
SMTP_HOST=${smtp_host}
SMTP_PORT=${smtp_port}
SMTP_USER=${smtp_user}
SMTP_PASS=${smtp_pass}
SMTP_SECURE=${smtp_secure}
EMAIL_SENDING_ENABLED=${email_sending_enabled}

# Push Notifications
PUSH_NOTIFICATION_ENABLED=${push_notification_enabled}

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=${firebase_service_account_path}

# Master DB Sync
MASTER_DB_SYNC=${master_db_sync}
EOL

chown ubuntu:ubuntu .env
chmod 600 .env

# Create docker-compose.yml if it doesn't exist
if [ ! -f docker-compose.yml ]; then
    echo "Step 8: Creating docker-compose.yml..."
    cat > docker-compose.yml << 'EOL'
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: rentinn-service
    restart: unless-stopped
    ports:
      - "4200:4200"
    env_file:
      - .env
    networks:
      - rentinn-network
    volumes:
      - ./config:/app/config:ro
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:4200/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 40s

networks:
  rentinn-network:
    driver: bridge
EOL
    chown ubuntu:ubuntu docker-compose.yml
fi

# Build and start Docker containers
echo "Step 9: Building and starting Docker containers..."
sudo -u ubuntu docker-compose build --no-cache
sudo -u ubuntu docker-compose up -d

# Wait for application to start
echo "Step 10: Waiting for application to start..."
sleep 30

# Configure Nginx
echo "Step 11: Configuring Nginx..."
cat > /etc/nginx/sites-available/rentinn << 'EOL'
server {
    listen 80;
    server_name _;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:4200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    location /health {
        proxy_pass http://localhost:4200/health;
        access_log off;
    }
}
EOL

# Enable Nginx site
ln -sf /etc/nginx/sites-available/rentinn /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx

# Configure firewall
echo "Step 12: Configuring firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 4200/tcp
ufw allow 3306/tcp

# Set up automatic security updates
echo "Step 13: Configuring automatic security updates..."
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Create update script
cat > /home/ubuntu/update-rentinn.sh << 'EOL'
#!/bin/bash
cd /home/ubuntu/rentinn-service
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
echo "Application updated successfully at $(date)"
EOL

chmod +x /home/ubuntu/update-rentinn.sh
chown ubuntu:ubuntu /home/ubuntu/update-rentinn.sh

# Create restart script
cat > /home/ubuntu/restart-rentinn.sh << 'EOL'
#!/bin/bash
cd /home/ubuntu/rentinn-service
docker-compose restart
echo "Application restarted at $(date)"
EOL

chmod +x /home/ubuntu/restart-rentinn.sh
chown ubuntu:ubuntu /home/ubuntu/restart-rentinn.sh

# Create logs viewing script
cat > /home/ubuntu/logs-rentinn.sh << 'EOL'
#!/bin/bash
cd /home/ubuntu/rentinn-service
docker-compose logs -f
EOL

chmod +x /home/ubuntu/logs-rentinn.sh
chown ubuntu:ubuntu /home/ubuntu/logs-rentinn.sh

# Fix permissions
chown -R ubuntu:ubuntu /home/ubuntu/rentinn-service

echo ""
echo "=========================================="
echo "RentInn Service - Deployment Completed"
echo "=========================================="
echo "Timestamp: $(date)"
echo ""
echo "Application Status:"
docker-compose ps
echo ""
echo "Health Check:"
curl -s http://localhost:4200/health || echo "Health check failed"
echo ""
echo "Useful commands:"
echo "  - Update app: ./update-rentinn.sh"
echo "  - Restart app: ./restart-rentinn.sh"
echo "  - View logs: ./logs-rentinn.sh"
echo ""
echo "=========================================="
