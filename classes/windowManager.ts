import {app, BrowserWindow} from "electron";
import {appIcon, browserViewPath} from "./constants.js";
import path from "path";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



/**
 * @see https://github.com/electron/electron/pull/27067#discussion_r555466735
 * @param count
 */
export function setBadge(count: number) {
	if (count < 100) {
		app.setBadgeCount(count);
	} else {
		app.setBadgeCount();
	}
}

export function createWindow(showSection?: string) {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		minHeight: 600,
		minWidth: 600,
		icon: appIcon,
		show: false,
		darkTheme: true,
		webPreferences: {
			nodeIntegration: true,
			preload: path.resolve(__dirname, '../classes/preload.mjs')
		}
	});

	const opts: Electron.LoadFileOptions = {};
	if (showSection) {
		opts.hash = showSection;
	}

	// and load the index.html of the app.
	mainWindow.loadFile(browserViewPath, opts)
		.catch(console.error)
	;

	// Open the DevTools.
	// mainWindow.webContents.openDevTools()

	mainWindow.once('ready-to-show', () => {
		mainWindow?.show();
	});

	mainWindow.on('focus', () => {
		mainWindow.webContents.send('onFocus');
	});

	// Emitted when the window is closed.
	/*mainWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});*/
}

export function getMainWindow(): Electron.BrowserWindow | null {
	for (let browserWindow of BrowserWindow.getAllWindows()) {
		let url : URL|undefined;
		try {
			url = new URL(browserWindow.webContents.getURL());
		} catch (e) {
			console.error(browserWindow.webContents.getURL(), e);
		}
		if (url === undefined || url.protocol !== 'file:') {
			continue;
		}

		const urlPath = (process.platform === 'linux') ? url.pathname : url.pathname.replace(/^\//, '');
		if (path.normalize(urlPath).toLowerCase() === browserViewPath.toLowerCase()) {
			return browserWindow;
		}
	}
	return null;
}

export function showSection(sectionName: string) {
	const mainWindow = getMainWindow();
	if (!mainWindow) {
		createWindow(sectionName);
	} else {
		const allWindows = BrowserWindow.getAllWindows();
		for (let browserWindow of allWindows) {
			browserWindow.webContents.send('showSection', sectionName);
			browserWindow.show();
		}
	}
}

export function showWindow() {
	const mainWindow = getMainWindow();
	if (mainWindow) {
		mainWindow.show();
	} else {
		createWindow();
	}
}

export function toggleWindow() {
	const mainWindow = getMainWindow();
	if (mainWindow) {
		mainWindow.close();
	} else {
		createWindow();
	}
}
