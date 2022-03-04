import {contextBridge, ipcRenderer} from "electron";
import {IZnmApi, PreferenceTypes} from "../browserViews/js/bridgedWindow";
import {NotificationResponse} from "./bo/notify";

// https://www.electronjs.org/docs/api/context-bridge#contextbridgeexposeinmainworldapikey-api

const updatePreferenceCb:((preferenceId:string, newValue:any) => void)[] = [];
ipcRenderer.on('updatePreference', function (e, preferenceId:string, newValue:any) {
	console.info(preferenceId, newValue);
	for (let cb of updatePreferenceCb) {
		cb(preferenceId, newValue);
	}
});

const showSectionCb:((sectionName:string) => void)[] = [];
ipcRenderer.on('showSection', function (e, sectionName:string) {
	console.info(`showSection`, sectionName);
	for (let cb of showSectionCb) {
		cb(sectionName);
	}
});

const themeUpdateCb:((theme:string, background_color:string) => void)[] = [];
ipcRenderer.on('themeUpdate', function (e, theme:string, background_color:string) {
	console.info('themeUpdate', theme, background_color);
	for (let cb of themeUpdateCb) {
		cb(theme, background_color);
	}
})

contextBridge.exposeInMainWorld(
	'process',
	{
		versions: process.versions
	}
);

const znmApi:IZnmApi = {
	nonce: () => ipcRenderer.invoke('nonce-ipc'),
	openStreamlink: (url?: string) => ipcRenderer.invoke('openStreamlink', url),
	digCmd: (domain: string) => ipcRenderer.invoke('digCmd', domain),
	_: (key:string) => ipcRenderer.invoke('i18n', key),

	getVersionState: () => ipcRenderer.invoke('getVersionState'),

	getPreference: (preferenceId:string, type?:PreferenceTypes) => {
		return ipcRenderer.invoke('getPreference', preferenceId, type)
	},
	getPreferences: (...preferenceIds:string[]) => {
		return ipcRenderer.invoke('getPreferences', ...preferenceIds)
	},
	savePreference: (preferenceId:string, newValue:any) => {
		return ipcRenderer.invoke('savePreference', preferenceId, newValue)
	},

	sendNotification(message: string, title?: string, sound?: boolean): Promise<NotificationResponse> {
		return ipcRenderer.invoke('sendNotification', message, title, sound);
	},

	mustacheRender: (templateName:string, context:any) => {
		return ipcRenderer.invoke('mustacheRender', templateName, context)
	},
	onUpdatePreference: (cb:(preferenceId:string, newValue:any) => void) => {
		updatePreferenceCb.push(cb);
	},
	onShowSection: (cb:(sectionName:string) => void) => {
		showSectionCb.push(cb);
	},
	onThemeUpdate: (cb:(theme:string, background_color:string) => void) => {
		themeUpdateCb.push(cb);
	}
};

contextBridge.exposeInMainWorld('znmApi', znmApi);
