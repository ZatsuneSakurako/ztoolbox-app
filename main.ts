import {app, BrowserWindow, ipcMain, Menu, MenuItem, session, Tray, dialog} from 'electron';
import electron from 'electron';
import * as path from "path";
import fs from "fs-extra";
import crypto from "crypto";
import i18next from "i18next";
import Mustache from "mustache";
import AutoLaunch from "auto-launch";
import ProtocolRegistry from "protocol-registry";
import shell, {which} from 'shelljs';
import Dict = NodeJS.Dict;

import {ZClipboard} from './classes/ZClipboard';
import {Settings} from './classes/Settings';
import {Streamlink} from './classes/Streamlink';
import {notifyElectron} from "./classes/notify";
import frTranslation from "./locales/fr.json";
import enTranslation from "./locales/en.json";
import frPreferencesTranslation from "./locales/preferences/fr.json";
import enPreferencesTranslation from "./locales/preferences/en.json";
import {PreferenceTypes} from "./browserViews/js/bridgedWindow";
import {versionState} from "./classes/versionState";
import {ZAlarm} from "./classes/ZAlarm";
import {appIcon, autoStartArgument, zToolbox_protocol} from "./classes/constants";
import {getWsClientNames, server, io} from "./classes/chromeNative";
import {createWindow, getMainWindow, showSection, showWindow, toggleWindow} from "./classes/windowManager";
import {execSync} from "child_process";
import {IPathConfigFilter, SettingConfig} from "./classes/bo/settings";



if (app.requestSingleInstanceLock()) {
	// noinspection JSUnusedLocalSymbols
	app.on('second-instance', (event, commandLine, workingDirectory) => {
		// Quelqu'un a tenté d'exécuter une seconde instance.
		onOpen(commandLine);
	});

	app.whenReady()
		.then(onReady)
		.catch(console.error)
	;
} else {
	app.quit();
	process.exit();
}



app.setName('Z-ToolBox');
if (app.isDefaultProtocolClient(zToolbox_protocol)) {
	app.removeAsDefaultProtocolClient(zToolbox_protocol);
}

/*
 * Arguments taken from :
 * https://stackoverflow.com/questions/45570589/electron-protocol-handler-not-working-on-windows#53786254
 */
if (!process.platform.startsWith('win')) {
	/**
	 * electron workaround (ProtocolRegistry use shelljs internally)
	 * @see https://github.com/shelljs/shelljs/wiki/Electron-compatibility
	 */
	const nodePath = shell.config.execPath = shell.which('node')?.toString() ?? null,
		nodeVersion = !!nodePath ? shell.exec(JSON.stringify(nodePath) + ' --version').toString().trim() : ''
	;
	if (/^v1[46]\.$/.test(nodeVersion)) {
		ProtocolRegistry.register({
			protocol: zToolbox_protocol,
			command: app.isPackaged ?
				`${JSON.stringify(process.execPath)} $_URL_`
				:
				`"${process.execPath}" "${__dirname}" $_URL_`,
			override: true,
			terminal: false,
			script: false,
		})
			.then(async () => {
				console.log("Successfully registered protocol");
			})
			.catch(e => {
				console.error(e);
				console.error('ZToolbox protocol failed : Could not get node');
			})
		;
	} else {
		console.error('ZToolbox protocol failed : Could not get node');
	}
} else {
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

	/**
	 * https://www.electronjs.org/fr/docs/latest/tutorial/notifications#windows
	 */
	app.setAppUserModelId(process.execPath);
}

server.listen({
	hostname: 'localhost',
	port: 42080,
}, () => {
	console.log('Listening at localhost:42080');
});
io.listen(server);


const nonce = crypto.randomBytes(16).toString('base64');
app.whenReady()
	.then(function () {
		session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
			callback({
				responseHeaders: {
					...details.responseHeaders,
					'Content-Security-Policy': [
						// 'default-src \'none\'; script-src \'self\'; object-src \'none\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\'; media-src \'self\'; frame-src \'self\'; font-src \'self\'; connect-src \'none\'"',
						`default-src 'none'; script-src 'self' https://unpkg.com/ 'nonce-${nonce}'; object-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self'; media-src 'self'; frame-src 'self'; font-src 'self'; connect-src https://api.duckduckgo.com`
					]
				}
			})
		});
	})
	.catch(console.error)
;

// noinspection JSUnusedLocalSymbols
ipcMain.handle('nonce-ipc', async (event, ...args) => {
	return nonce;
});

ipcMain.handle('openExternal', async (event, url: string) => {
	return electron.shell.openExternal(url)
		.catch(console.error)
	;
});

ipcMain.handle('openStreamlink', async (event, url?: string) => {
	if (!!url) {
		return openStreamlink(false, url)
			.catch(console.error)
		;
	} else {
		return openStreamlink(false)
			.catch(console.error)
		;
	}
});

ipcMain.handle('digCmd', (event, domain: string) => {
	let result:string = '';
	try {
		result = execSync(`dig ${domain} +noall +answer`, {
			encoding: "utf-8"
		});
	} catch (e) {
		console.error(e);
	}
	return result
		.split(/\r?\n/)
		.filter(s => s.length && s[0] !== ';')
		.join('')
	;
});

