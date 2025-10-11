# 🚀 Deployment Guide - RentInn Service

This guide explains how to deploy code changes to your production server.

---

## 📋 Quick Overview

You have **3 easy ways** to deploy:

1. **GitHub Actions** (Automatic) - Deploys automatically when you push to `main`
2. **Deploy Script** (Manual) - One command to deploy from your local machine
3. **Makefile Commands** (Simple) - Easy-to-remember shortcuts

---

## 🎯 Method 1: GitHub Actions (Recommended for Teams)

### Setup (One-time)

1. **Add SSH Key to GitHub Secrets:**
   - Go to: https://github.com/financy-school/rentinn-service/settings/secrets/actions
   - Click "New repository secret"
   - Add these secrets:

     ```
     Name: EC2_SSH_KEY
     Value: <paste contents of terraform/test.pem>

     Name: EC2_HOST
     Value: 3.7.125.170
     ```

2. **Done!** Now every push to `main` will auto-deploy.

### Usage

Just push your code:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

🎉 GitHub Actions will automatically:

- Pull latest code on server
- Rebuild Docker container
- Restart the application
- Run health checks
- Report status

### Manual Trigger

You can also trigger deployment manually from GitHub:

1. Go to: https://github.com/financy-school/rentinn-service/actions
2. Click "Deploy to AWS EC2"
3. Click "Run workflow"
4. Click "Run workflow" button

---

## ⚡ Method 2: Deploy Script (Fastest)

### Simple Usage

```bash
# Deploy with auto-commit
./deploy-local.sh "Fixed bug in user authentication"
```

That's it! The script will:

- ✅ Commit your changes
- ✅ Push to GitHub
- ✅ Deploy to production
- ✅ Run health checks
- ✅ Show status

### Without Committing

If you've already committed and pushed:

```bash
make deploy-only
```

---

## 🛠️ Method 3: Makefile Commands (Most Flexible)

### Quick Reference

```bash
# Full deployment (commit + push + deploy)
make deploy

# Quick deploy with auto-generated commit message
make deploy-quick

# Deploy without committing (use existing code)
make deploy-only

# Check server status
make status

# View production logs
make logs-prod

# Restart production container
make restart-prod

# SSH into server
make ssh
```

### Detailed Commands

#### Deploy with Custom Message

```bash
# Edit your files
vim src/app.controller.ts

# Deploy with custom commit message
./deploy-local.sh "Updated API endpoint for user profile"
```

#### Quick Deploy (Auto-commit)

```bash
# Make changes
# Deploy immediately
make deploy-quick
```

#### Deploy Only (No Commit)

```bash
# If you already committed and pushed
make deploy-only
```

#### Check Status

```bash
make status
```

Output:

```
📊 Production Server Status
==============================
🐳 Docker Containers:
NAMES              STATUS          PORTS
rentinn-service    Up 2 hours      0.0.0.0:4200->4200/tcp

🏥 Health Check:
{"status":"ok","message":"Service is running"}

💾 Disk Usage:
Filesystem      Size  Used Avail Use% Mounted on
/dev/root        30G   12G   18G  40% /

📝 Recent Logs (last 10 lines):
[Nest] Application successfully started
```

---

## 🔄 Complete Deployment Workflow

### Scenario 1: Small Code Change (e.g., bug fix)

```bash
# 1. Make your changes
vim src/auth/auth.service.ts

# 2. Test locally (optional)
make build
make run
curl http://localhost:4200/health

# 3. Deploy to production
./deploy-local.sh "Fixed authentication bug"

# 4. Verify deployment
curl https://rentalinn.ddns.net/health
```

### Scenario 2: Adding New Dependencies

```bash
# 1. Install dependency locally
npm install express-rate-limit

# 2. Update your code
vim src/main.ts

# 3. Deploy (will rebuild Docker image)
./deploy-local.sh "Added rate limiting"
```

### Scenario 3: Environment Variable Update

```bash
# 1. Update .env on server
make ssh
cd /home/ubuntu/rentinn-service
nano .env
# Edit variables
exit

# 2. Restart container
make restart-prod
```

### Scenario 4: Database Schema Change

```bash
# 1. Make your entity changes
vim src/entities/user.entity.ts

# 2. Deploy
./deploy-local.sh "Updated user entity schema"

# 3. Check migrations ran
make logs-prod
# Look for: "query: ALTER TABLE..."
```

---

## 📊 Monitoring After Deployment

### Check Application Status

```bash
make status
```

### View Live Logs

```bash
make logs-prod
# Press Ctrl+C to exit
```

### Quick Health Check

```bash
curl https://rentalinn.ddns.net/health
```

### Detailed Health Check

```bash
ssh -i terraform/test.pem ubuntu@3.7.125.170 '
  echo "Container Status:"
  docker ps | grep rentinn-service

  echo -e "\nHealth Check:"
  curl -s http://localhost:4200/health | jq .

  echo -e "\nMemory Usage:"
  docker stats --no-stream rentinn-service
'
```

---

## 🆘 Troubleshooting

### Deployment Failed

