import {app, BrowserWindow, nativeImage, MenuItem, Menu, Tray, ipcMain, session} from 'electron';
import * as path from "path";
import fs from "fs-extra";
import crypto from "crypto";
import WebSocket, {RawData} from "ws";
import i18next from "i18next";
import Mustache from "mustache";

import {ZClipboard} from './classes/ZClipboard';
import {Settings} from './classes/Settings';
import {Streamlink} from './classes/Streamlink';
import _notify from "./classes/notify";
import frTranslation from "./locales/fr.json";
import enTranslation from "./locales/en.json";



if (app.requestSingleInstanceLock() === true) {
	// noinspection JSUnusedLocalSymbols
	app.on('second-instance', (event, commandLine, workingDirectory) => {
		// Quelqu'un a tenté d'exécuter une seconde instance.
		onOpen(commandLine);
	});

	app.on('ready', onReady);
} else {
	app.quit();
}



const resourcePath = (app.isPackaged === false)? __dirname : process.resourcesPath,

	appIconPath = path.resolve(resourcePath, './images/icon.png'),
	appIconPath_x3 = path.resolve(resourcePath, './images/icon@3x.png'),
	appIcon = nativeImage.createFromPath(appIconPath)
;



app.setName('Z-ToolBox');
if (app.isDefaultProtocolClient('ztoolbox') === true && app.isPackaged === false) {
	app.removeAsDefaultProtocolClient('ztoolbox');
}
if (app.isDefaultProtocolClient('ztoolbox') === false && app.isPackaged === true) {
	/*
	 * Unpackaged version does not work anyway
	 * as the executable is electron.exe
	 */
	app.setAsDefaultProtocolClient('ztoolbox');
}





const wss = new WebSocket.Server({
	port: 42080
});

function onSocketMessage(rawData:RawData, socket:WebSocket) {
	let msg:string|object = rawData.toString();
	try {
		msg = JSON.parse(msg);
	} catch (_) {}
	console.dir(msg);
	socket.send(JSON.stringify({
		lorem: 'ipsum'
	}));
}

wss.on('connection', function(socket) {
	// When you receive a message, send that message to every socket.
	socket.on('message', function(msg) {
		onSocketMessage(msg, socket);
	});
});





let mainWindow:BrowserWindow = null/*, shortcutsWindow = null*/;
function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 1000,
		height: 800,
		icon: appIcon,
		show: false,
		webPreferences: {
			nodeIntegration: true,
			preload: path.resolve(__dirname, './classes/preload.js')
		}
	});

	// and load the index.html of the app.
	mainWindow.loadFile(path.resolve(resourcePath, './browserViews/index.html'))
		.catch(console.error)
	;

	// Open the DevTools.
	// mainWindow.webContents.openDevTools()

	mainWindow.once('ready-to-show', () => {
		mainWindow.show()
	});

	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null
	})
}
/*function createShortcutWindow() {
	// Create the browser window.
	shortcutsWindow = new BrowserWindow({
		width: 600,
		height: 400,
		icon: appIcon,
		show: false,
		webPreferences: {
			nodeIntegration: true
		}
	});

	shortcutsWindow.loadFile(path.resolve(resourcePath, './browserViews/shortcuts.html'))
		.catch(console.error)
	;



	shortcutsWindow.once('ready-to-show', () => {
		shortcutsWindow.show()
	});

	shortcutsWindow.on('blur', function () {
		shortcutsWindow.close();
	});

	shortcutsWindow.on('closed', function () {
		shortcutsWindow = null
	})
}*/

const nonce = crypto.randomBytes(16).toString('base64');
app.on('ready', function () {
	session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		callback({
			responseHeaders: {
				...details.responseHeaders,
				'Content-Security-Policy': [
					// 'default-src \'none\'; script-src \'self\'; object-src \'none\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\'; media-src \'self\'; frame-src \'self\'; font-src \'self\'; connect-src \'none\'"',
					`default-src 'none'; script-src 'self' https://unpkg.com/ 'nonce-${nonce}'; object-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self'; media-src 'self'; frame-src 'self'; font-src 'self'; connect-src 'none'`
				]
			}
		})
	});
});

