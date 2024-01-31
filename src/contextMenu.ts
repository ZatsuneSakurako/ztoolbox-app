import {app, BrowserWindow, Menu, Tray} from "electron";
import {showSection, showWindow, toggleWindow} from "../classes/windowManager.js";
import {appIcon} from "../classes/constants.js";
import {clipboard} from "./clipboard.js";
import {onSettingUpdate} from "../classes/chromeNative.js";
import {onOpen, updateAutoStart} from "./manageProtocolAndAutostart.js";
import {settings} from "../main.js";
import {websitesData} from "../classes/Settings.js";



function triggerBrowserWindowPreferenceUpdate(preferenceId: string, newValue: any) {
	for (let browserWindow of BrowserWindow.getAllWindows()) {
		browserWindow.webContents.send('updatePreference', preferenceId, newValue);
	}
}



let tray:Tray|null = null,
	contextMenu:Menu|null = null
;
function onReady() {
	contextMenu = Menu.buildFromTemplate([
		{
			label: 'Ouvrir la fenêtre',
			type: 'normal',
			click() {
				showWindow();
			}
		},
		{
			label: 'Afficher les options',
			type: 'normal',
			click() {
				showSection('settings');
			}
		},

		{type: 'separator'},

		{
			id: 'clipboardWatch',
			label: 'Observer presse-papier',
			type: 'checkbox',
			checked: settings.getBoolean('clipboardWatch'),
			click() {
				settings.set('clipboardWatch', !settings.get('clipboardWatch'));
				triggerBrowserWindowPreferenceUpdate('clipboardWatch', settings.get('clipboardWatch'));
			}
		},

		{type: 'separator'},

		{label: 'Exit', type: 'normal', role: 'quit'}
	]);

	/*contextMenu.addListener("menu-will-close", function () {
		//
	});*/



	tray = new Tray(appIcon);
	tray.setToolTip(app.getName());
	tray.setContextMenu(contextMenu);



	tray.addListener('click', () => {
		toggleWindow();
	});
	// tray.addListener('double-click', toggleWindow);

	clipboard.toggle(settings.getBoolean('clipboardWatch') ?? false);

	if (settings.has('quality')) {
		settings.delete('quality');
	}

	settings.on('change', function (key:any, oldValue: any, newValue: any) {
		// Exclude some preference to prevent event loops
		if (![websitesData].includes(key)) {
			onSettingUpdate(key, oldValue, newValue)
				.catch(console.error)
			;
		}

		switch (key) {
			case 'autostart':
				updateAutoStart()
					.catch(console.error)
				;
				break;
			case 'clipboardWatch':
				let menu = contextMenu?.getMenuItemById('clipboardWatch') ?? null;
				if (menu) {
					menu.checked = settings.getBoolean('clipboardWatch') ?? false;
				}
				clipboard.toggle(settings.getBoolean('clipboardWatch') ?? false);
				break;
			case 'theme':
			case 'background_color':
				const allWindows = BrowserWindow.getAllWindows();
				for (let browserWindow of allWindows) {
					browserWindow.webContents.send(
						'themeUpdate',
						settings.get('theme'),
						settings.get('background_color')
					);
				}
				break;
		}
	});



	// Check if currently opened for a ztoolbox://*
	onOpen(process.argv);



	updateAutoStart()
		.catch(console.error)
	;
}
if (app.requestSingleInstanceLock()) {
	app.whenReady()
		.then(onReady)
		.catch(console.error)
	;
}
