#!/bin/bash
# Setup Nginx reverse proxy for RentInn Service

set -e

echo "🔧 Installing Nginx..."
sudo apt update
sudo apt install nginx -y

echo "📝 Creating Nginx site configuration..."
sudo tee /etc/nginx/sites-available/rentinn > /dev/null <<'EOF'
server {
    listen 80;
    server_name 3.7.125.170;

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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Disable caching for API requests
        proxy_cache_bypass $http_upgrade;
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

echo "🔗 Enabling site configuration..."
sudo ln -sf /etc/nginx/sites-available/rentinn /etc/nginx/sites-enabled/

echo "🧹 Removing default site..."
sudo rm -f /etc/nginx/sites-enabled/default

echo "✅ Testing Nginx configuration..."
sudo nginx -t

echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "📊 Nginx status:"
sudo systemctl status nginx --no-pager

echo ""
echo "🎉 Nginx setup complete!"
echo ""
echo "Your application is now accessible at:"
echo "  http://3.7.125.170"
echo ""
echo "Note: For SSL/HTTPS with domain name, run the SSL setup script."
