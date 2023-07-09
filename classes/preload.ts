import {contextBridge, ipcRenderer} from "electron";
import {IZnmApi, PreferenceTypes} from "../browserViews/js/bo/bridgedWindow";
import {NotificationResponse} from "./bo/notify";
import Dict = NodeJS.Dict;
import {IJsonWebsiteData} from "../browserViews/js/bo/websiteData";
import {getInstallStates} from "./chromeNativeInstallers";

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
});

const websiteDataUpdateCb:((data: Dict<IJsonWebsiteData>, lastUpdate:Date) => void)[] = [];
// noinspection JSUnusedLocalSymbols
ipcRenderer.on('websiteDataUpdate', function (e, data: Dict<IJsonWebsiteData>, lastUpdate:Date) {
	console.info('websiteDataUpdate');
	for (let cb of websiteDataUpdateCb) {
		cb(data, lastUpdate);
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
	openExternal: (url: string) => ipcRenderer.invoke('openExternal', url),
	digCmd: (domain: string) => ipcRenderer.invoke('digCmd', domain),
	preferenceFileDialog: (prefId) => ipcRenderer.invoke('preferenceFileDialog', prefId),
	_: (key:string) => ipcRenderer.invoke('i18n', key),
	getWsClientNames: () => ipcRenderer.invoke('getWsClientNames'),

	getProcessArgv: () => ipcRenderer.invoke('getProcessArgv'),
	getVersionState: () => ipcRenderer.invoke('getVersionState'),

	getPreference(preferenceId:string, type?:PreferenceTypes) {
		return ipcRenderer.invoke('getPreference', preferenceId, type)
	},
	getPreferences(...preferenceIds:string[]) {
		return ipcRenderer.invoke('getPreferences', ...preferenceIds)
	},
	savePreference(preferenceId:string, newValue:any) {
		return ipcRenderer.invoke('savePreference', preferenceId, newValue)
	},
	chromeNative_install(isUninstall?: boolean) {
		return ipcRenderer.invoke('chromeNative_install', isUninstall);
	},
	chromeNative_installStates() {
		return ipcRenderer.invoke('chromeNative_installStates');
	},

	sendNotification(message: string, title?: string, sound?: boolean): Promise<NotificationResponse> {
		return ipcRenderer.invoke('sendNotification', message, title, sound);
	},

	twigRender: (templateName:string, context:any) => {
		return ipcRenderer.invoke('twigRender', templateName, context)
	},
	onUpdatePreference: (cb:(preferenceId:string, newValue:any) => void) => {
		updatePreferenceCb.push(cb);
	},
	onShowSection: (cb:(sectionName:string) => void) => {
		showSectionCb.push(cb);
	},
	onThemeUpdate: (cb:(theme:string, background_color:string) => void) => {
		themeUpdateCb.push(cb);
	},
	onWebsiteDataUpdate: (cb:(data: Dict<IJsonWebsiteData>, lastUpdate:Date) => void) => {
		websiteDataUpdateCb.push(cb);
	},
	refreshWebsitesData: () => {
		return ipcRenderer.invoke('refreshWebsitesData');
	}
};

contextBridge.exposeInMainWorld('znmApi', znmApi);