// noinspection JSUnusedLocalSymbols
ipcMain.handle('nonce-ipc', async (event, ...args) => {
	return nonce;
});

ipcMain.handle('openStreamlink', async () => {
	return openStreamlink(false)
		.catch(console.error)
	;
});

const i18n = i18next
	.init({
		lng: app.getLocaleCountryCode(),
		fallbackLng: 'fr',
		defaultNS: 'default',
		resources: {
			en: {
				default: enTranslation
			},
			fr: {
				default: frTranslation
			}
		}
	})
;

ipcMain.handle('i18n', async (event, key) => {
	const _ = await i18n;
	return _(key);
});

ipcMain.handle('getPreference', (e, preferenceId:string) => {
	return settings.get(preferenceId);
});

ipcMain.handle('savePreference', (e, preferenceId:string, newValue:any) => {
	settings.set(preferenceId, newValue);
	return true;
});

const mstCache:Map<string, string> = new Map();
ipcMain.handle('mustacheRender', async (e, templateName:string, context:any) => {
	let template = mstCache.get(templateName);
	if (template === undefined) {
		template = fs.readFileSync(`${__dirname}/templates/${templateName}.mst`, {
			encoding: 'utf8'
		});
		mstCache.set(templateName, template);
	}
	return Mustache.render(template, context);
})



// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	// if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) createWindow()
});



