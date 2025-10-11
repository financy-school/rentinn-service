#!/bin/bash
# Quick deployment script - Deploy local changes to production
# Usage: ./deploy-local.sh [commit-message]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SSH_KEY="terraform/test.pem"
EC2_HOST="3.7.125.170"
EC2_USER="ubuntu"
PROJECT_DIR="/home/ubuntu/rentinn-service"

echo -e "${BLUE}🚀 RentInn Service Deployment${NC}"
echo "================================"
echo ""

# Check if there are changes to commit
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}📝 Uncommitted changes detected${NC}"
    
    # Get commit message from argument or prompt
    if [ -z "$1" ]; then
        read -p "Enter commit message: " COMMIT_MSG
    else
        COMMIT_MSG="$1"
    fi
    
    if [ -z "$COMMIT_MSG" ]; then
        echo -e "${RED}❌ Commit message required${NC}"
        exit 1
    fi
    
    # Stage and commit changes
    echo -e "${BLUE}📦 Staging changes...${NC}"
    git add -A
    
    echo -e "${BLUE}💾 Committing changes...${NC}"
    git commit -m "$COMMIT_MSG"
    
    echo -e "${BLUE}⬆️  Pushing to GitHub...${NC}"
    git push origin main
    
    echo -e "${GREEN}✅ Changes pushed to GitHub${NC}"
    echo ""
else
    echo -e "${GREEN}✅ No local changes to commit${NC}"
    echo ""
fi

# Deploy to server
echo -e "${BLUE}🌐 Deploying to production server...${NC}"
echo "Server: $EC2_HOST"
echo ""

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" << 'ENDSSH'
    set -e
    
    # Colors for output
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
    
    echo -e "${BLUE}📥 Pulling latest changes from GitHub...${NC}"
    cd /home/ubuntu/rentinn-service
    
    # Store current commit
    CURRENT_COMMIT=$(git rev-parse HEAD)
    
    # Pull latest changes
    git pull origin main
    
    # Check if there were any changes
    NEW_COMMIT=$(git rev-parse HEAD)
    
    if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ]; then
        echo -e "${YELLOW}⚠️  No new changes to deploy${NC}"
        echo -e "${GREEN}✅ Application is already up to date${NC}"
        exit 0
    fi
    
    echo -e "${GREEN}✅ New changes detected${NC}"
    echo "Previous: ${CURRENT_COMMIT:0:8}"
    echo "Current:  ${NEW_COMMIT:0:8}"
    echo ""
    
    # Backup .env file
    if [ -f .env ]; then
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        echo -e "${GREEN}✅ Backed up .env file${NC}"
    fi
    
    # Check if Dockerfile changed
    if git diff --name-only $CURRENT_COMMIT $NEW_COMMIT | grep -q "Dockerfile\|package.json"; then
        echo -e "${YELLOW}📦 Dependencies or Dockerfile changed, rebuilding...${NC}"
        REBUILD=true
    else
        echo -e "${BLUE}ℹ️  No dependency changes, using existing image${NC}"
        REBUILD=false
    fi
    
    # Stop containers
    echo -e "${BLUE}🛑 Stopping containers...${NC}"
    docker-compose down
    
    # Rebuild if needed
    if [ "$REBUILD" = true ]; then
        echo -e "${BLUE}🔨 Rebuilding Docker image...${NC}"
        docker-compose build --no-cache
    fi
    
    # Start containers
    echo -e "${BLUE}🚀 Starting containers...${NC}"
    docker-compose up -d
    
    # Wait for application to start
    echo -e "${BLUE}⏳ Waiting for application to start...${NC}"
    sleep 15
    
    # Check container status
    if docker ps | grep -q rentinn-service; then
        echo -e "${GREEN}✅ Container is running${NC}"
    else
        echo -e "${RED}❌ Container failed to start${NC}"
        echo -e "${RED}Recent logs:${NC}"
        docker logs rentinn-service --tail 50
        exit 1
    fi
    
    # Health check
    echo -e "${BLUE}🏥 Performing health check...${NC}"
    for i in {1..5}; do
        HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4200/health || echo "000")
        if [ "$HEALTH_STATUS" = "200" ]; then
            echo -e "${GREEN}✅ Health check passed${NC}"
            break
        else
            if [ $i -eq 5 ]; then
                echo -e "${RED}❌ Health check failed after 5 attempts${NC}"
                docker logs rentinn-service --tail 50
                exit 1
            fi
            echo -e "${YELLOW}⏳ Waiting... (attempt $i/5)${NC}"
            sleep 5
        fi
    done
    
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📊 Container status:${NC}"
    docker ps --filter name=rentinn-service --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo -e "${BLUE}📝 Recent logs:${NC}"
    docker logs rentinn-service --tail 10
ENDSSH

# Final status
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✨ Deployment successful!${NC}"
    echo ""
    echo -e "${BLUE}🔗 Application URLs:${NC}"
    echo "   • HTTPS: https://rentalinn.ddns.net"
    echo "   • Health: https://rentalinn.ddns.net/health"
    echo ""
    echo -e "${BLUE}📊 View logs:${NC}"
    echo "   ssh -i $SSH_KEY $EC2_USER@$EC2_HOST 'docker logs rentinn-service -f'"
else
    echo ""
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo -e "${YELLOW}Check the logs above for details${NC}"
    exit 1
fi
