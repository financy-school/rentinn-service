# RentInn Service - Quick Reference Guide

## 🔗 URLs

- **HTTPS:** https://rentalinn.ddns.net
- **Health Check:** https://rentalinn.ddns.net/health
- **HTTP:** http://rentalinn.ddns.net (redirects to HTTPS)

## 📦 Server Access

```bash
cd /Users/sumitkumargupta/Desktop/untitledfolder/rentinn-service/terraform
ssh -i test.pem ubuntu@3.7.125.170
```

## 🐳 Docker Commands

```bash
# View logs
docker logs rentinn-service -f

# Restart container
cd /home/ubuntu/rentinn-service
docker-compose restart

# Stop and rebuild
docker-compose down
docker-compose up -d --build

# Check status
docker ps
docker logs rentinn-service --tail 50
```

## 🔧 Environment Variables

### Update .env and restart
```bash
ssh -i test.pem ubuntu@3.7.125.170
cd /home/ubuntu/rentinn-service
nano .env
docker-compose restart
```

### Quick update specific variables
```bash
ssh -i test.pem ubuntu@3.7.125.170
cd /home/ubuntu/rentinn-service
bash terraform/update-env-comprehensive.sh \
  EMAIL_FROM="new@email.com" \
  SMTP_PASS="newpassword"
docker-compose restart
```

## 🗄️ Database

### Connect to MySQL
```bash
ssh -i test.pem ubuntu@3.7.125.170
mysql -u rentinn_user -p'RentInn@User2024' rentinn_db
```

### Common MySQL commands
```sql
SHOW TABLES;
SELECT COUNT(*) FROM users;
DESCRIBE users;
```

## 🔐 SSL Certificate

### Check certificate status
```bash
ssh -i test.pem ubuntu@3.7.125.170
sudo certbot certificates
```

### Renew certificate manually
```bash
sudo certbot renew --force-renewal
sudo systemctl restart nginx
```

### Test auto-renewal
```bash
sudo certbot renew --dry-run
```

## 🌐 Nginx

### Test configuration
```bash
ssh -i test.pem ubuntu@3.7.125.170
sudo nginx -t
```

### Restart Nginx
```bash
sudo systemctl restart nginx
sudo systemctl status nginx
```

### View Nginx logs
```bash
sudo tail -f /var/log/nginx/rentinn_access.log
sudo tail -f /var/log/nginx/rentinn_error.log
```

## 📊 Monitoring

### Check container health
```bash
docker inspect rentinn-service | grep -A 20 Health
```

### Check system resources
```bash
ssh -i test.pem ubuntu@3.7.125.170
df -h          # Disk usage
free -h        # Memory usage
top            # CPU/Memory real-time
docker stats   # Container stats
```

### View application logs
```bash
docker logs rentinn-service --tail 100
docker logs rentinn-service -f  # Follow logs
```

## 🚀 Deployment

### Pull latest changes
```bash
ssh -i test.pem ubuntu@3.7.125.170
cd /home/ubuntu/rentinn-service
git pull origin main
docker-compose down
docker-compose up -d --build
```

### Quick update script (on server)
```bash
/home/ubuntu/update-rentinn.sh
```

## 🧪 Testing

### Health check
```bash
curl https://rentalinn.ddns.net/health
# Expected: {"status":"ok","message":"Service is running"}
```

### Test with verbose output
```bash
curl -v https://rentalinn.ddns.net/health
```

### Test from inside container
```bash
docker exec rentinn-service curl http://localhost:4200/health
```

## 📧 Email Testing

### Check SMTP config
```bash
docker exec rentinn-service env | grep SMTP
```

### Test email sending (from container)
```bash
docker exec -it rentinn-service node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transporter.verify().then(() => console.log('✅ SMTP ready')).catch(console.error);
"
```

## 🔍 Troubleshooting

### Container won't start
```bash
# Check logs
docker logs rentinn-service --tail 100

# Check docker-compose
docker-compose config

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

### Database connection issues
```bash
# Check MySQL is running
sudo systemctl status mysql

# Check if MySQL is listening
sudo ss -tulpn | grep 3306

# Test connection from host
mysql -u rentinn_user -p'RentInn@User2024' rentinn_db -e "SELECT 1;"

# Check Docker network
docker network inspect rentinn-service_rentinn-network
```

### HTTPS not working
```bash
# Check certificate
sudo certbot certificates

# Check Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check if port 443 is open
sudo ufw status | grep 443
```

## 📁 Important Files

### On Server
- `.env` - Environment variables: `/home/ubuntu/rentinn-service/.env`
- `docker-compose.yml` - Container config: `/home/ubuntu/rentinn-service/docker-compose.yml`
- Nginx config: `/etc/nginx/sites-available/rentinn`
- SSL certificates: `/etc/letsencrypt/live/rentalinn.ddns.net/`
- MySQL config: `/etc/mysql/mysql.conf.d/mysqld.cnf`

### On Local Machine
- SSH key: `terraform/test.pem`
- Terraform config: `terraform/terraform.tfvars`
- Setup scripts: `terraform/*.sh`

## 🔄 Common Tasks

### Rotate secrets
```bash
# 1. Generate new JWT secret
openssl rand -base64 64

# 2. Update .env
ssh -i test.pem ubuntu@3.7.125.170
cd /home/ubuntu/rentinn-service
nano .env  # Update JWT_SECRET

# 3. Restart
docker-compose restart
```

### Backup database
```bash
ssh -i test.pem ubuntu@3.7.125.170
mysqldump -u rentinn_user -p'RentInn@User2024' rentinn_db > backup_$(date +%Y%m%d).sql
```

### Restore database
```bash
mysql -u rentinn_user -p'RentInn@User2024' rentinn_db < backup_20251011.sql
```

## 🆘 Emergency Commands

### Service completely down
```bash
ssh -i test.pem ubuntu@3.7.125.170

# 1. Check if container is running
docker ps -a

# 2. Check logs
docker logs rentinn-service --tail 100

# 3. Restart everything
cd /home/ubuntu/rentinn-service
docker-compose down
docker-compose up -d

# 4. Check MySQL
sudo systemctl status mysql
sudo systemctl restart mysql

# 5. Check Nginx
sudo systemctl status nginx
sudo systemctl restart nginx
```

### Out of disk space
```bash
# Clean Docker
docker system prune -a --volumes

# Clean logs
sudo journalctl --vacuum-time=3d

# Check large files
du -sh /* | sort -h
```

### High memory usage
```bash
# Check what's using memory
docker stats
free -h

# Restart container
docker-compose restart
```

## 📞 Key Information

- **EC2 Instance ID:** i-05f470c5686328dd3
- **Public IP:** 3.7.125.170
- **Region:** us-east-1
- **Instance Type:** t3.small
- **Domain:** rentalinn.ddns.net
- **Database:** rentinn_db
- **DB User:** rentinn_user
- **Container:** rentinn-service
- **Port:** 4200

## 📚 Documentation

- Full Setup: `DATABASE_AND_NGINX_SETUP_COMPLETE.md`
- HTTPS Setup: `HTTPS_AND_ENV_SETUP_COMPLETE.md`
- Terraform Guide: `terraform/README.md`
- Quick Reference: `terraform/QUICK_REFERENCE.md`

---

*Last Updated: October 11, 2025*
