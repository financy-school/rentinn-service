.PHONY: help build run stop clean logs shell test deploy deploy-quick status

# SSH Configuration
SSH_KEY := terraform/test.pem
EC2_HOST := 3.7.125.170
EC2_USER := ubuntu

# Default target
help:
	@echo "Available commands:"
	@echo ""
	@echo "Local Development:"
	@echo "  make build       - Build Docker image"
	@echo "  make run         - Run container with docker-compose"
	@echo "  make start       - Start existing containers"
	@echo "  make stop        - Stop running containers"
	@echo "  make restart     - Restart containers"
	@echo "  make clean       - Remove containers and images"
	@echo "  make logs        - View container logs"
	@echo "  make shell       - Access container shell"
	@echo "  make test        - Run tests in container"
	@echo "  make dev         - Run in development mode"
	@echo "  make ps          - List running containers"
	@echo "  make rebuild     - Rebuild and restart containers"
	@echo ""
	@echo "Production Deployment:"
	@echo "  make deploy      - Full deployment (commit, push, deploy)"
	@echo "  make deploy-quick - Quick deploy (skip rebuild if no deps changed)"
	@echo "  make deploy-only - Deploy without committing (use existing code)"
	@echo "  make status      - Check production server status"
	@echo "  make logs-prod   - View production logs"
	@echo "  make restart-prod - Restart production container"
	@echo "  make ssh         - SSH into production server"

# Build Docker image
build:
	@echo "Building Docker image..."
	docker-compose build

# Run containers
run:
	@echo "Starting containers..."
	docker-compose up -d
	@echo "Containers started. Check logs with: make logs"

# Start existing containers
start:
	@echo "Starting containers..."
	docker-compose start

# Stop containers
stop:
	@echo "Stopping containers..."
	docker-compose stop

# Restart containers
restart:
	@echo "Restarting containers..."
	docker-compose restart

# Remove containers and images
clean:
	@echo "Removing containers and images..."
	docker-compose down
	docker rmi rentinn-service 2>/dev/null || true
	@echo "Cleanup complete"

# Clean including volumes
clean-all:
	@echo "Removing containers, images, and volumes..."
	docker-compose down -v
	docker rmi rentinn-service 2>/dev/null || true
	@echo "Full cleanup complete"

# View logs
logs:
	docker-compose logs -f app

# Access container shell
shell:
	docker-compose exec app sh

# Run tests
test:
	docker-compose exec app npm test

# List containers
ps:
	docker-compose ps

# Rebuild and restart
rebuild:
	@echo "Rebuilding and restarting..."
	docker-compose up -d --build
	@echo "Rebuild complete"

# Development mode (with watch)
dev:
	@echo "Starting development mode..."
	docker-compose up

# ========================================
# Production Deployment Commands
# ========================================

# Full deployment: commit, push, and deploy
deploy:
	@echo "🚀 Starting full deployment..."
	@./deploy-local.sh

# Quick deployment using the deploy script
deploy-quick:
	@echo "⚡ Quick deployment..."
	@./deploy-local.sh "Quick deploy: $(shell date '+%Y-%m-%d %H:%M:%S')"

# Deploy without committing (assumes code is already pushed)
deploy-only:
	@echo "🌐 Deploying to production (no commit)..."
	@ssh -i $(SSH_KEY) $(EC2_USER)@$(EC2_HOST) '\
		cd /home/ubuntu/rentinn-service && \
		git pull origin main && \
		docker-compose down && \
		docker-compose up -d --build && \
		echo "✅ Deployment complete" && \
		docker logs rentinn-service --tail 20'

# Check production server status
status:
	@echo "📊 Production Server Status"
	@echo "=============================="
	@ssh -i $(SSH_KEY) $(EC2_USER)@$(EC2_HOST) '\
		echo "🐳 Docker Containers:" && \
		docker ps --filter name=rentinn-service --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" && \
		echo "" && \
		echo "🏥 Health Check:" && \
		curl -s http://localhost:4200/health | jq . 2>/dev/null || curl -s http://localhost:4200/health && \
		echo "" && \
		echo "💾 Disk Usage:" && \
		df -h / | grep -E "Filesystem|/$" && \
		echo "" && \
		echo "🧠 Memory Usage:" && \
		free -h | grep -E "Mem|Swap" && \
		echo "" && \
		echo "📝 Recent Logs (last 10 lines):" && \
		docker logs rentinn-service --tail 10'

# View production logs
logs-prod:
	@echo "📝 Production Logs (press Ctrl+C to exit)"
	@ssh -i $(SSH_KEY) $(EC2_USER)@$(EC2_HOST) 'docker logs rentinn-service -f'

# Restart production container
restart-prod:
	@echo "🔄 Restarting production container..."
	@ssh -i $(SSH_KEY) $(EC2_USER)@$(EC2_HOST) '\
		cd /home/ubuntu/rentinn-service && \
		docker-compose restart && \
		sleep 5 && \
		echo "✅ Container restarted" && \
		docker logs rentinn-service --tail 20'

# SSH into production server
ssh:
	@ssh -i $(SSH_KEY) $(EC2_USER)@$(EC2_HOST)

# Backup production database
backup-db:
	@echo "💾 Backing up production database..."
	@ssh -i $(SSH_KEY) $(EC2_USER)@$(EC2_HOST) '\
		mysqldump -u rentinn_user -p"RentInn@User2024" rentinn_db > ~/backup_$(date +%Y%m%d_%H%M%S).sql && \
		echo "✅ Database backed up to ~/backup_$(date +%Y%m%d_%H%M%S).sql"'

# Download production .env file
download-env:
	@echo "📥 Downloading production .env..."
	@scp -i $(SSH_KEY) $(EC2_USER)@$(EC2_HOST):/home/ubuntu/rentinn-service/.env .env.production
	@echo "✅ Downloaded to .env.production"

# Upload .env to production (BE CAREFUL!)
upload-env:
	@echo "⚠️  Uploading .env to production..."
	@read -p "Are you sure? (yes/no): " confirm && [ "$$confirm" = "yes" ] || exit 1
	@scp -i $(SSH_KEY) .env $(EC2_USER)@$(EC2_HOST):/home/ubuntu/rentinn-service/.env
	@echo "✅ Uploaded .env file"
	@echo "🔄 Restart container with: make restart-prod"
	docker-compose -f docker-compose.dev.yml up

# Check health
health:
	@curl -s http://localhost:4200/health && echo "\n✅ Service is healthy" || echo "❌ Service is not responding"

# View container stats
stats:
	docker stats --no-stream

# Prune unused Docker resources
prune:
	@echo "Removing unused Docker resources..."
	docker system prune -f
	@echo "Prune complete"
