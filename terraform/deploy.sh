#!/bin/bash

# RentInn Service - Deployment Helper Script
# This script helps you deploy the RentInn service to AWS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if we're in the terraform directory
if [ ! -f "main.tf" ]; then
    print_error "Please run this script from the terraform directory"
    exit 1
fi

# Main menu
print_header "RentInn Service - AWS Deployment"

echo "What would you like to do?"
echo ""
echo "1. Initial Setup (first time)"
echo "2. Deploy to AWS"
echo "3. Update existing deployment"
echo "4. View deployment info"
echo "5. Connect via SSH"
echo "6. View logs"
echo "7. Destroy deployment"
echo "8. Exit"
echo ""
read -p "Enter your choice (1-8): " choice

case $choice in
    1)
        print_header "Initial Setup"
        
        # Check if terraform.tfvars exists
        if [ -f "terraform.tfvars" ]; then
            print_warning "terraform.tfvars already exists"
            read -p "Do you want to overwrite it? (y/n): " overwrite
            if [ "$overwrite" != "y" ]; then
                print_info "Skipping terraform.tfvars creation"
            else
                cp terraform.tfvars.example terraform.tfvars
                print_success "Created terraform.tfvars from example"
                print_info "Please edit terraform.tfvars with your configuration"
                exit 0
            fi
        else
            cp terraform.tfvars.example terraform.tfvars
            print_success "Created terraform.tfvars from example"
        fi
        
        print_info "Opening terraform.tfvars in default editor..."
        ${EDITOR:-nano} terraform.tfvars
        
        print_info "Initializing Terraform..."
        terraform init
        print_success "Terraform initialized successfully"
        
        print_info "Validating configuration..."
        terraform validate
        print_success "Configuration is valid"
        
        print_header "Setup Complete!"
        print_info "Next steps:"
        echo "  1. Review your terraform.tfvars configuration"
        echo "  2. Run this script again and choose option 2 to deploy"
        ;;
        
    2)
        print_header "Deploy to AWS"
        
        if [ ! -f "terraform.tfvars" ]; then
            print_error "terraform.tfvars not found"
            print_info "Please run option 1 (Initial Setup) first"
            exit 1
        fi
        
        print_info "Planning deployment..."
        terraform plan
        
        echo ""
        read -p "Do you want to proceed with deployment? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            print_info "Deployment cancelled"
            exit 0
        fi
        
        print_info "Deploying to AWS..."
        terraform apply
        
        print_header "Deployment Complete!"
        print_info "Fetching deployment information..."
        terraform output
        
        print_info "Saving deployment info to deployment-info.txt..."
        terraform output > deployment-info.txt
        print_success "Deployment info saved"
        
        echo ""
        print_info "Next steps:"
        echo "  1. Wait 2-3 minutes for the application to fully start"
        echo "  2. Test the health endpoint: curl http://\$(terraform output -raw public_ip)/health"
        echo "  3. Access the application in your browser"
        ;;
        
    3)
        print_header "Update Existing Deployment"
        
        print_info "This will update the infrastructure if terraform.tfvars changed"
        print_warning "Application code updates should be done on the server"
        
        echo ""
        read -p "Do you want to proceed? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            print_info "Update cancelled"
            exit 0
        fi
        
        terraform plan
        
        echo ""
        read -p "Apply these changes? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            print_info "Update cancelled"
            exit 0
        fi
        
        terraform apply
        
        print_success "Deployment updated"
        ;;
        
    4)
        print_header "Deployment Information"
        
        if [ ! -f "terraform.tfstate" ]; then
            print_error "No deployment found"
            print_info "Please deploy first using option 2"
            exit 1
        fi
        
        terraform output
        
        echo ""
        print_info "Useful commands:"
        echo "  SSH: $(terraform output -raw ssh_command)"
        echo "  Health Check: curl $(terraform output -raw health_check_url)"
        echo "  Application: $(terraform output -raw application_url)"
        ;;
        
    5)
        print_header "Connect via SSH"
        
        if [ ! -f "terraform.tfstate" ]; then
            print_error "No deployment found"
            exit 1
        fi
        
        SSH_CMD=$(terraform output -raw ssh_command)
        print_info "Connecting to server..."
        print_info "Command: $SSH_CMD"
        
        eval $SSH_CMD
        ;;
        
    6)
        print_header "View Logs"
        
        if [ ! -f "terraform.tfstate" ]; then
            print_error "No deployment found"
            exit 1
        fi
        
        PUBLIC_IP=$(terraform output -raw public_ip)
        KEY_NAME=$(terraform output -raw ssh_command | grep -o "\-i [^ ]*" | cut -d' ' -f2)
        
        print_info "Connecting to server to view logs..."
        ssh -i $KEY_NAME ubuntu@$PUBLIC_IP "cd rentinn-service && ./logs-rentinn.sh"
        ;;
        
    7)
        print_header "Destroy Deployment"
        
        print_error "⚠️  WARNING: This will permanently delete all resources and data!"
        print_warning "This action cannot be undone"
        
        echo ""
        read -p "Are you absolutely sure? Type 'destroy' to confirm: " confirm
        if [ "$confirm" != "destroy" ]; then
            print_info "Destruction cancelled"
            exit 0
        fi
        
        print_info "Destroying deployment..."
        terraform destroy
        
        print_success "Deployment destroyed"
        
        if [ -f "deployment-info.txt" ]; then
            rm deployment-info.txt
            print_info "Removed deployment-info.txt"
        fi
        ;;
        
    8)
        print_info "Exiting..."
        exit 0
        ;;
        
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac
