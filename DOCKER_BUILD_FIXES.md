# Docker Build Issues - Fixed! ✅

## Issues Encountered & Solutions

### 1. ❌ **Missing Image Name in Build Command**

**Error:**

```bash
docker build -t .
ERROR: "docker buildx build" requires exactly 1 argument.
```

**Solution:**

```bash
docker build -t rentinn-service .
```

The `-t` flag requires an image name before the build context (`.`).

---

### 2. ❌ **package-lock.json Excluded from Build**

**Error:**

```
npm error The `npm ci` command can only install with an existing package-lock.json
```

**Problem:** `.dockerignore` was excluding `package-lock.json`

**Solution:** Updated `.dockerignore`:

```diff
# Dependencies
node_modules
npm-debug.log
yarn-error.log
-package-lock.json
+# package-lock.json  # Keep this for npm ci in Docker
yarn.lock
```

---

### 3. ❌ **Package Lock Out of Sync**

**Error:**

```
npm error Invalid: lock file's uuid@9.0.1 does not satisfy uuid@13.0.0
```

**Problem:** `package-lock.json` was out of sync after changing uuid version from 13.0.0 to 9.0.1

**Solution:** Updated package-lock.json:

```bash
npm install
```

---

### 4. ❌ **TypeScript Config Files Missing**

**Error:**

```
Error Could not find TypeScript configuration file "tsconfig.json"
```

**Problem:** `.dockerignore` was excluding TypeScript configuration files

**Solution:** Updated `.dockerignore`:

```diff
# Misc
.prettierrc
.eslintrc.js
.editorconfig
-tsconfig.json
-tsconfig.build.json
-nest-cli.json
+# tsconfig.json  # Keep for build
+# tsconfig.build.json  # Keep for build
+# nest-cli.json  # Keep for build
```

---

## ✅ Final Build - SUCCESS!

```bash
docker build -t rentinn-service .
```

**Result:**

- ✅ Build completed successfully
- ✅ Image size: ~876MB
- ✅ All stages completed
- ✅ Image name: `rentinn-service:latest`

---

## Updated Files

1. **`.dockerignore`**
   - Uncommented `package-lock.json` to include it
   - Uncommented TypeScript config files (`tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`)

2. **`package-lock.json`**
   - Synchronized with `package.json` using `npm install`

---

## Correct Build Commands

### Basic Build

```bash
docker build -t rentinn-service .
```

### Build with Tag

```bash
docker build -t rentinn-service:v1.0.0 .
```

### Build with No Cache

```bash
docker build --no-cache -t rentinn-service .
```

### Build for Specific Platform (Apple Silicon)

```bash
docker build --platform linux/amd64 -t rentinn-service .
```

---

## Test the Image

### 1. Check Image

```bash
docker images | grep rentinn-service
```

### 2. Run Container

```bash
# Make sure you have .env file
cp .env.example .env
# Edit .env with your configuration

# Run the container
docker run -d -p 4200:4200 --env-file .env --name rentinn-service rentinn-service
```

### 3. Check Health

```bash
curl http://localhost:4200/health
```

Expected response:

```json
{ "status": "ok", "message": "Service is running" }
```

### 4. View Logs

```bash
docker logs -f rentinn-service
```

### 5. Stop Container

```bash
docker stop rentinn-service
docker rm rentinn-service
```

---

## Using Makefile (Easier!)

```bash
# Build
make build

# Run
make run

# View logs
make logs

# Stop
make stop

# Clean up
make clean
```

---

## Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

---

## Key Takeaways

1. **Always specify image name** after `-t` flag: `docker build -t <name> .`
2. **Keep essential build files** in the image by carefully configuring `.dockerignore`
3. **Keep package-lock.json in sync** with package.json
4. **Include TypeScript config files** for NestJS builds
5. **Test locally** before pushing to registry

---

## Image Details

- **Repository:** rentinn-service
- **Tag:** latest
- **Size:** ~876MB
- **Base:** node:18-alpine
- **Built:** Multi-stage (builder + production)
- **User:** nestjs (non-root)
- **Port:** 4200
- **Health Check:** /health endpoint

---

## Next Steps

✅ Image is built and ready
✅ All build issues resolved
✅ .dockerignore properly configured

**You can now:**

1. Run the container locally with `docker run` or `docker-compose up`
2. Test the application
3. Push to a container registry (Docker Hub, ECR, etc.)
4. Deploy to production (ECS, Kubernetes, etc.)

---

## Common Commands Quick Reference

```bash
# Build
docker build -t rentinn-service .

# Run
docker run -d -p 4200:4200 --env-file .env --name rentinn-service rentinn-service

# Check logs
docker logs -f rentinn-service

# Stop
docker stop rentinn-service

# Remove
docker rm rentinn-service

# Remove image
docker rmi rentinn-service

# Use Makefile
make build && make run
```

---

**Status: ✅ All Issues Resolved - Docker Build Working!**
