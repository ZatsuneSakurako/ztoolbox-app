import {app, ipcMain, dialog} from 'electron';
import electron from 'electron';
import {TwingEnvironment, TwingLoaderFilesystem} from "twing";
import * as path from "path";
import Dict = NodeJS.Dict;

import {Settings} from './classes/Settings';
import {notifyElectron} from "./classes/notify";
import {PreferenceTypes} from "./browserViews/js/bo/bridgedWindow";
import {versionState} from "./classes/versionState";
import {getWsClientNames, server, io} from "./classes/chromeNative";
import {createWindow, getMainWindow} from "./classes/windowManager";
import {execSync} from "child_process";
import {SettingConfig} from "./classes/bo/settings";
import './src/clipboard';
import './src/contentSecurityPolicy';
import './src/contextMenu';
import './src/hourlyAlarm';
import {i18n} from "./src/i18next";
import './src/manageProtocolAndAutostart';
import {appRootPath, resourcePath} from "./classes/constants";



server.listen({
	hostname: 'localhost',
	port: 42080,
}, () => {
	console.log('Listening at localhost:42080');
});
io.listen(server);

ipcMain.handle('openExternal', async (event, url: string) => {
	return electron.shell.openExternal(url)
		.catch(console.error)
	;
});

ipcMain.handle('digCmd', (event, domain: string) => {
	let result:string = '';
	try {
		// noinspection SpellCheckingInspection
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

ipcMain.handle('i18n', async (event, key) => {
	const _ = await i18n;
	return _(key, {
		nsSeparator: '.',
		defaultValue: ''
	});
});

ipcMain.handle('getProcessArgv', () => {
	return process.argv;
});

ipcMain.handle('getVersionState', async () => {
	return versionState(appRootPath);
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

const twig = new TwingEnvironment(new TwingLoaderFilesystem(path.normalize(`${resourcePath}/templates/`)), {
	cache: false // TODO store cache in some folders
});
ipcMain.handle('twigRender', async (e, templateName:string, context:any) => {
	return await twig.render(`${templateName}.twig`, context);
});



// Quit when all windows are closed.
app.on('window-all-closed', function () {
	/*
	 * On macOS it is common for applications and their menu bar
	 * to stay active until the user quits explicitly with Cmd + Q
	 * if (process.platform !== 'darwin') app.quit()
	 */
});

app.on('activate', function () {
	/*
	 * On macOS it's common to re-create a window in the app when the
	 * dock icon is clicked and there are no other windows open.
	 */
	if (getMainWindow() === null) {
		createWindow();
	}
});



export const settings = new Settings();
