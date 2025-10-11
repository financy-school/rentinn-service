# RentInn Service - AWS Deployment Guide

Complete guide for deploying RentInn service to AWS using Terraform with Docker containerization.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Deployment](#deployment)
- [Post-Deployment](#post-deployment)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)
- [Cost Estimation](#cost-estimation)

## 🔧 Prerequisites

### Required Software

1. **Terraform** (v1.0+)

   ```bash
   # macOS
   brew install terraform

   # Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

2. **AWS CLI** (Optional but recommended)

   ```bash
   # macOS
   brew install awscli

   # Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

### Required AWS Resources

1. **AWS Account** with appropriate permissions
2. **AWS Access Key & Secret Key**
3. **EC2 Key Pair** created in your target region
   - Go to: AWS Console → EC2 → Key Pairs → Create Key Pair
   - Download the `.pem` file and save it securely
   - Set proper permissions: `chmod 400 your-key.pem`

### Required Information

- GitHub repository URL
- GitHub Personal Access Token (for private repos)
- Desired MySQL password
- JWT secret key
- Domain name (optional)
- AWS S3 bucket name (optional)

## 🚀 Quick Start

```bash
# 1. Navigate to terraform directory
cd terraform

# 2. Copy and configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# 3. Initialize Terraform
terraform init

# 4. Plan deployment
terraform plan

# 5. Deploy
terraform apply

# 6. Get outputs
terraform output
```

## 📝 Detailed Setup

### Step 1: Configure Terraform Variables

Edit `terraform/terraform.tfvars`:

```hcl
# AWS Configuration
aws_region     = "us-east-1"
aws_access_key = "AKIAIOSFODNN7EXAMPLE"
aws_secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

# EC2 Configuration
instance_type = "t3.medium"
key_name      = "my-key-pair"  # Without .pem extension
volume_size   = 30

# GitHub Configuration
github_repo_url = "https://github.com/financy-school/rentinn-service.git"
github_token    = ""  # Only for private repos

# Database Configuration
db_password = "SecurePassword123!"
db_name     = "rentinn_db"
db_user     = "rentinn_user"

# Application Configuration
jwt_secret      = "your-super-secret-jwt-key"
aws_bucket_name = "your-s3-bucket"  # Optional
service_port    = 4200
domain_name     = ""  # Optional: yourdomain.com
```

### Step 2: Verify Dockerfile

Ensure your `Dockerfile` exists in the project root and is properly configured for production.

### Step 3: Add Health Check Endpoint

If not already present, add a health check to your NestJS application:

```typescript
// src/app.controller.ts
@Get('health')
healthCheck() {
  return { status: 'ok', message: 'Service is running' };
}
```

## 🎯 Deployment

### Initialize Terraform

```bash
cd terraform
terraform init
```

Expected output:

```
Initializing the backend...
Initializing provider plugins...
Terraform has been successfully initialized!
```

### Plan Deployment

```bash
terraform plan
```

Review the planned changes. You should see:

- 1 Security Group
- 1 EC2 Instance
- 1 Elastic IP

### Apply Deployment

```bash
terraform apply
```

Type `yes` when prompted.

**Deployment takes approximately 10-15 minutes** and will:

1. Create EC2 instance with Ubuntu 22.04
2. Install Docker, MySQL, Nginx
3. Clone your repository
4. Build Docker containers
5. Configure Nginx as reverse proxy
6. Set up automatic security updates

### Get Deployment Information

```bash
terraform output
```

Output includes:

- `instance_id`: EC2 instance ID
- `public_ip`: Server's public IP address
- `ssh_command`: SSH connection command
- `application_url`: Application URL
- `health_check_url`: Health check endpoint

## ✅ Post-Deployment

### Verify Installation

1. **SSH into server:**

   ```bash
   ssh -i your-key.pem ubuntu@<public_ip>
   ```

2. **Check Docker containers:**

   ```bash
   cd rentinn-service
   docker-compose ps
   ```

3. **View application logs:**

   ```bash
   ./logs-rentinn.sh
   # or
   docker-compose logs -f app
   ```

4. **Test health endpoint:**

   ```bash
   curl http://<public_ip>/health
   ```

5. **Access via browser:**
   ```
   http://<public_ip>
   ```

### SSL Certificate Setup (with Domain)

If you have a domain:

1. Point your domain A record to the Elastic IP
2. Install Certbot:
   ```bash
   ssh -i your-key.pem ubuntu@<public_ip>
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

### Database Access

```bash
# SSH into server
ssh -i your-key.pem ubuntu@<public_ip>

# Access MySQL
mysql -u rentinn_user -p
# Enter password from terraform.tfvars
```

## 🔄 Maintenance

### Update Application Code

```bash
ssh -i your-key.pem ubuntu@<public_ip>
cd rentinn-service

# Use the update script
./update-rentinn.sh

# Or manually:
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Restart Application

```bash
ssh -i your-key.pem ubuntu@<public_ip>
./restart-rentinn.sh
```

### View Logs

```bash
# Application logs
./logs-rentinn.sh

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MySQL logs
sudo tail -f /var/log/mysql/error.log

# Deployment logs
sudo tail -f /var/log/user-data.log
```

### Backup Database

```bash
# Create backup
docker exec rentinn-service mysqldump -u root -p<password> rentinn_db > backup_$(date +%Y%m%d).sql

# Restore backup
mysql -u root -p<password> rentinn_db < backup_20241011.sql
```

### Scale Instance

Edit `terraform.tfvars`:

```hcl
instance_type = "t3.large"  # or t3.xlarge, etc.
```

Apply changes:

```bash
terraform apply
```

## 🔍 Troubleshooting

### Application Not Starting

```bash
# Check deployment logs
sudo tail -f /var/log/user-data.log

# Check Docker logs
docker-compose logs -f

# Restart containers
docker-compose restart
```

### Database Connection Issues

```bash
# Check MySQL status
sudo systemctl status mysql

# Test connection
mysql -u rentinn_user -p -h localhost rentinn_db

# Check .env file
cat .env
```

### Nginx Issues

```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Cannot Connect to Instance

```bash
# Verify security group (local)
terraform show | grep security_group

# Check instance status
terraform show | grep instance_state

# Test SSH connection
ssh -v -i your-key.pem ubuntu@<public_ip>
```

### Docker Issues

```bash
# Check Docker status
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker

# View Docker logs
sudo journalctl -u docker -f

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 💰 Cost Estimation

Estimated monthly costs (us-east-1):

| Resource               | Cost              |
| ---------------------- | ----------------- |
| t3.medium EC2 instance | ~$30/month        |
| Elastic IP (attached)  | Free              |
| Storage (30GB EBS)     | ~$3/month         |
| Data transfer          | Variable          |
| **Total**              | **~$33-40/month** |

Instance type comparison:

- `t3.small`: ~$15/month (2 vCPU, 2GB RAM)
- `t3.medium`: ~$30/month (2 vCPU, 4GB RAM) ⭐ Recommended
- `t3.large`: ~$60/month (2 vCPU, 8GB RAM)
- `t3.xlarge`: ~$120/month (4 vCPU, 16GB RAM)

## 🗑️ Cleanup

To destroy all AWS resources:

```bash
cd terraform
terraform destroy
```

Type `yes` when prompted.

**⚠️ Warning:** This is irreversible and will:

- Terminate EC2 instance
- Delete Elastic IP
- Remove Security Group
- **Delete all data on the instance**

## 🔐 Security Best Practices

1. **Credentials**
   - Never commit `terraform.tfvars`
   - Rotate passwords regularly
   - Use AWS Secrets Manager for sensitive data

2. **Network Security**
   - Restrict SSH access to specific IP ranges
   - Use VPN for database access
   - Enable AWS CloudWatch monitoring

3. **Application Security**
   - Keep system packages updated
   - Monitor application logs
   - Set up automated backups
   - Use HTTPS with SSL certificates

4. **Access Control**
   - Use IAM roles instead of access keys when possible
   - Enable MFA on AWS account
   - Implement least privilege access

## 📊 Monitoring

### Set Up CloudWatch (Optional)

```bash
# Install CloudWatch agent
ssh -i your-key.pem ubuntu@<public_ip>
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
```

### Health Checks

Add this to your monitoring:

```bash
# Add to crontab
*/5 * * * * curl -f http://localhost:4200/health || echo "Health check failed" | mail -s "RentInn Health Alert" admin@yourdomain.com
```

## 🎉 Success Checklist

- [ ] Terraform applies successfully
- [ ] Can SSH into instance
- [ ] Docker containers are running
- [ ] Application responds to health check
- [ ] Can access application via browser
- [ ] Nginx is proxying correctly
- [ ] Database is accessible
- [ ] SSL certificate installed (if using domain)
- [ ] Logs are accessible
- [ ] Update script works
- [ ] Backup strategy implemented

## 📞 Support

For issues with:

- **Terraform**: Check [Terraform documentation](https://www.terraform.io/docs)
- **AWS**: Review [AWS documentation](https://docs.aws.amazon.com/)
- **Docker**: Visit [Docker documentation](https://docs.docker.com/)
- **Application**: Check application logs with `./logs-rentinn.sh`

## 📚 Additional Resources

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Let's Encrypt SSL](https://letsencrypt.org/getting-started/)

---

**Need help?** Check the troubleshooting section or review logs on your EC2 instance.
