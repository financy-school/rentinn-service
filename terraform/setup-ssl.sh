#!/bin/bash
# Setup SSL certificate with Let's Encrypt for RentInn Service

set -e

# Check if domain is provided
if [ -z "$1" ]; then
    echo "❌ Error: Domain name required"
    echo "Usage: ./setup-ssl.sh yourdomain.com"
    echo "Example: ./setup-ssl.sh rentalinn.ddns.net"
    exit 1
fi

DOMAIN=$1

echo "🔧 Installing Certbot..."
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

echo "📝 Updating Nginx configuration for domain: $DOMAIN..."
sudo tee /etc/nginx/sites-available/rentinn > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Increase buffer sizes for large requests
    client_max_body_size 20M;
    client_body_buffer_size 128k;

    # Logging
    access_log /var/log/nginx/rentinn_access.log;
    error_log /var/log/nginx/rentinn_error.log;

    location / {
        proxy_pass http://localhost:4200;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Standard proxy headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Disable caching for API requests
        proxy_cache_bypass \$http_upgrade;
        proxy_no_cache 1;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:4200/health;
        access_log off;
    }
}
EOF

echo "✅ Testing Nginx configuration..."
sudo nginx -t

echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "🔐 Obtaining SSL certificate from Let's Encrypt..."
echo "Note: Make sure your domain DNS points to this server's IP (3.7.125.170)"
read -p "Press Enter to continue once DNS is configured..."

sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect

echo "🔄 Reloading Nginx with SSL..."
sudo systemctl reload nginx

echo ""
echo "🎉 SSL setup complete!"
echo ""
echo "Your application is now accessible at:"
echo "  https://$DOMAIN"
echo ""
echo "SSL certificate will auto-renew. Certbot renewal timer:"
sudo systemctl status certbot.timer --no-pager | head -3
