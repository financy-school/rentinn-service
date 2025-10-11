#!/bin/bash
# Add swap space to help with memory-intensive builds
# Run this on the EC2 instance before building Docker images

set -e

echo "🔧 Adding 2GB swap space..."

# Check if swap already exists
if swapon --show | grep -q '/swapfile'; then
    echo "✅ Swap already exists"
    swapon --show
    exit 0
fi

# Create swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify swap
echo "✅ Swap space added successfully:"
free -h
swapon --show

echo "🎉 Done! You can now build Docker images with more memory available."
