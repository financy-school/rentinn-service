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

# Email Configuration
variable "email_from" {
  description = "Email address to send emails from"
  type        = string
  default     = ""
}

variable "smtp_host" {
  description = "SMTP host"
  type        = string
  default     = "smtp.gmail.com"
}

variable "smtp_port" {
  description = "SMTP port"
  type        = number
  default     = 587
}

variable "smtp_user" {
  description = "SMTP username"
  type        = string
  default     = ""
  sensitive   = true
}

variable "smtp_pass" {
  description = "SMTP password"
  type        = string
  default     = ""
  sensitive   = true
}

variable "smtp_secure" {
  description = "Use secure SMTP connection"
  type        = bool
  default     = true
}

variable "email_sending_enabled" {
  description = "Enable email sending"
  type        = bool
  default     = true
}

# AWS Documents Configuration
variable "aws_docs_region" {
  description = "AWS region for documents"
  type        = string
  default     = "ap-south-1"
}

variable "aws_docs_access_key" {
  description = "AWS access key for documents"
  type        = string
  default     = ""
  sensitive   = true
}

variable "aws_docs_secret_access_key" {
  description = "AWS secret access key for documents"
  type        = string
  default     = ""
  sensitive   = true
}

variable "docs_bucket_name" {
  description = "S3 bucket name for documents"
  type        = string
  default     = ""
}

# Push Notifications
variable "push_notification_enabled" {
  description = "Enable push notifications"
  type        = bool
  default     = true
}

# Firebase Configuration
variable "firebase_service_account_path" {
  description = "Path to Firebase service account JSON"
  type        = string
  default     = "config/firebase/firebase-adminsdk.json"
}

# Master DB Sync
variable "master_db_sync" {
  description = "Enable master database synchronization"
  type        = bool
  default     = true
}
