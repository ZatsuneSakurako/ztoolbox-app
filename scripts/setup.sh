#!/bin/bash

# Exit on error
set -e

PROJECT_PATH=$(dirname "$(dirname "$(readlink -f "$0")")")

echo "profile ztoolbox-app \"$PROJECT_PATH/node_modules/electron/dist/electron\" flags=(unconfined) {
    userns,
}" | sudo tee /etc/apparmor.d/ztoolbox-app > /dev/null && \
sudo apparmor_parser -r /etc/apparmor.d/ztoolbox-app && \
sudo systemctl reload apparmor && \
echo -e "Reload apparmor completed !\n"

"$PROJECT_PATH/scripts/setup-url-file.sh"

mkUrlLinkPath="$HOME/.local/bin/mk-url.sh"
mkdir -p "$HOME/.local/bin"
if [ -L "$mkUrlLinkPath" ]; then
	echo -e "\nRe-creating symbolic link to mk-url.sh..."
	unlink "$mkUrlLinkPath"
else
	echo -e "\nCreating symbolic link to mk-url.sh..."
fi
ln -s "$PROJECT_PATH/scripts/mk-url.sh" "$mkUrlLinkPath" && \
echo -e "Symbolic link created at $mkUrlLinkPath"
