import electron, {app, dialog, ipcMain} from 'electron';
import fastifyStatic from '@fastify/static';
import * as path from "node:path";
import {sendNotification} from "./classes/notify.js";
import {PreferenceTypes} from "./browserViews/js/bo/bridgedWindow.js";
import {fastifyApp, getWsClientDatas, moveWsClientUrl} from "./classes/chromeNative.js";
import {createWindow, getMainWindow} from "./classes/windowManager.js";
import {SettingConfig} from "./classes/bo/settings.js";
import './src/contentSecurityPolicy.js';
import './src/contextMenu.js';
import './src/hourlyAlarm.js';
import './src/manageProtocolAndAutostart.js';
import {resourcePath} from "./classes/constants.js";
import {IWsMoveSourceData} from "./classes/bo/chromeNative.js";
import {settings} from "./classes/Settings.js";
import ini from "ini";
import * as update from './src/update.js';
import fs from "node:fs";
import {nunjucksEnv} from "./src/nunjucksEnv.js";
import Dict = NodeJS.Dict;
import {markdownRender} from "./src/markdownRendering.js";


fastifyApp.register(fastifyStatic, {
	root: path.join(resourcePath, 'browserViews'),
	prefix: '/',
	allowedPath(pathName) {
		return pathName.endsWith('.html');
	},
	decorateReply: false,
});
fastifyApp.register(fastifyStatic, {
	root: path.join(resourcePath, 'browserViews/js'),
	prefix: '/js/',
	decorateReply: false,
	allowedPath(pathName) {
		return /\.(js|json|map)$/.test(pathName);
	},
});
fastifyApp.register(fastifyStatic, {
	root: path.join(resourcePath, 'browserViews/css'),
	prefix: '/css/',
	decorateReply: false,
	allowedPath(pathName) {
		return /\.(css|map)$/.test(pathName);
	},
});
fastifyApp.register(fastifyStatic, {
	root: path.join(resourcePath, 'browserViews/lib'),
	prefix: '/lib/',
	decorateReply: false,
	allowedPath(pathName) {
		return /\.(css|js|json|map|woff2?)$/.test(pathName);
	},
});
fastifyApp.route<{ Params: { fileName: string } }>({
	method: ['GET', 'POST'],
	url: '/local-assets/:fileName',
	handler: async function (req, reply) {
		const fileName = req.params.fileName,
			extension = path.extname(fileName);
		if (!extension || !/^\.(?:png|jpe?g|svg|web[pm])$/i.test(extension) || /[\/\\]/.test(fileName) || fileName.startsWith('.')) {
			return reply.status(404).send('Not found');
		}

		const localAssetPath = path.normalize(`${settings.storageDir}/local-assets`);

		const filePath = path.normalize(`${localAssetPath}/${fileName}`);
		if (fs.existsSync(filePath)) {
			return reply.send(fs.readFileSync(filePath, null));
		}
		return reply.status(404).send('Not found');
	}
});
fastifyApp.listen({
	host: 'localhost',
	port: 42080,
}, (err, address) => {
	if (err) {
		console.error(err);
	} else {
		console.log(`Listening at ${address}`);
	}
});



ipcMain.handle('openExternal', async (event, url: string) => {
	return electron.shell.openExternal(url)
		.catch(console.error)
	;
});

ipcMain.handle('preferenceFileDialog', async function (event, prefId:string): Promise<{ canceled: boolean, filePaths: string[] }|string> {
	const mainWindow = getMainWindow();
	if (!mainWindow) return 'NO_MAIN_WINDOW';

	const conf:SettingConfig|undefined = settings.getSettingConfig(prefId);

	if (!conf || !(conf.type === 'path' || conf.type === 'paths')) {
		return 'SETTINGS_TYPE';
	}

	const opts : Electron.OpenDialogOptions = {
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
ipcMain.handle('getWsClientDatas', async function (event, args) {
	return Object.fromEntries(await getWsClientDatas());
});

ipcMain.handle('moveWsClientUrl', async function (event, srcData:IWsMoveSourceData, targetId:string) {
	return await moveWsClientUrl(srcData, targetId);
});

ipcMain.handle('getUpdateStatus', async function (event) {
	return await update.updateStatus();
});

ipcMain.handle('doUpdate', async function (event) {
	return await update.doUpdate();
});

ipcMain.handle('parseIni', async function (event, rawContent:string) {
	return ini.parse(rawContent);
});

ipcMain.handle('getProcessArgv', () => {
	return process.argv;
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
	return await sendNotification({
		message,
		title: title || app.name,
		sound
	});
});

ipcMain.handle('nunjucksRender', async (e, templateName:string, context:any) => {
	return nunjucksEnv.render(`${templateName}.njk`, context);
});

ipcMain.handle('markdownRender', async (e, markdownContent:string) => {
	return markdownRender(markdownContent);
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



