#!/bin/bash
# Setup MySQL Database for RentInn - Works with existing MySQL installation

set -e

echo "🔧 Setting up MySQL for RentInn Service..."
echo ""

# Check if MySQL is already running
if sudo systemctl is-active --quiet mysql; then
    echo "✅ MySQL is already running"
else
    echo "🔄 Starting MySQL..."
    sudo systemctl start mysql
    sudo systemctl enable mysql
fi

echo ""
echo "📊 Creating database and user with sudo access..."

# Use sudo to access MySQL (works on Ubuntu where root uses auth_socket)
sudo mysql <<'EOSQL'
-- Create database
CREATE DATABASE IF NOT EXISTS rentinn_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user if not exists (MySQL 8.0 compatible)
CREATE USER IF NOT EXISTS 'rentinn_user'@'localhost' IDENTIFIED BY 'RentInn@User2024';

-- Grant all privileges
GRANT ALL PRIVILEGES ON rentinn_db.* TO 'rentinn_user'@'localhost';
FLUSH PRIVILEGES;

-- Show created database
SHOW DATABASES LIKE 'rentinn_db';

-- Show user
SELECT user, host FROM mysql.user WHERE user = 'rentinn_user';
EOSQL

echo ""
echo "✅ MySQL setup complete!"
echo ""
echo "📋 Database Details:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Database: rentinn_db"
echo "  User:     rentinn_user"
echo "  Password: RentInn@User2024"
echo "  Host:     localhost"
echo "  Port:     3306"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test connection
echo "🧪 Testing database connection..."
if mysql -u rentinn_user -p'RentInn@User2024' -e "USE rentinn_db; SELECT 'Connection successful!' as status;" 2>/dev/null; then
    echo "✅ Database connection test passed!"
else
    echo "⚠️  Warning: Connection test failed, but database should be accessible"
fi

echo ""
echo "🎉 MySQL is ready for RentInn service!"
