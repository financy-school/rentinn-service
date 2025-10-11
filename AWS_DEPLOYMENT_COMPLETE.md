# AWS Deployment Setup - Complete! ✅

## 🎉 What Has Been Created

### Terraform Infrastructure Files

1. **`terraform/main.tf`**
   - Complete AWS infrastructure definition
   - EC2 instance with Ubuntu 22.04
   - Security Group with proper ports (22, 80, 443, 4200, 3306)
   - Elastic IP for static address
   - Outputs for easy access to deployment info

2. **`terraform/variables.tf`**
   - All configurable variables defined
   - Sensitive variables marked appropriately
   - Default values provided where applicable

3. **`terraform/user-data.sh`**
   - Comprehensive bootstrap script
   - Installs Docker, MySQL, Nginx
   - Clones repository and builds containers
   - Configures reverse proxy
   - Creates helper scripts on server
   - Full logging for troubleshooting

4. **`terraform/terraform.tfvars.example`**
   - Template with all required variables
   - Comments explaining each setting
   - Ready to copy and customize

5. **`terraform/.gitignore`**
   - Protects sensitive files
   - Excludes terraform state and credentials
   - Prevents accidental commits

### Documentation Files

6. **`terraform/README.md`**
   - Complete deployment guide
   - Step-by-step instructions
   - Troubleshooting section
   - Maintenance procedures
   - Security best practices
   - Cost estimation

7. **`terraform/QUICK_REFERENCE.md`**
   - Quick commands reference
   - Common tasks
   - Troubleshooting quick fixes
   - Instance types guide
   - Cost calculator

8. **`terraform/deploy.sh`**
   - Interactive deployment helper
   - Menu-driven interface
   - Handles common tasks:
     - Initial setup
     - Deployment
     - Updates
     - SSH connection
     - Viewing logs
     - Destruction

### Updated Files

9. **`README.md`** (updated)
   - Added AWS Deployment section
   - Quick start guide
   - Links to detailed documentation

## 🚀 How to Use

### Option 1: Using the Helper Script (Easiest)

```bash
cd terraform
./deploy.sh

# Follow the interactive menu:
# 1 - Initial Setup (first time)
# 2 - Deploy to AWS
# 4 - View deployment info
# 5 - Connect via SSH
```

### Option 2: Manual Deployment

```bash
cd terraform

# Setup
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars  # Edit with your values

# Deploy
terraform init
terraform plan
terraform apply

# Get info
terraform output
```

## 📋 What You Need Before Deploying

### Required Information

1. **AWS Credentials**
   - Access Key ID
   - Secret Access Key
   - Target region (default: us-east-1)

2. **EC2 Key Pair**
   - Create in AWS Console → EC2 → Key Pairs
   - Download .pem file
   - Set permissions: `chmod 400 your-key.pem`

3. **Configuration Values**
   - GitHub repository URL
   - GitHub token (if private repo)
   - MySQL password (strong password)
   - JWT secret key
   - Optional: S3 bucket name, domain name

### Software Requirements

- Terraform v1.0+ (`brew install terraform`)
- AWS CLI (optional): `brew install awscli`
- SSH client (built-in on Mac/Linux)

## 🎯 Deployment Process

### What Happens During Deployment

1. **Terraform Creates** (1-2 minutes)
   - EC2 instance (t3.medium by default)
   - Elastic IP
   - Security Group

2. **Instance Bootstrap** (10-15 minutes)
   - System updates
   - Docker installation
   - MySQL setup and configuration
   - Nginx installation
   - Repository cloning
   - Docker container build
   - Nginx reverse proxy setup
   - Firewall configuration

3. **Total Time**: ~15 minutes

### After Deployment

The script provides:

- Public IP address
- SSH command
- Application URL
- Health check URL
- Database connection details

## ✅ Verification Steps

```bash
# 1. Get deployment info
cd terraform
terraform output

# 2. Test health endpoint
curl http://$(terraform output -raw public_ip)/health

# Expected response:
# {"status":"ok","message":"Service is running"}

# 3. SSH into server
ssh -i your-key.pem ubuntu@$(terraform output -raw public_ip)

# 4. Check containers
cd rentinn-service
docker-compose ps

# 5. View logs
./logs-rentinn.sh
```

## 📁 File Structure

```
rentinn-service/
├── terraform/
│   ├── main.tf                    # Infrastructure definition
│   ├── variables.tf               # Variable definitions
│   ├── user-data.sh              # Bootstrap script
│   ├── terraform.tfvars.example  # Config template
│   ├── terraform.tfvars          # Your config (git-ignored)
│   ├── deploy.sh                 # Helper script ⭐
│   ├── .gitignore               # Git ignore rules
│   ├── README.md                # Full documentation
│   └── QUICK_REFERENCE.md       # Quick commands
│
├── Dockerfile                    # Already created
├── docker-compose.yml           # Already created
├── .dockerignore               # Already created
└── README.md                   # Updated with AWS section
```

## 🔧 Server Helper Scripts

Once deployed, these scripts are available on the server:

```bash
# SSH into server first
ssh -i your-key.pem ubuntu@YOUR_IP

# Then use these scripts:
./update-rentinn.sh    # Pull latest code and rebuild
./restart-rentinn.sh   # Restart application
./logs-rentinn.sh      # View application logs
```

## 💰 Cost Breakdown

### Monthly Costs (us-east-1)

| Resource         | Cost                 |
| ---------------- | -------------------- |
| t3.medium EC2    | ~$30                 |
| 30GB EBS Storage | ~$3                  |
| Elastic IP       | Free (when attached) |
| Data Transfer    | Variable             |
| **Total**        | **~$33-40/month**    |

