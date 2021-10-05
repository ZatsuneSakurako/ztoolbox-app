import {app, BrowserWindow, nativeImage, MenuItem, Menu, Tray, ipcMain, session} from 'electron';
import * as path from "path";
import fs from "fs-extra";
import crypto from "crypto";
import WebSocket, {RawData} from "ws";
import i18next from "i18next";
import Mustache from "mustache";
import Dict = NodeJS.Dict;

import {ZClipboard} from './classes/ZClipboard';
import {Settings} from './classes/Settings';
import {Streamlink} from './classes/Streamlink';
import Notify from "./classes/notify";
import frTranslation from "./locales/fr.json";
import enTranslation from "./locales/en.json";
import frPreferencesTranslation from "./locales/preferences/fr.json";
import enPreferencesTranslation from "./locales/preferences/en.json";
import {PreferenceTypes} from "./browserViews/js/bridgedWindow";



if (app.requestSingleInstanceLock()) {
	// noinspection JSUnusedLocalSymbols
	app.on('second-instance', (event, commandLine, workingDirectory) => {
		// Quelqu'un a tenté d'exécuter une seconde instance.
		onOpen(commandLine);
	});

	app.on('ready', onReady);
} else {
	app.quit();
	process.exit();
}



const resourcePath = !app.isPackaged? __dirname : process.resourcesPath,

	appIconPath = path.resolve(resourcePath, './images/icon.png'),
	appIconPath_x3 = path.resolve(resourcePath, './images/icon@3x.png'),
	appIcon = nativeImage.createFromPath(appIconPath)
;



app.setName('Z-ToolBox');
if (app.isDefaultProtocolClient('ztoolbox')) {
	app.removeAsDefaultProtocolClient('ztoolbox');
}

if (!app.isDefaultProtocolClient('ztoolbox')) {
	let result;
	if (app.isPackaged) {
		result = app.setAsDefaultProtocolClient('ztoolbox');
	} else {
		/*
		 * Arguments taken from :
		 * https://stackoverflow.com/questions/45570589/electron-protocol-handler-not-working-on-windows#53786254
		 */
		result = app.setAsDefaultProtocolClient('ztoolbox', process.execPath, [`"${path.resolve(process.argv[1])}"`]);
	}

	if (!result) {
		console.error('ZToolbox protocol failed');
	}
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



function createWindow(showSection?: string) {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width: 1000,
		height: 800,
		icon: appIcon,
		show: false,
		webPreferences: {
			nodeIntegration: true,
			preload: path.resolve(__dirname, './classes/preload.js')
		}
	});

	const opts : Electron.LoadFileOptions = {};
	if (showSection) {
		opts.hash = showSection;
	}

	// and load the index.html of the app.
	mainWindow.loadFile(path.resolve(resourcePath, './browserViews/index.html'), opts)
		.catch(console.error)
	;

	// Open the DevTools.
	// mainWindow.webContents.openDevTools()

	mainWindow.once('ready-to-show', () => {
		mainWindow?.show()
	});

	// Emitted when the window is closed.
	/*mainWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});*/
}

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
		ns: [
			'default',
			'preferences',
		],
		resources: {
			en: {
				default: enTranslation,
				preferences: enPreferencesTranslation
			},
			fr: {
				default: frTranslation,
				preferences: frPreferencesTranslation
			}
		}
	})
;

ipcMain.handle('i18n', async (event, key) => {
	const _ = await i18n;
	return _(key, {
		nsSeparator: '.',
		defaultValue: ''
	});
});

ipcMain.handle('getPreference', (e, preferenceId:string, type?:PreferenceTypes) => {
	if (!!type) {
		switch (type) {
			case "string":
				return settings.getString(preferenceId);
			case "number":
				return settings.getNumber(preferenceId);
			case "boolean":
				return settings.getBoolean(preferenceId);
			case "date":
				return settings.getDate(preferenceId);
			default:
				throw new Error('UNHANDLED_TYPE');
		}
	}

	return settings.get(preferenceId);
});

ipcMain.handle('getPreferences', (e, ...preferenceIds:string[]) => {
	const output:Dict<any> = {}
	for (let preferenceId of preferenceIds) {
		output[preferenceId] = settings.get(preferenceId);
	}
	return output;
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
});

function triggerBrowserWindowPreferenceUpdate(preferenceId: string, newValue: any) {
	for (let browserWindow of BrowserWindow.getAllWindows()) {
		browserWindow.webContents.send('updatePreference', preferenceId, newValue);
	}
}

