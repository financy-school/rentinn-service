# RentInn AWS Deployment - Quick Reference

## 📝 Pre-Deployment Checklist

- [ ] AWS Account with access keys
- [ ] EC2 Key Pair created and downloaded
- [ ] GitHub repository accessible
- [ ] Terraform installed (`terraform --version`)
- [ ] Docker files ready (Dockerfile, .dockerignore)
- [ ] Health check endpoint exists in application

## 🚀 Quick Deployment (5 Steps)

```bash
# 1. Navigate to terraform directory
cd terraform

# 2. Copy and configure
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars  # Edit with your values

# 3. Initialize
terraform init

# 4. Deploy
terraform apply
# Type 'yes' when prompted

# 5. Get info
terraform output
```

## 🎯 Using the Helper Script (Easier!)

```bash
cd terraform
./deploy.sh

# Then choose:
# 1 - Initial Setup (first time)
# 2 - Deploy to AWS
# 4 - View deployment info
# 5 - Connect via SSH
```

## 📋 Required Configuration

### Minimum Required in terraform.tfvars:

```hcl
aws_region     = "us-east-1"
aws_access_key = "YOUR_AWS_ACCESS_KEY"
aws_secret_key = "YOUR_AWS_SECRET_KEY"
key_name       = "your-key-name"
github_repo_url = "https://github.com/financy-school/rentinn-service.git"
db_password    = "SecurePassword123!"
jwt_secret     = "your-jwt-secret-key"
```

## 🔑 Get AWS Credentials

1. Go to AWS Console → IAM → Users → Your User
2. Security Credentials → Create Access Key
3. Download and save securely
4. Add to `terraform.tfvars`

## 🔐 Create EC2 Key Pair

1. Go to AWS Console → EC2 → Key Pairs
2. Create Key Pair → Name: `rentinn-key`
3. Download `rentinn-key.pem`
4. Save to safe location
5. Set permissions: `chmod 400 rentinn-key.pem`

## ⏱️ Deployment Timeline

- Terraform apply: 1-2 minutes
- Instance bootstrap: 10-15 minutes
- Total time: ~15 minutes

## ✅ Verify Deployment

```bash
# Get public IP
terraform output public_ip

# Test health check
curl http://$(terraform output -raw public_ip)/health

# Expected response:
# {"status":"ok","message":"Service is running"}

# SSH into server
ssh -i your-key.pem ubuntu@$(terraform output -raw public_ip)

# Check containers
docker-compose ps

# View logs
./logs-rentinn.sh
```

## 🔧 Common Post-Deployment Tasks

### Access the Application

```
http://YOUR_PUBLIC_IP
```

### SSH into Server

```bash
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP
```

### View Application Logs

```bash
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP
cd rentinn-service
./logs-rentinn.sh
```

### Update Application

```bash
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP
./update-rentinn.sh
```

### Restart Application

```bash
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP
./restart-rentinn.sh
```

### Database Access

```bash
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP
mysql -u rentinn_user -p
# Enter password from terraform.tfvars
```

## 🌐 Setup Domain & SSL

```bash
# 1. Point domain A record to Elastic IP
# 2. SSH into server
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP

# 3. Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 4. Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# 5. Test auto-renewal
sudo certbot renew --dry-run
```

## 📊 Monitoring

### Check Application Status

```bash
curl http://YOUR_PUBLIC_IP/health
```

### View Deployment Logs

```bash
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP
sudo tail -f /var/log/user-data.log
```

### View Nginx Logs

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### View MySQL Logs

```bash
sudo tail -f /var/log/mysql/error.log
```

## 🔄 Update Infrastructure

```bash
# Edit terraform.tfvars
nano terraform/terraform.tfvars

# Apply changes
cd terraform
terraform plan
terraform apply
```

## 💾 Backup Database

```bash
# SSH into server
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP

# Create backup
docker exec rentinn-service mysqldump -u root -pYOUR_PASSWORD rentinn_db > backup_$(date +%Y%m%d).sql

# Download backup to local
exit
scp -i your-key.pem ubuntu@YOUR_PUBLIC_IP:~/backup_*.sql ./
```

## 🗑️ Destroy Deployment

```bash
cd terraform
terraform destroy
# Type 'yes' when prompted

# WARNING: This deletes EVERYTHING including data!
```

## 🐛 Troubleshooting Quick Fixes

### Application Not Starting

```bash
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP
cd rentinn-service
docker-compose down
docker-compose up -d
```

### Check Deployment Progress

```bash
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP
sudo tail -f /var/log/user-data.log
```

### Restart Nginx

```bash
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP
sudo systemctl restart nginx
```

### Restart MySQL

```bash
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP
sudo systemctl restart mysql
```

## 💰 Cost Calculator

| Instance Type | vCPU | RAM  | Monthly Cost |
| ------------- | ---- | ---- | ------------ |
| t3.small      | 2    | 2GB  | ~$15         |
| t3.medium ⭐  | 2    | 4GB  | ~$30         |
| t3.large      | 2    | 8GB  | ~$60         |
| t3.xlarge     | 4    | 16GB | ~$120        |

Add ~$3/month for 30GB storage.

## 📞 Quick Commands Reference

```bash
# Deploy
cd terraform && terraform apply

# Get info
terraform output

# SSH
ssh -i your-key.pem ubuntu@$(terraform output -raw public_ip)

# Update app
ssh -i your-key.pem ubuntu@IP "./update-rentinn.sh"

# View logs
ssh -i your-key.pem ubuntu@IP "./logs-rentinn.sh"

# Restart
ssh -i your-key.pem ubuntu@IP "./restart-rentinn.sh"

# Destroy
cd terraform && terraform destroy
```

## 🎯 Instance Types Guide

Choose based on your needs:

- **Development/Testing**: `t3.small` ($15/month)
- **Small Production**: `t3.medium` ($30/month) ⭐ Recommended
- **Medium Traffic**: `t3.large` ($60/month)
- **High Traffic**: `t3.xlarge` ($120/month)

## 📚 File Structure

```
terraform/
├── main.tf                    # Main Terraform config
├── variables.tf               # Variable definitions
├── user-data.sh              # Bootstrap script
├── terraform.tfvars          # Your config (git-ignored)
├── terraform.tfvars.example  # Example config
├── deploy.sh                 # Helper script
├── .gitignore               # Git ignore rules
└── README.md                # Full documentation
```

## 🔒 Security Reminders

- ✅ Never commit `terraform.tfvars`
- ✅ Never commit `.pem` files
- ✅ Use strong passwords
- ✅ Rotate credentials regularly
- ✅ Keep packages updated
- ✅ Monitor logs for suspicious activity
- ✅ Use SSL certificates in production

## ✨ Success Indicators

After deployment, you should see:

✅ Terraform apply completes without errors
✅ Public IP assigned
✅ Can SSH into server
✅ Docker containers running
✅ Health check returns `{"status":"ok"}`
✅ Application accessible in browser
✅ Nginx proxying correctly
✅ Database accessible

## 📖 Full Documentation

For detailed information, see:

- `terraform/README.md` - Complete deployment guide
- `DOCKER.md` - Docker documentation
- `DOCKER_BUILD_FIXES.md` - Docker troubleshooting

## 🆘 Need Help?

1. Check `terraform/README.md` for detailed guide
2. Review deployment logs: `sudo tail -f /var/log/user-data.log`
3. Check application logs: `./logs-rentinn.sh`
4. Verify Terraform state: `terraform show`
5. Test health endpoint: `curl http://IP/health`

---

**Quick Start**: `cd terraform && ./deploy.sh` 🚀
