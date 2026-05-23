#!/bin/bash

# Exit on error
set -e

# 1. Determine the absolute path of the script's directory
# This ensures the .desktop file points to the correct location even if moved
PROJECT_PATH=$(dirname "$(dirname "$(readlink -f "$0")")")

# 2. Define paths
LOCAL_APP_DIR="$HOME/.local/share/applications"
MIME_DB_PARENT="$HOME/.local/share/mime"

DESKTOP_FILE_NAME="Z-Toolbox.desktop"

# 3. Create directories if they don't exist
mkdir -p "$LOCAL_APP_DIR"

# 4. Create the .desktop file
# We use the PROJECT_PATH variable to set the Exec path dynamically
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
Exec="${PROJECT_PATH}/scripts/start-ztoolbox.sh" %F
Icon=${PROJECT_PATH}/icon.png
Terminal=false
Categories=Development;Utility;
StartupNotify=true
MimeType=application/x-mswinurl;
DESKTOP_EOF
chmod +x "$LOCAL_APP_DIR/$DESKTOP_FILE_NAME"
xdg-mime install "$LOCAL_APP_DIR/$DESKTOP_FILE_NAME"

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