function showSection(sectionName: string) {
	const allWindows = BrowserWindow.getAllWindows();
	if (allWindows.length === 0) {
		createWindow(sectionName);
	} else {
		for (let browserWindow of allWindows) {
			browserWindow.webContents.send('showSection', sectionName);
		}
	}
}



// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	// if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});



const {notify} = Notify(appIconPath_x3),
	urlRegexp = /https?:\/\/*/,
	clipboard = new ZClipboard(5000, false)
;

function getSelectedMenu() : string|null {
	let checked:IZMenuItem|null = null;
	for (const menuItem of contextMenu?.items ?? []) {
		if (menuItem.checked) {
			checked = menuItem
		}
	}

	return checked === null ? null : (checked?.id || checked?.label);
}

async function openStreamlink(useConfirmNotification:boolean=true, url:string|URL|null=null) : Promise<void> {
	const selected = (getSelectedMenu() ?? '').trim(),
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

	if (isAvailable === false || maxQuality === undefined) {
		notify({
			title: 'Information',
			message: 'Vérifiez l\'url (flux en ligne, qualités, ...)'
		})
			.then(() => {
				if (url) {
					require("shell").openExternal(url.toString())
						.catch(console.error)
					;
				}
			})
			.catch(console.error)
		;
		return;
	}

	if (useConfirmNotification) {
		let notificationConfirmed: boolean;
		try {
			await notify({
				title: 'Lien détecté',
				message: 'Cliquer pour ouvrir le lien avec streamlink'
			});

			notificationConfirmed = true;
		} catch (e) {
			notificationConfirmed = false;
		}

		if (!notificationConfirmed) {
			return;
		}
	}



	Streamlink.open(url, targetQuality, maxQuality)
		.catch(console.error)
	;

}

function showWindow() {
	const [firstWindow] = BrowserWindow.getAllWindows();
	if (firstWindow) {
		firstWindow.show();
	} else {
		createWindow();
	}
}

function toggleWindow() {
	const [firstWindow] = BrowserWindow.getAllWindows();
	if (firstWindow) {
		firstWindow.close();
	} else {
		createWindow();
	}
}



let tray:Tray|null = null,
	contextMenu:Menu|null = null
;
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
			checked: settings.getBoolean('clipboardWatch'),
			click() {
				settings.set('clipboardWatch', !settings.get('clipboardWatch'));
				triggerBrowserWindowPreferenceUpdate('clipboardWatch', settings.get('clipboardWatch'));
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
			const newSelectedQuality = getSelectedMenu();
			if (settings.get('quality') !== newSelectedQuality) {
				settings.set("quality", newSelectedQuality);
				triggerBrowserWindowPreferenceUpdate('quality', newSelectedQuality);
			}
		})
	});



	tray = new Tray(appIcon);
	tray.setToolTip(app.getName());
	tray.setContextMenu(contextMenu);



	tray.addListener('click', () => {
		toggleWindow();
	});
	// tray.addListener('double-click', toggleWindow);

	clipboard.toggle(settings.getBoolean('clipboardWatch') ?? false);
	clipboard.on('text', (clipboardText:string) => {
		if (urlRegexp.test(clipboardText)) {
			openStreamlink(true)
				.catch(console.error)
			;
		}
	});





	const refreshQualityChecked = () => {
		for (const menuItem of contextMenu?.items ?? []) {
			const value = menuItem.id || menuItem.label;
			if (menuItem.type === "radio" && settings.get("quality") === value) {
				menuItem.checked = true;
			}
		}
	};
	settings.on('change', function (key:any) {
		switch (key) {
			case 'quality':
				refreshQualityChecked();
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
	refreshQualityChecked();





	// Check if currently opened for a ztoolbox://*
	onOpen(process.argv);
}



function onOpen(commandLine:string[]) {
	const requests = commandLine.filter(value => {
		return value.indexOf('ztoolbox://') !== -1
	});
	let unsupported:boolean = false;

	for (const value of requests) {
		let url:URL;
		try {
			url = new URL(value)
		} catch (e) {
			console.error(e);
			continue;
		}

		switch (url.host) {
			case 'live':
				// ztoolbox://live/...
				const inputUrl = url.pathname.replace(/^\//, ''),
					[siteType, liveId] = inputUrl.split('/')
				;

				let liveUrl: string;
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
				break;
			case 'settings':
				showSection('settings');
				break;
			case 'start':
				console.info('start link');
				break;
			default:
				unsupported = true;
				break;
		}
	}


	if (unsupported) {
		notify({
			title: 'Erreur',
			message: 'Lien non supporté'
		})
			.catch(console.error)
		;
	}
}



export {};
