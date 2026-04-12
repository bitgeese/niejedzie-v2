#!/usr/bin/env bash
# One-shot Hetzner VPS provisioning for niejedzie.pl v2.
# Idempotent — safe to re-run.
#
# Prerequisites (run these ONCE before executing this script):
#   1. Create Hetzner Cloud project: https://console.hetzner.cloud/
#   2. Create API token: project → Security → API Tokens → Generate (Read & Write)
#   3. hcloud context create niejedzie  (paste the token)
#   4. hcloud ssh-key create --name maciej-laptop --public-key-file ~/.ssh/id_ed25519.pub

set -euo pipefail

NAME="niejedzie"
TYPE="cx22"                # 2 vCPU, 4GB RAM, 40GB SSD — €4.51/mo
IMAGE="ubuntu-24.04"
LOCATION="fsn1"            # Falkenstein, closest to Poland
SSH_KEY="maciej-laptop"

# Create server if it doesn't already exist
if ! hcloud server describe "$NAME" >/dev/null 2>&1; then
  echo "Creating server $NAME ..."
  hcloud server create \
    --name "$NAME" \
    --type "$TYPE" \
    --image "$IMAGE" \
    --location "$LOCATION" \
    --ssh-key "$SSH_KEY"
else
  echo "Server $NAME already exists, skipping create."
fi

IP=$(hcloud server ip "$NAME")
echo ""
echo "Server ready at: $IP"

# Create firewall if it doesn't already exist
if ! hcloud firewall describe "$NAME" >/dev/null 2>&1; then
  echo "Creating firewall $NAME ..."
  RULES_TMP=$(mktemp)
  cat >"$RULES_TMP" <<'RULES'
[
  {"direction":"in","protocol":"tcp","port":"22","source_ips":["0.0.0.0/0","::/0"]},
  {"direction":"in","protocol":"tcp","port":"80","source_ips":["0.0.0.0/0","::/0"]},
  {"direction":"in","protocol":"tcp","port":"443","source_ips":["0.0.0.0/0","::/0"]}
]
RULES
  hcloud firewall create --name "$NAME" --rules-file "$RULES_TMP"
  rm -f "$RULES_TMP"
  hcloud firewall apply-to-resource "$NAME" --type server --server "$NAME"
else
  echo "Firewall $NAME already exists, skipping create."
fi

echo ""
echo "Done. Next steps:"
echo "  1. ssh root@$IP 'uname -a'   # verify SSH works"
echo "  2. Point niejedzie.pl A record to $IP in Cloudflare DNS (proxy ON)"
echo "  3. Run: ssh root@$IP 'bash -s' < infra/bootstrap.sh"
