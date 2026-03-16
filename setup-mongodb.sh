#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
#  MongoDB 7.0 setup script for Ubuntu/Debian
#  Run with:  sudo bash setup-mongodb.sh
# ─────────────────────────────────────────────────────────
set -e

echo ">>> Installing MongoDB 7.0..."

# Import MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc \
  | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add apt repository (Ubuntu Noble 24.04)
UBUNTU_CODENAME=$(lsb_release -cs)
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
https://repo.mongodb.org/apt/ubuntu ${UBUNTU_CODENAME}/mongodb-org/7.0 multiverse" \
  | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

apt-get update -qq
apt-get install -y mongodb-org

echo ">>> Starting MongoDB service..."
systemctl daemon-reload
systemctl start mongod
systemctl enable mongod

echo ""
echo "✓ MongoDB installed and running."
echo "  Connection: mongodb://localhost:27017"
echo ""
mongod --version
