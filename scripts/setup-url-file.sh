#!/bin/bash

# Exit on error
set -e

# 1. Determine the absolute path of the script's directory
# This ensures the .desktop file points to the correct location even if moved
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 2. Define paths
LOCAL_APP_DIR="$HOME/.local/share/applications"
MIME_DB_PARENT="$HOME/.local/share/mime"

DESKTOP_FILE_NAME="Z-Toolbox.desktop"

# 3. Create directories if they don't exist
mkdir -p "$LOCAL_APP_DIR"

# 4. Create the .desktop file
# We use the PROJECT_DIR variable to set the Exec path dynamically
if [ -f "$LOCAL_APP_DIR/$DESKTOP_FILE_NAME" ]; then
	echo "Re-creating desktop entry..."
	rm "$LOCAL_APP_DIR/$DESKTOP_FILE_NAME"
else
	echo "Creating desktop entry..."
fi
tee "$LOCAL_APP_DIR/$DESKTOP_FILE_NAME" > /dev/null << DESKTOP_EOF
[Desktop Entry]
Type=Application
Name=Z-Toolbox
Name[en]=Z-Toolbox
Exec="${PROJECT_DIR}/scripts/start-ztoolbox.sh" %F
Icon=${PROJECT_DIR}/icon.png
Terminal=false
Categories=Utility;
StartupNotify=true
MimeType=application/x-mswinurl;
DESKTOP_EOF
chmod +x "$LOCAL_APP_DIR/$DESKTOP_FILE_NAME"

# 5. Update the MIME database
echo "Updating MIME database..."
update-mime-database "$MIME_DB_PARENT" || echo "Warning: Could not update global MIME DB (might need sudo for system-wide, but user DB updated)."

# 6. Update the desktop database
echo "Updating desktop database..."
update-desktop-database "$LOCAL_APP_DIR"

echo ""
echo "✅ Setup complete!"
echo "   - Registered MIME type: application/x-mswinurl"
echo "   - Registered application: Z-Toolbox"
echo "   - To test, right-click a .url file -> Open With -> Z-Toolbox"
echo ""
echo "Note: If you move this project folder, you must re-run this script (script only tested with XFCE)."
