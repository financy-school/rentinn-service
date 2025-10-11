#!/bin/bash
# Setup MySQL on EC2 instance for RentInn Service

set -e

echo "🔧 Installing MySQL Server..."
sudo apt update
sudo apt install mysql-server -y

echo "🔐 Securing MySQL installation..."
# Set root password and secure installation
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'RentInn@2024Secure';"
sudo mysql -e "DELETE FROM mysql.user WHERE User='';"
sudo mysql -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
sudo mysql -e "DROP DATABASE IF EXISTS test;"
sudo mysql -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
sudo mysql -e "FLUSH PRIVILEGES;"

echo "📊 Creating database and user..."
sudo mysql -u root -p'RentInn@2024Secure' <<EOF
CREATE DATABASE IF NOT EXISTS rentinn_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'rentinn_user'@'localhost' IDENTIFIED BY 'RentInn@User2024';
GRANT ALL PRIVILEGES ON rentinn_db.* TO 'rentinn_user'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "✅ MySQL setup complete!"
echo ""
echo "Database Details:"
echo "  Database: rentinn_db"
echo "  User: rentinn_user"
echo "  Password: RentInn@User2024"
echo "  Host: localhost"
echo ""

# Test connection
echo "🧪 Testing database connection..."
mysql -u rentinn_user -p'RentInn@User2024' -e "USE rentinn_db; SELECT 'Connection successful!' as status;"

echo "🎉 MySQL is ready for use!"