### Instance Options

- `t3.small` - $15/month (2GB RAM) - Development
- `t3.medium` - $30/month (4GB RAM) - **Recommended**
- `t3.large` - $60/month (8GB RAM) - High Traffic
- `t3.xlarge` - $120/month (16GB RAM) - Very High Traffic

## 🔐 Security Features

✅ **Network Security**

- Security group with restricted ports
- Firewall (ufw) configured
- SSH access only

✅ **Application Security**

- Non-root Docker user
- Encrypted EBS volume
- Secure database configuration
- Environment variables for secrets

✅ **Best Practices**

- Automatic security updates
- Nginx reverse proxy
- Health check monitoring
- Log rotation

## 🌐 Optional: Domain & SSL Setup

After deployment, if you have a domain:

```bash
# 1. Point domain A record to Elastic IP (from terraform output)

# 2. SSH into server
ssh -i your-key.pem ubuntu@YOUR_IP

# 3. Install SSL certificate
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com

# 4. Test auto-renewal
sudo certbot renew --dry-run
```

## 🔄 Common Operations

### Update Application Code

```bash
# Option 1: Use helper script (on server)
ssh -i your-key.pem ubuntu@YOUR_IP
./update-rentinn.sh

# Option 2: Manual (on server)
cd rentinn-service
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### View Logs

```bash
# Application logs
ssh -i your-key.pem ubuntu@YOUR_IP "./logs-rentinn.sh"

# Deployment logs
ssh -i your-key.pem ubuntu@YOUR_IP "sudo tail -f /var/log/user-data.log"

# Nginx logs
ssh -i your-key.pem ubuntu@YOUR_IP "sudo tail -f /var/log/nginx/access.log"
```

### Backup Database

```bash
ssh -i your-key.pem ubuntu@YOUR_IP
docker exec rentinn-service mysqldump -u root -pYOUR_PASSWORD rentinn_db > backup.sql
```

### Scale Instance

```bash
# Edit terraform.tfvars
nano terraform/terraform.tfvars

# Change instance_type:
instance_type = "t3.large"

# Apply changes
cd terraform
terraform apply
```

## 🗑️ Cleanup

To remove all AWS resources:

```bash
cd terraform
terraform destroy

# Type 'yes' when prompted
```

**⚠️ Warning**: This permanently deletes:

- EC2 instance
- Elastic IP
- Security Group
- All data on the instance

## 📚 Documentation Links

- **Main Guide**: `terraform/README.md` - Complete deployment guide
- **Quick Reference**: `terraform/QUICK_REFERENCE.md` - Common commands
- **Docker Guide**: `DOCKER.md` - Docker documentation
- **Build Fixes**: `DOCKER_BUILD_FIXES.md` - Docker troubleshooting

## 🎯 Next Steps

1. **Prepare Configuration**

   ```bash
   cd terraform
   cp terraform.tfvars.example terraform.tfvars
   nano terraform.tfvars  # Add your AWS credentials
   ```

2. **Deploy**

   ```bash
   ./deploy.sh
   # Choose option 1 (Initial Setup)
   # Then choose option 2 (Deploy to AWS)
   ```

3. **Verify**

   ```bash
   curl http://$(terraform output -raw public_ip)/health
   ```

4. **Optional: Setup SSL**
   - Point domain to Elastic IP
   - Run certbot on server

5. **Monitor**
   - Check logs regularly
   - Set up CloudWatch (optional)
   - Monitor costs in AWS Console

## ✨ Features Included

✅ Automated infrastructure provisioning
✅ Docker containerization
✅ MySQL database with secure configuration
✅ Nginx reverse proxy
✅ SSL-ready (with Certbot support)
✅ Health check endpoint
✅ Automatic security updates
✅ Helper scripts for common tasks
✅ Comprehensive logging
✅ Firewall configuration
✅ Elastic IP for static address
✅ One-command deployment
✅ One-command destruction

## 🆘 Getting Help

1. **Check Documentation**
   - Read `terraform/README.md` for detailed guide
   - Check `terraform/QUICK_REFERENCE.md` for quick commands

2. **View Logs**

   ```bash
   ssh -i your-key.pem ubuntu@YOUR_IP "sudo tail -f /var/log/user-data.log"
   ```

3. **Common Issues**
   - Deployment taking long → Normal, wait 15 minutes
   - Can't SSH → Check key pair name and permissions
   - Health check fails → Wait a few minutes, check logs
   - 502 Bad Gateway → Application starting, wait 2-3 minutes

4. **Test Components**

   ```bash
   # Test Docker
   ssh -i your-key.pem ubuntu@YOUR_IP "docker ps"

   # Test MySQL
   ssh -i your-key.pem ubuntu@YOUR_IP "sudo systemctl status mysql"

   # Test Nginx
   ssh -i your-key.pem ubuntu@YOUR_IP "sudo systemctl status nginx"
   ```

## 🎉 Success Checklist

- [ ] Terraform files created
- [ ] terraform.tfvars configured
- [ ] Terraform initialized
- [ ] Deployment successful
- [ ] Public IP received
- [ ] Can SSH into server
- [ ] Docker containers running
- [ ] Health check returns OK
- [ ] Application accessible in browser
- [ ] Database accessible
- [ ] Helper scripts working
- [ ] Logs accessible

---

**You're all set!** 🚀

Run `cd terraform && ./deploy.sh` to get started with deployment!
