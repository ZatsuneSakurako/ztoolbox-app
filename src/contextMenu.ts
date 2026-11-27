import {app, Menu} from "electron";
import {showWindow, toggleWindow} from "../classes/windowManager.js";
import {appIcon} from "../classes/constants.js";
import {newTray} from "./tray.js";

let contextMenu:Menu|null = null;
function onReady() {
	contextMenu = Menu.buildFromTemplate([
		{
			label: 'Ouvrir la fenêtre',
			type: 'normal',
			click() {
				showWindow();
			}
		},

		{type: 'separator'},

		{label: 'Exit', type: 'normal', role: 'quit'}
	]);

	const tray = newTray(appIcon);
	tray.setToolTip(app.getName());
	tray.setContextMenu(contextMenu);

	tray.addListener('click', () => {
		toggleWindow();
	});
	// tray.addListener('double-click', toggleWindow);
}
if (app.requestSingleInstanceLock()) {
	app.whenReady()
		.then(onReady)
		.catch(console.error)
	;
}
