#!/usr/bin/env bash
# Run once on the VPS:
#   ssh root@<ip> 'bash -s' < infra/bootstrap.sh
set -euo pipefail

apt-get update -y
apt-get install -y curl git sqlite3 nginx ufw build-essential

# Node.js 22 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
node --version && npm --version

# PM2 process manager
npm install -g pm2
pm2 --version

# App user (non-root for the app)
if ! id niejedzie >/dev/null 2>&1; then
  useradd -m -s /bin/bash niejedzie
  mkdir -p /opt/niejedzie
  chown -R niejedzie:niejedzie /opt/niejedzie
fi

mkdir -p /var/log/niejedzie
chown niejedzie:niejedzie /var/log/niejedzie

# UFW firewall (defense-in-depth with Hetzner firewall)
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "Bootstrap complete."
