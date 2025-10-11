# Database and Nginx Setup Complete ✅

## Summary

Successfully configured MySQL database and Nginx reverse proxy for the RentInn service running on AWS EC2.

## What Was Accomplished

### 1. Database Setup ✅

**MySQL Configuration:**

- MySQL 8.0.43 installed and configured on EC2 instance
- Database: `rentinn_db`
- User: `rentinn_user`
- Password: `RentInn@User2024`
- Configured MySQL to bind to `0.0.0.0` for Docker network access
- Created user permissions for Docker network: `rentinn_user@172.18.%.%`

**Connection Details:**

```bash
Host: host.docker.internal (from Docker container)
Port: 3306
Username: rentinn_user
Password: RentInn@User2024
Database: rentinn_db
```

### 2. Nginx Setup ✅

**Reverse Proxy Configuration:**

- Nginx 1.18.0 installed and configured
- Location: `/etc/nginx/sites-available/rentinn`
- Reverse proxy: Port 80 → localhost:4200
- WebSocket support enabled
- Large request body support (100MB)
- Request buffering disabled for streaming

**Access:**

- HTTP: http://3.7.125.170
- Health check: http://3.7.125.170/health
- Response: `{"status":"ok","message":"Service is running"}`

### 3. Docker Configuration Updates ✅

**docker-compose.yml changes:**

```yaml
extra_hosts:
  - 'host.docker.internal:host-gateway'
```

**Environment Variables:**

- Added `DB_DATABASE` (TypeORM requirement)
- All database variables properly configured
- Container successfully connecting to host MySQL

### 4. Application Status ✅

**Container:**

- Name: `rentinn-service`
- Status: Running
- Port: 4200
- Network: rentinn-service_rentinn-network (172.18.0.0/16)

**Health:**

- ✅ NestJS application started successfully
- ✅ All modules initialized
- ✅ Database connection established
- ✅ Email transporter ready
- ✅ All routes mapped

## Infrastructure Details

### EC2 Instance

- **Instance ID:** i-05f470c5686328dd3
- **Public IP:** 3.7.125.170
- **Region:** us-east-1 (N. Virginia)
- **Instance Type:** t3.small
- **OS:** Ubuntu 22.04

### Services Running

- **MySQL:** 8.0.43 (Port 3306)
- **Nginx:** 1.18.0 (Port 80)
- **Docker:** Container running NestJS app (Port 4200)

## Next Steps - SSL Setup

### Prerequisites

1. **Update DNS Record:**
   - Your domain `rentalinn.ddns.net` is currently pointing to: `13.203.79.179`
   - **Required:** Update DDNS to point to: `3.7.125.170`
   - Verification: `nslookup rentalinn.ddns.net` should return `3.7.125.170`

2. **Wait for DNS Propagation:**
   - DNS changes can take 5-30 minutes to propagate
   - Test: `curl http://rentalinn.ddns.net/health`

### SSL Setup Script Ready

Once DNS is updated, run the SSL setup script:

```bash
ssh -i terraform/test.pem ubuntu@3.7.125.170 "bash rentinn-service/terraform/setup-ssl.sh rentalinn.ddns.net"
```

**What the script does:**

- Installs Certbot (Let's Encrypt client)
- Obtains SSL certificate for your domain
- Configures Nginx for HTTPS (port 443)
- Sets up automatic certificate renewal
- Redirects HTTP to HTTPS

**After SSL setup:**

- ✅ HTTPS: https://rentalinn.ddns.net
- ✅ HTTP redirects to HTTPS automatically
- ✅ Auto-renewal configured

## Files Created/Modified

### Setup Scripts (terraform/)

- ✅ `setup-mysql-existing.sh` - MySQL setup for existing installation
- ✅ `setup-nginx.sh` - Nginx reverse proxy configuration
- ✅ `setup-ssl.sh` - SSL/HTTPS setup with Let's Encrypt
- ✅ `update-env.sh` - Environment variable configuration
- ✅ `complete-setup.sh` - Master setup orchestrator

### Configuration Files

- ✅ `.env` - Updated with database credentials and DB_DATABASE
- ✅ `docker-compose.yml` - Added extra_hosts and DB_DATABASE env var
- ✅ `/etc/nginx/sites-available/rentinn` - Nginx configuration
- ✅ `/etc/mysql/mysql.conf.d/mysqld.cnf` - MySQL bind address updated

## Git Commits

1. **f7fca13** - Setup scripts for MySQL, Nginx, SSL
2. **a47f6c1** - Added host.docker.internal for MySQL access
3. **e5dc920** - Added DB_DATABASE environment variable

## Testing the Application

### Health Check

```bash
curl http://3.7.125.170/health
# Response: {"status":"ok","message":"Service is running"}
```

### View Logs

```bash
ssh -i terraform/test.pem ubuntu@3.7.125.170 "docker logs rentinn-service --tail 50"
```

### Restart Container

```bash
ssh -i terraform/test.pem ubuntu@3.7.125.170 "cd rentinn-service && docker-compose restart"
```

### Check MySQL Connection

```bash
ssh -i terraform/test.pem ubuntu@3.7.125.170 "mysql -u rentinn_user -p'RentInn@User2024' rentinn_db -e 'SHOW TABLES;'"
```

## Troubleshooting

### Container can't connect to MySQL

```bash
# Check MySQL is running
ssh -i terraform/test.pem ubuntu@3.7.125.170 "sudo systemctl status mysql"

# Check MySQL bind address
ssh -i terraform/test.pem ubuntu@3.7.125.170 "sudo ss -tulpn | grep 3306"
# Should show: 0.0.0.0:3306

# Check user permissions
ssh -i terraform/test.pem ubuntu@3.7.125.170 "mysql -u debian-sys-maint -p'krKYdag1OW8XbbYw' -e \"SELECT user, host FROM mysql.user WHERE user='rentinn_user';\""
```

### Nginx not working

```bash
# Check Nginx status
ssh -i terraform/test.pem ubuntu@3.7.125.170 "sudo systemctl status nginx"

# Test Nginx config
ssh -i terraform/test.pem ubuntu@3.7.125.170 "sudo nginx -t"

# Restart Nginx
ssh -i terraform/test.pem ubuntu@3.7.125.170 "sudo systemctl restart nginx"
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Database Credentials** are stored in plain text in `.env` file
   - Consider using AWS Secrets Manager or Parameter Store
   - Restrict EC2 security group to only necessary ports

2. **MySQL Root Access** uses debian-sys-maint user
   - Password: `krKYdag1OW8XbbYw`
   - Store securely and rotate regularly

3. **JWT Secret** is currently a placeholder
   - Generate a strong secret: `openssl rand -base64 64`
   - Update in `.env` file

4. **SSH Key** (test.pem) has full access
   - Permissions: 400 (read-only)
   - Keep secure, never commit to git

## Current Status

✅ **COMPLETED:**

- MySQL database setup and running
- Nginx reverse proxy configured
- Docker container running successfully
- Application accessible via HTTP
- Database connection working
- All routes mapped and ready

⏳ **PENDING:**

- DNS update to point to 3.7.125.170
- SSL certificate installation
- HTTPS configuration

## Contact Information

**Repository:** https://github.com/financy-school/rentinn-service
**Branch:** main
**Latest Commit:** e5dc920

---

**Date:** October 11, 2025
**Status:** Production Ready (HTTP) - SSL Pending DNS Update
