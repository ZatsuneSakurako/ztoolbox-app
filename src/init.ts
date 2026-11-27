import {app, BrowserWindow} from "electron";
import {websitesData} from "../classes/Settings.js";
import {onSettingUpdate} from "../classes/chromeNative.js";
import {onOpen, updateAutoStart} from "./manageProtocolAndAutostart.js";
import {settings} from "../classes/Settings.js";

if (app.requestSingleInstanceLock()) {
	app.whenReady().then(() => {
		console.log('This code may execute before the above import')
		import('../main.js')
			.catch(console.error)
		;
	});
} else {
	app.quit();
	process.exit();
}

function onReady() {
	// Check if currently opened for a ztoolbox://*
	onOpen(process.argv);


	updateAutoStart()
		.catch(console.error)
	;


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
}
app.whenReady()
	.then(onReady)
	.catch(console.error);
