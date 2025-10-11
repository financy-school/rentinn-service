.PHONY: help build run stop clean logs shell test

# Default target
help:
	@echo "Available commands:"
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