ipcMain.handle('preferenceFileDialog', async function (event, prefId:string): Promise<{ canceled: boolean, filePaths: string[] }|string> {
	const mainWindow = getMainWindow();
	if (!mainWindow) return 'NO_MAIN_WINDOW';

	const conf:SettingConfig|undefined = settings.getSettingConfig(prefId);
	let title:string|undefined = undefined,
		buttonLabel:string|undefined = undefined
	;

	if (!conf || !(conf.type === 'path' || conf.type === 'paths')) {
		return 'SETTINGS_TYPE';
	}

	const _ = await i18n;
	title = _(`preferences.${prefId}_WTitle`, {
		nsSeparator: '.',
		defaultValue: ''
	});
	buttonLabel = _(`preferences.${prefId}_WButton`, {
		nsSeparator: '.',
		defaultValue: ''
	});

	const opts : Electron.OpenDialogOptions = {
		title,
		buttonLabel,
		properties: [
			(conf.opts.asFile === true ? 'openDirectory' : 'openFile'),
			'dontAddToRecent',
			'promptToCreate'
		]
	};
	if (Array.isArray(conf.opts.asFile)) {
		opts.filters = conf.opts.asFile;
	}
	switch (conf.type) {
		case 'path':
			opts.defaultPath = settings.getString(prefId);
			break;
		case 'paths':
			if (opts.properties === undefined) throw new Error('SHOULD_NOT_HAPPEN');
			opts.properties.push('multiSelections');

			const val = settings.getArray(prefId);
			if (val && val.length) {
				const [first] = val;
				if (typeof first === 'string') {
					opts.defaultPath = first;
				}
			}
			break;
	}

	const result = await dialog.showOpenDialog(mainWindow, opts);
	return {
		canceled: result.canceled,
		filePaths: result.filePaths
	}
});

// noinspection JSUnusedLocalSymbols
ipcMain.handle('getWsClientNames', async function (event, args) {
	return await getWsClientNames();
})

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

ipcMain.handle('getVersionState', () => {
	return versionState(__dirname);
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

ipcMain.handle('sendNotification', async (e, message: string, title?: string, sound?: boolean) => {
	return await notifyElectron({
		message,
		title: title || app.name,
		sound
	});
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



// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	// if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (getMainWindow() === null) {
		createWindow();
	}
});



const urlRegexp = /https?:\/\/*/,
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
		notifyElectron({
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
		notifyElectron({
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
			await notifyElectron({
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



let tray:Tray|null = null,
	contextMenu:Menu|null = null
;
// This method will be called when Electron has finished initialization.
// Some APIs can only be used after this event occurs.
interface IZMenuItem extends MenuItem {
	id: string;
	type: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
}
export const settings = new Settings();
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
	refreshQualityChecked();



	// Check if currently opened for a ztoolbox://*
	onOpen(process.argv);



	updateAutoStart()
		.catch(console.error)
	;
}

async function updateAutoStart() {
	const autoLaunchName = "Z-Toolbox",
		autoStartPref = settings.getBoolean('autostart', true)
	;
	// const exeName = path.basename(process.execPath);

	if (process.platform === 'linux') {
		if (!app.isPackaged) {
			// auto-launch trick to be able to use argument
			// @ts-ignore
			const fileBasedUtilities = await import('auto-launch/dist/fileBasedUtilities');
			// @ts-ignore
			const AutoLaunchLinux = await  import('auto-launch/dist/AutoLaunchLinux');
			const targetFilePath = AutoLaunchLinux.getFilePath(autoLaunchName),
				isEnabled = await fileBasedUtilities.isEnabled(targetFilePath)
			;

			if (isEnabled !== autoStartPref) {
				if (autoStartPref) {
					await AutoLaunchLinux.enable({
						appName: autoLaunchName,
						appPath: `${JSON.stringify(process.execPath)} ${JSON.stringify(__dirname)}`,
						isHiddenOnLaunch: false
					})
						.then(() => {
							console.info('autostart enabled');
						})
						.catch(console.error)
					;
				} else {
					await fileBasedUtilities.removeFile(targetFilePath)
						.then(() => {
							console.info('autostart disabled');
						})
						.catch(console.error)
					;
				}
			}
			return;
		}

		const autoLaunch = new AutoLaunch({
				name: autoLaunchName
			}),
			isEnabled = await autoLaunch.isEnabled()
		;

		if (isEnabled !== autoStartPref) {
			if (autoStartPref) {
				await autoLaunch.enable()
					.then(() => {
						console.info('autostart enabled');
					})
					.catch(console.error);
			}
			else {
				await autoLaunch.disable()
					.then(() => {
						console.info('autostart disabled');
					})
					.catch(console.error);
			}
		}
	} else {
		const autostartOpts : Electron.Settings = {
			name: autoLaunchName,
			openAtLogin: autoStartPref
		}

		if (!app.isPackaged) {
			autostartOpts.args = [
				JSON.stringify(__dirname)
			];
		}

		app.setLoginItemSettings(autostartOpts);
	}
}



function onOpen(commandLine:string[]) {
	const isAutoStarted = commandLine.includes(autoStartArgument),
		requests = commandLine.filter(value => {
			return value.indexOf(zToolbox_protocol + '://') !== -1
		})
	;
	let unsupported:boolean = false;

	if (isAutoStarted) {
		console.info('launch from autostart');
	}

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
				showSection('default');
				break;
			default:
				unsupported = true;
				break;
		}
	}


	if (unsupported) {
		notifyElectron({
			title: 'Erreur',
			message: 'Lien non supporté'
		})
			.catch(console.error)
		;
	}
}



const zAlarm = ZAlarm.start('0 * * * *', function (date:Date) {
	console.info(date.toLocaleString('fr'));

	if (settings.getBoolean('hourlyNotification', true)) {
		const language = i18next.t('language'),
			msg = i18next.t('timeIsNow', {
				// currentTime: new Date(date).toLocaleTimeString()
				currentTime: new Intl.DateTimeFormat(language, { timeStyle: 'short' }).format(new Date(date))
			})
		;

		notifyElectron({
			title: 'Z-Toolbox - Hourly alarm',
			message: msg,
			sound: false
		})
			.catch(console.error)
		;
	}
});


export {};
