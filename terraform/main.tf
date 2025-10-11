terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region     = var.aws_region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

# Data source for latest Ubuntu AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Security Group
resource "aws_security_group" "rentinn_sg" {
  name        = "rentinn-service-sg"
  description = "Security group for RentInn service"

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH access"
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access"
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access"
  }

  # Application Port (4200)
  ingress {
    from_port   = 4200
    to_port     = 4200
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Application port"
  }

  # MySQL (for remote access if needed)
  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "MySQL access (restrict in production)"
  }

  # Outbound - allow all
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "rentinn-service-sg"
    Environment = var.environment
    Project     = "RentInn"
  }
}

# Elastic IP
resource "aws_eip" "rentinn_eip" {
  instance = aws_instance.rentinn_server.id
  domain   = "vpc"

  tags = {
    Name        = "rentinn-service-eip"
    Environment = var.environment
    Project     = "RentInn"
  }

  depends_on = [aws_instance.rentinn_server]
}

# EC2 Instance
resource "aws_instance" "rentinn_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.rentinn_sg.id]

  root_block_device {
    volume_size = var.volume_size
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = templatefile("${path.module}/user-data.sh", {
    github_repo_url = var.github_repo_url
    github_token    = var.github_token
    db_password     = var.db_password
    db_name         = var.db_name
    db_user         = var.db_user
    jwt_secret      = var.jwt_secret
    aws_region      = var.aws_region
    aws_bucket_name = var.aws_bucket_name
    service_port    = var.service_port
    domain_name     = var.domain_name
  })

  tags = {
    Name        = "rentinn-service-server"
    Environment = var.environment
    Project     = "RentInn"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Outputs
output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.rentinn_server.id
}

output "public_ip" {
  description = "Public IP address of the instance"
  value       = aws_eip.rentinn_eip.public_ip
}

output "private_ip" {
  description = "Private IP address of the instance"
  value       = aws_instance.rentinn_server.private_ip
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ${var.key_name}.pem ubuntu@${aws_eip.rentinn_eip.public_ip}"
}

output "application_url" {
  description = "URL to access the application"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "http://${aws_eip.rentinn_eip.public_ip}"
}

output "health_check_url" {
  description = "Health check endpoint URL"
  value       = var.domain_name != "" ? "https://${var.domain_name}/health" : "http://${aws_eip.rentinn_eip.public_ip}/health"
}

output "database_connection" {
  description = "Database connection details"
  value = {
    host     = aws_eip.rentinn_eip.public_ip
    port     = 3306
    database = var.db_name
    username = var.db_user
  }
  sensitive = true
}