```bash
# 1. Check what went wrong
make logs-prod

# 2. Check container status
make status

# 3. SSH and investigate
make ssh
cd /home/ubuntu/rentinn-service
docker logs rentinn-service --tail 100
```

### Container Won't Start

```bash
# 1. SSH into server
make ssh

# 2. Check logs
docker logs rentinn-service --tail 100

# 3. Try manual restart
cd /home/ubuntu/rentinn-service
docker-compose down
docker-compose up -d

# 4. Check environment variables
docker exec rentinn-service env | grep DB_
```

### Health Check Failing

```bash
# 1. Check if container is running
make status

# 2. Test from inside container
ssh -i terraform/test.pem ubuntu@3.7.125.170
docker exec rentinn-service curl http://localhost:4200/health

# 3. Check database connection
docker exec rentinn-service env | grep DB_

# 4. View full logs
docker logs rentinn-service --tail 200
```

### Rollback to Previous Version

```bash
# 1. SSH to server
make ssh

# 2. Find previous commit
cd /home/ubuntu/rentinn-service
git log --oneline -5

# 3. Rollback
git checkout <previous-commit-hash>
docker-compose down
docker-compose up -d --build

# 4. Or rollback on GitHub and redeploy
exit
git revert HEAD
git push origin main
# GitHub Actions will auto-deploy
```

---

## 🔒 Security Best Practices

### Before Deploying

- [ ] Remove any console.log with sensitive data
- [ ] Check for hardcoded credentials
- [ ] Ensure .env is not committed
- [ ] Review changes with `git diff`

### After Deploying

- [ ] Verify health check passes
- [ ] Check logs for errors
- [ ] Test critical endpoints
- [ ] Monitor for 5-10 minutes

---

## 📝 Deployment Checklist

### Pre-Deployment

```bash
# 1. Pull latest changes
git pull origin main

# 2. Make your changes
# ... edit files ...

# 3. Test locally
make build
make run
curl http://localhost:4200/health

# 4. Review changes
git status
git diff
```

### Deployment

```bash
# 5. Deploy
./deploy-local.sh "Your descriptive commit message"
```

### Post-Deployment

```bash
# 6. Verify deployment
curl https://rentalinn.ddns.net/health

# 7. Check logs
make logs-prod

# 8. Monitor for issues
make status
```

---

## 🎯 Common Deployment Scenarios

### Daily Development Workflow

```bash
# Morning: Start working
git pull origin main

# During day: Make changes
vim src/**/*.ts

# Test locally
npm run start:dev

# End of day: Deploy
./deploy-local.sh "Implemented user profile API"
```

### Hotfix Workflow

```bash
# 1. Identify issue
make logs-prod

# 2. Fix locally
vim src/problematic-file.ts

# 3. Quick deploy
./deploy-local.sh "HOTFIX: Fixed critical bug in payment"

# 4. Verify immediately
curl https://rentalinn.ddns.net/health
make logs-prod
```

### Feature Branch Workflow

```bash
# 1. Create feature branch
git checkout -b feature/new-dashboard

# 2. Make changes
# ... edit files ...

# 3. Commit locally
git add .
git commit -m "Added new dashboard"

# 4. Merge to main
git checkout main
git merge feature/new-dashboard

# 5. Deploy
git push origin main
# GitHub Actions auto-deploys

# Or use script
./deploy-local.sh "Merged new dashboard feature"
```

---

## 🔧 Advanced Options

### Deploy Specific Branch

```bash
ssh -i terraform/test.pem ubuntu@3.7.125.170
cd /home/ubuntu/rentinn-service
git fetch origin
git checkout feature-branch
docker-compose down
docker-compose up -d --build
```

### Deploy with Zero Downtime (Blue-Green)

```bash
# 1. Build new image with different tag
docker-compose build app --tag rentinn-service:new

# 2. Start new container on different port
docker run -d --name rentinn-new -p 4201:4200 rentinn-service:new

# 3. Test new container
curl http://localhost:4201/health

# 4. Update Nginx to point to new port
sudo vim /etc/nginx/sites-available/rentinn

# 5. Reload Nginx
sudo nginx -t && sudo systemctl reload nginx

# 6. Stop old container
docker stop rentinn-service
```

### Backup Before Deploy

```bash
# Automated in deploy script, or manually:
make backup-db
```

---

## 📞 Support

### View All Available Commands

```bash
make help
```

### Quick Command Reference Card

| Command                       | Description         |
| ----------------------------- | ------------------- |
| `make deploy`                 | Full deployment     |
| `make deploy-quick`           | Quick deploy        |
| `make status`                 | Check server status |
| `make logs-prod`              | View logs           |
| `make restart-prod`           | Restart container   |
| `make ssh`                    | SSH to server       |
| `./deploy-local.sh "message"` | Deploy with message |

---

## 🎉 Success!

Your deployment system is now fully configured!

**Three ways to deploy:**

1. 🔄 **Auto**: Push to GitHub → Auto-deploys
2. ⚡ **Script**: `./deploy-local.sh "message"`
3. 🛠️ **Make**: `make deploy`

**Application URL:**
🔗 https://rentalinn.ddns.net

---

_Last Updated: October 11, 2025_
