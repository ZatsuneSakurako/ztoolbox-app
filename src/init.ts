import {app} from "electron";
import {Settings} from "../classes/Settings.js";

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

export const settings = new Settings();
