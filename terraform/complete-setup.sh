#!/bin/bash
# Master setup script for RentInn Service - Database and Nginx

set -e

echo "🚀 RentInn Service - Complete Setup"
echo "===================================="
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Step 1: Setup MySQL
echo "Step 1/3: Setting up MySQL Database..."
bash "$SCRIPT_DIR/setup-mysql.sh"
echo ""

# Step 2: Update .env file
echo "Step 2/3: Updating environment configuration..."
bash "$SCRIPT_DIR/update-env.sh"
echo ""

# Step 3: Setup Nginx
echo "Step 3/3: Setting up Nginx reverse proxy..."
bash "$SCRIPT_DIR/setup-nginx.sh"
echo ""

echo "✅ Base setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Restart your Docker container:"
echo "   cd /home/ubuntu/rentinn-service"
echo "   docker-compose restart"
echo ""
echo "2. Check application logs:"
echo "   docker logs rentinn-service -f"
echo ""
echo "3. Test the application:"
echo "   curl http://localhost:4200/health"
echo "   curl http://3.7.125.170/health"
echo ""
echo "4. (Optional) Setup SSL for your domain:"
echo "   bash $SCRIPT_DIR/setup-ssl.sh yourdomain.com"
echo ""
echo "🎉 Your RentInn service should now be fully functional!"
