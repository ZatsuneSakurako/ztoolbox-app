#!/bin/bash
PROJECT_PATH=$(dirname "$(dirname "$(readlink -f "$0")")")
PARSE_INI="${PROJECT_PATH}/scripts/parseIni.py"
RESOLVED_FILE=$(readlink -f "$1")

resolveFileUrl="$(python "$PARSE_INI" "$RESOLVED_FILE")"
if [ $? -gt 0 ]; then
	zenity --error --text="Une erreur s'est produite lors de la lecture du fichier\n$RESOLVED_FILE"
	exit 1
fi

xdg-open "$resolveFileUrl"
