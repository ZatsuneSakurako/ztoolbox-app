#!/bin/bash

PROJECT_PATH=$(dirname "$(dirname "$(readlink -f "$0")")")

echo "profile ztoolbox-app \"$PROJECT_PATH/node_modules/electron/dist/electron\" flags=(unconfined) {
    userns,
}" | sudo tee /etc/apparmor.d/ztoolbox-app > /dev/null && \
sudo apparmor_parser -r /etc/apparmor.d/ztoolbox-app && \
sudo systemctl reload apparmor && \
echo "Reload apparmor completed !"
