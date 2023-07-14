import {contextBridge, ipcRenderer} from "electron";
import {IZnmApi, PreferenceTypes} from "../browserViews/js/bo/bridgedWindow";
import {NotificationResponse} from "./bo/notify";
import Dict = NodeJS.Dict;
import {IJsonWebsiteData} from "../browserViews/js/bo/websiteData";
import {getInstallStates} from "./chromeNativeInstallers";

const isFileProtocol = self.location.protocol === 'file:';



const updatePreferenceCb:((preferenceId:string, newValue:any) => void)[] = [];
ipcRenderer.on('updatePreference', function (e, preferenceId:string, newValue:any) {
	if (!isFileProtocol) {
		console.warn('Not file protocol, ignoring');
		return;
	}

	console.info(preferenceId, newValue);
	for (let cb of updatePreferenceCb) {
		cb(preferenceId, newValue);
	}
});

const showSectionCb:((sectionName:string) => void)[] = [];
ipcRenderer.on('showSection', function (e, sectionName:string) {
	if (!isFileProtocol) {
		console.warn('Not file protocol, ignoring');
		return;
	}

	console.info(`showSection`, sectionName);
	for (let cb of showSectionCb) {
		cb(sectionName);
	}
});

const themeUpdateCb:((theme:string, background_color:string) => void)[] = [];
ipcRenderer.on('themeUpdate', function (e, theme:string, background_color:string) {
	if (!isFileProtocol) {
		console.warn('Not file protocol, ignoring');
		return;
	}

	console.info('themeUpdate', theme, background_color);
	for (let cb of themeUpdateCb) {
		cb(theme, background_color);
	}
});

const websiteDataUpdateCb:((data: Dict<IJsonWebsiteData>, lastUpdate:Date) => void)[] = [];
// noinspection JSUnusedLocalSymbols
ipcRenderer.on('websiteDataUpdate', function (e, data: Dict<IJsonWebsiteData>, lastUpdate:Date) {
	if (!isFileProtocol) {
		console.warn('Not file protocol, ignoring');
		return;
	}

	console.info('websiteDataUpdate');
	for (let cb of websiteDataUpdateCb) {
		cb(data, lastUpdate);
	}
})

if (isFileProtocol) {
	// https://www.electronjs.org/docs/api/context-bridge#contextbridgeexposeinmainworldapikey-api
	contextBridge.exposeInMainWorld(
		'process',
		{
			versions: process.versions
		}
	);
}

function ipcRendererInvoke(channel: string, ...args: any[]) {
	if (!isFileProtocol) {
		console.warn('Not file protocol, ignoring');
		return Promise.reject(new Error('NOT_FILE_PROTOCOL'));
	}
	return ipcRenderer.invoke(channel, ...args);
}

const znmApi:IZnmApi = {
	nonce: () => ipcRendererInvoke('nonce-ipc'),
	openExternal: (url: string) => ipcRendererInvoke('openExternal', url),
	digCmd: (domain: string) => ipcRendererInvoke('digCmd', domain),
	preferenceFileDialog: (prefId) => ipcRendererInvoke('preferenceFileDialog', prefId),
	_: (key:string) => ipcRendererInvoke('i18n', key),
	getWsClientNames: () => ipcRendererInvoke('getWsClientNames'),

	getProcessArgv: () => ipcRendererInvoke('getProcessArgv'),
	getVersionState: () => ipcRendererInvoke('getVersionState'),

	getPreference(preferenceId:string, type?:PreferenceTypes) {
		return ipcRendererInvoke('getPreference', preferenceId, type)
	},
	getPreferences(...preferenceIds:string[]) {
		return ipcRendererInvoke('getPreferences', ...preferenceIds)
	},
	savePreference(preferenceId:string, newValue:any) {
		return ipcRendererInvoke('savePreference', preferenceId, newValue)
	},
	chromeNative_install(isUninstall?: boolean) {
		return ipcRendererInvoke('chromeNative_install', isUninstall);
	},
	chromeNative_installStates() {
		return ipcRendererInvoke('chromeNative_installStates');
	},

	sendNotification(message: string, title?: string, sound?: boolean): Promise<NotificationResponse> {
		return ipcRendererInvoke('sendNotification', message, title, sound);
	},

	twigRender: (templateName:string, context:any) => {
		return ipcRendererInvoke('twigRender', templateName, context)
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
		return ipcRendererInvoke('refreshWebsitesData');
	}
};

contextBridge.exposeInMainWorld('znmApi', znmApi);
