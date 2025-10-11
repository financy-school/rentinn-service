# Rentinn Service - Docker Quick Reference

## 🚀 Quick Start

### 1. Setup Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 2. Build and Run

```bash
# Option 1: Using Docker Compose (Recommended)
docker-compose up -d

# Option 2: Using Docker directly
docker build -t rentinn-service .
docker run -p 4200:4200 --env-file .env rentinn-service
```

### 3. Verify

```bash
# Check health
curl http://localhost:4200/health

# View logs
docker-compose logs -f app
```

## 📦 Docker Commands

### Building

```bash
# Build the image
docker build -t rentinn-service:latest .

# Build with no cache
docker build --no-cache -t rentinn-service:latest .

# Build for specific platform (Apple Silicon)
docker build --platform linux/amd64 -t rentinn-service:latest .
```

### Running

```bash
# Run with Docker Compose
docker-compose up -d              # Start in background
docker-compose up --build         # Rebuild and start
docker-compose down               # Stop and remove containers
docker-compose down -v            # Stop and remove containers + volumes
docker-compose restart            # Restart services
docker-compose logs -f app        # Follow logs

# Run with Docker
docker run -d \
  --name rentinn-service \
  -p 4200:4200 \
  --env-file .env \
  rentinn-service:latest

docker run -it rentinn-service:latest sh  # Interactive shell
```

### Managing

```bash
# Container management
docker ps                         # List running containers
docker ps -a                      # List all containers
docker stop rentinn-service       # Stop container
docker start rentinn-service      # Start container
docker restart rentinn-service    # Restart container
docker rm rentinn-service         # Remove container
docker logs rentinn-service       # View logs
docker logs -f rentinn-service    # Follow logs
docker exec -it rentinn-service sh # Access container shell

# Image management
docker images                     # List images
docker rmi rentinn-service        # Remove image
docker image prune                # Remove unused images
```

## 🔧 Configuration

### Environment Variables (Required)

```env
# Service
SERVICE_NAME=rentinn-service
SERVICE_PORT=4200
NODE_ENV=production

# Database
DB_HOST=your-db-host
DB_PORT=3306
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_NAME=rentinn_db

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_BUCKET_NAME=your-bucket

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=7d
```

### Port Mapping

The service runs on port 4200 by default. To use a different port:

```bash
# Docker Compose
SERVICE_PORT=5000 docker-compose up

# Docker
docker run -p 5000:4200 --env-file .env rentinn-service
```

## 🏗️ Multi-Stage Build Details

### Stage 1: Builder

- Installs all dependencies (including dev)
- Builds the TypeScript application
- Prunes dev dependencies

### Stage 2: Production

- Uses Node 18 Alpine (lightweight)
- Copies only production dependencies
- Runs as non-root user (nestjs:nodejs)
- Includes health check
- Copies necessary files:
  - Built application (dist/)
  - Templates (templates/)
  - Config files (config/)

## 🔍 Debugging

### Check Application Logs

```bash
docker-compose logs -f app
docker logs -f rentinn-service
```

### Access Container Shell

```bash
docker-compose exec app sh
docker exec -it rentinn-service sh
```

### Check Health

```bash
curl http://localhost:4200/health
docker inspect --format='{{.State.Health.Status}}' rentinn-service
```

### Common Issues

**1. Container exits immediately**

```bash
# Check logs
docker logs rentinn-service

# Common causes:
# - Missing environment variables
# - Database connection issues
# - Port already in use
```

**2. Database connection failed**

```bash
# If using Docker Compose with MySQL, ensure:
# - DB_HOST=mysql (service name)
# - MySQL container is running
# - Wait for MySQL to be ready before starting app
```

**3. Permission denied errors**

```bash
# Check file permissions
ls -la config/
# Ensure config files are readable
chmod 644 config/firebase/firebase-adminsdk.json
```

## 🚢 Production Deployment

### AWS ECS/Fargate

```bash
# Build for AMD64 (if building on Apple Silicon)
docker build --platform linux/amd64 -t rentinn-service:latest .

# Tag for ECR
docker tag rentinn-service:latest YOUR_ECR_REPO:latest

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_REPO
docker push YOUR_ECR_REPO:latest
```

### Kubernetes

```yaml
# Example deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rentinn-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rentinn-service
  template:
    metadata:
      labels:
        app: rentinn-service
    spec:
      containers:
        - name: rentinn-service
          image: rentinn-service:latest
          ports:
            - containerPort: 4200
          env:
            - name: SERVICE_PORT
              value: '4200'
          # Add other env vars from ConfigMap/Secret
          livenessProbe:
            httpGet:
              path: /health
              port: 4200
            initialDelaySeconds: 30
            periodSeconds: 10
```

## 📊 Health Monitoring

### Health Check Endpoint

```bash
GET http://localhost:4200/health
Response: 200 OK
```

### Docker Health Check

Built into Dockerfile:

- Interval: 30 seconds
- Timeout: 3 seconds
- Start period: 40 seconds
- Retries: 3

```bash
# Check health status
docker inspect --format='{{json .State.Health}}' rentinn-service
```

## 🔐 Security Best Practices

1. **Non-root User**: Application runs as user `nestjs` (UID 1001)
2. **Alpine Base**: Minimal attack surface
3. **No Dev Dependencies**: Only production dependencies included
4. **Secret Management**: Use environment variables or AWS Secrets Manager
5. **Read-only Config**: Config files mounted as read-only

## 📝 Notes

- Image size: ~200-300MB (optimized)
- Node version: 18 Alpine
- Health check: Built-in at `/health`
- PDF Generation: PDFKit included (no browser dependencies)
- Templates: EJS templates included in image
- Firebase: Admin SDK config supported

## 🔗 Related Files

- `Dockerfile` - Multi-stage build configuration
- `.dockerignore` - Files excluded from Docker build
- `docker-compose.yml` - Service orchestration
- `.env.example` - Environment variable template
