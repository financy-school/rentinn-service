# AWS Configuration
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "aws_access_key" {
  description = "AWS access key"
  type        = string
  sensitive   = true
}

variable "aws_secret_key" {
  description = "AWS secret key"
  type        = string
  sensitive   = true
}

# EC2 Configuration
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "key_name" {
  description = "Name of the SSH key pair"
  type        = string
}

variable "volume_size" {
  description = "Size of the root volume in GB"
  type        = number
  default     = 30
}

# GitHub Configuration
variable "github_repo_url" {
  description = "GitHub repository URL"
  type        = string
}

variable "github_token" {
  description = "GitHub personal access token (for private repos)"
  type        = string
  default     = ""
  sensitive   = true
}

# Database Configuration
variable "db_password" {
  description = "MySQL root password"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "rentinn_db"
}

variable "db_user" {
  description = "Database user"
  type        = string
  default     = "rentinn_user"
}

# Application Configuration
variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "aws_bucket_name" {
  description = "S3 bucket name for file uploads"
  type        = string
  default     = ""
}

variable "service_port" {
  description = "Application service port"
  type        = number
  default     = 4200
}

variable "domain_name" {
  description = "Domain name for the application (optional)"
  type        = string
  default     = ""
}

# Environment
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}
