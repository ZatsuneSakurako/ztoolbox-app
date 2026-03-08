import {app, BrowserWindow, nativeImage} from "electron";
import {appIcon, appIconPath, browserViewPath} from "./constants.js";
import path from "node:path";
import {addBadgeToImage} from "../src/addBadgeToImage.js";
import {getTray} from "../src/tray.js";
import {getWebsitesCount} from "../src/websitesData/refreshWebsitesData.js";

const __dirname = import.meta.dirname;



let currentBadgeCount:number|undefined = undefined;
/**
 * @see https://github.com/electron/electron/pull/27067#discussion_r555466735
 * @param [count] If undefined, it will refresh the current badge count
 */
export async function setBadge(count?: number) {
	console.debug('[setBadge] Call with :', count ?? 'undefined');

	if (count !== undefined) {
		currentBadgeCount = count;
	} else {
		try {
			// If no count, take the existing badge count, or read websites data directly
			count ??= currentBadgeCount ?? await getWebsitesCount();
		} catch (e) {
			console.error(e);
		}
	}

	if (process.platform === 'linux') {
		const tray = getTray(),
			mainWindow = getMainWindow();

		if (count === undefined || count === 0) {
			mainWindow?.setIcon(appIconPath);
			tray?.setImage(appIcon);
			return;
		}

		try {
			const buffer = await addBadgeToImage(appIconPath, count),
				badgeIcon = nativeImage.createFromBuffer(buffer);

			mainWindow?.setIcon(badgeIcon);
			tray?.setImage(mainWindow ? appIcon : badgeIcon);

		} catch (e) {
			console.error(e);
		}
		return;
	}

	if (count !== undefined && count < 100) {
		app.setBadgeCount(count);
	} else {
		app.setBadgeCount();
	}
}

if (process.platform === 'linux') {
	app.whenReady().then(() => {
		setBadge()
			.catch(console.error);
	});
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

	mainWindow.on('show', () => {
		/**
		 * Refresh the badge (so the badge goes to the browser window icon)
		 */
		setBadge()
			.catch(console.error);
	});

	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		/**
		 * When the window is closed, refresh the badge to it can go to the tray
		 */
		setBadge()
			.catch(console.error);
	});
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