const {notify} = _notify(appIconPath_x3),
	urlRegexp = /https?:\/\/*/,
	clipboard = new ZClipboard(5000, false)
;

function getSelectedMenu() : string {
	let checked: IZMenuItem = null;

	contextMenu.items.forEach((menuItem: IZMenuItem) => {
		if (menuItem.checked === true) {
			checked = menuItem
		}
	});

	return checked === null ? null : (checked!.id || checked!.label);
}

async function openStreamlink(useConfirmNotification:boolean=true, url:string|URL=null) : Promise<void> {
	const selected = getSelectedMenu().trim(),
		clipboardText = clipboard.text
	;

	let targetQuality = selected;

	if (url === null && urlRegexp.test(clipboardText)) {
		try {
			url = new URL(clipboard.text);
		} catch (e) {
			console.error(e)
		}
	}

	if (url == null) {
		notify({
			title: 'Erreur',
			message: 'Pas d\'url dans le presse-papier'
		})
			.catch(console.error)
		;
		return;
	}



	let maxQuality;
	if (/\d+p/.test(targetQuality)) {
		maxQuality = selected;
		targetQuality = 'best';
	}

	const isAvailable = await Streamlink.isAvailable(url, targetQuality, maxQuality)
		.catch(console.error)
	;

	if (isAvailable === false) {
		notify({
			title: 'Information',
			message: 'Vérifiez l\'url (flux en ligne, qualités, ...)'
		})
			.then(() => {
				require("shell").openExternal(url.toString())
					.catch(console.error)
				;
			})
			.catch(console.error)
		;
		return;
	}

	if (useConfirmNotification !== false) {
		let notificationConfirmed = false;
		try {
			await notify({
				title: 'Lien détecté',
				message: 'Cliquer pour ouvrir le lien avec streamlink'
			});

			notificationConfirmed = true;
		} catch (e) {
			notificationConfirmed = false;
		}

		if (notificationConfirmed !== true) {
			return;
		}
	}



	Streamlink.open(url, targetQuality, maxQuality)
		.catch(console.error)
	;

}

function toggleWindow() {
	if (mainWindow == null) {
		createWindow();
	}
}



let tray = null;
let contextMenu:Menu = null;
// This method will be called when Electron has finished initialization.
// Some APIs can only be used after this event occurs.
interface IZMenuItem extends MenuItem {
	id: string;
	type: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
}
const settings = new Settings(path.resolve(app.getPath('userData'), './settings.json'));
function onReady() {
	contextMenu = Menu.buildFromTemplate([
		{
			label: 'Ouvrir la fenêtre',
			type: 'normal',
			click() {
				toggleWindow()
			}
		},

		{
			label: 'Ouvrir streamlink', type: 'normal', click() {
				openStreamlink(false)
					.catch(console.error)
				;
			}
		},

		{type: 'separator'},

		{
			id: 'clipboardWatch',
			label: 'Observer presse-papier',
			type: 'checkbox',
			checked: settings.get('clipboardWatch'),
			click() {
				settings.set('clipboardWatch', !settings.get('clipboardWatch'));
			}
		},

		{type: 'separator'},

		{id: 'worst', label: 'Pire', type: 'radio'},
		{id: '360p', label: '360p', type: 'radio'},
		{id: '480p', label: '480p', type: 'radio'},
		{id: '720p', label: '720p', type: 'radio'},
		{id: '1080p', label: '1080p', type: 'radio'},
		{id: 'best', label: 'Meilleure', type: 'radio'},

		{type: 'separator'},

		{label: 'Exit', type: 'normal', role: 'quit'}
	]);

	contextMenu.addListener("menu-will-close", function () {
		setTimeout(() => {
			settings.set("quality", getSelectedMenu())
		})
	});



	tray = new Tray(appIcon);
	tray.setToolTip(app.getName());
	tray.setContextMenu(contextMenu);



	tray.addListener('click', () => {
		if (clipboard.isEnabled === true) {
			toggleWindow()
		} else {
			openStreamlink(false)
				.catch(console.error)
			;
		}
	});
	tray.addListener('double-click', toggleWindow);

	clipboard.toggle(settings.get('clipboardWatch'));
	clipboard.on('text', (clipboardText:string) => {
		if (urlRegexp.test(clipboardText)) {
			openStreamlink(true)
				.catch(console.error)
			;
		}
	});





	const refreshQualityChecked = () => {
		contextMenu.items.forEach((menuItem: IZMenuItem) => {
			const value = menuItem.id || menuItem.label;
			if (menuItem.type === "radio" && settings.get("quality") === value) {
				menuItem.checked = true;
			}
		});
	};
	settings.on('change', function (key:any) {
		switch (key) {
			case 'quality':
				refreshQualityChecked();
				break;
			case 'clipboardWatch':
				contextMenu.getMenuItemById('clipboardWatch').checked = settings.get('clipboardWatch');
				clipboard.toggle(settings.get('clipboardWatch'));
				break;
		}
	});
	refreshQualityChecked();





	// Check if currently opened for a ztoolbox://*
	onOpen(process.argv);
}



function onOpen(commandLine:string[]) {
	const requests = commandLine.filter(value => {
		return value.indexOf('ztoolbox://') !== -1
	});
	let unsupported:boolean = false;

	requests.forEach(value => {
		/**
		 *
		 * @type {?URL}
		 */
		let url = null;
		try {
			url = new URL(value)
		} catch (e) {
			console.error(e);
		}

		if (url === null) {
			return;
		}

		if (url.host === 'live') {
			const inputUrl = url.pathname.replace(/^\//, ''),
				[siteType, liveId] = inputUrl.split('/')
			;

			let liveUrl:string = null;
			switch (siteType) {
				case 'youtube':
					liveUrl = `https://www.youtube.com/watch?v=${liveId}`;
					break;
				case 'twitch':
					liveUrl = `https://twitch.tv/${liveId}`;
					break;
				default:
					liveUrl = `https://${inputUrl}`;
			}

			openStreamlink(false, liveUrl)
				.catch(console.error)
			;
		} else {
			unsupported = true;
		}
	});



	// @ts-ignore
	if (unsupported === true) {
		notify({
			title: 'Erreur',
			message: 'Lien non supporté'
		})
			.catch(console.error)
		;
	}
}



export {};
