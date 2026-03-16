#!/bin/sh
# -------------------------------------------------
# Fix Chrome sandbox permissions after .deb install
# -------------------------------------------------

APP_DIR="/opt/Tulip"
SANDBOX="$APP_DIR/chrome-sandbox"

# Abort early if the sandbox binary is missing (should never happen)
[ -f "$SANDBOX" ] || {
    echo "WARNING: $SANDBOX not found – skipping sandbox fix."
    exit 0
}

echo "Fixing sandbox permissions for $SANDBOX"

# 1. Owner → root:root
chown root:root "$SANDBOX"

# 2. Mode → 4755  (setuid + rwx for owner, rx for group/others)
chmod 4755 "$SANDBOX"

echo "Sandbox fixed: $(ls -l "$SANDBOX")"

exit 0