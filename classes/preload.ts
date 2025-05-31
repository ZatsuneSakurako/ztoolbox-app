import {contextBridge, ipcRenderer} from "electron";
import {IZnmApi, PreferenceTypes} from "../browserViews/js/bo/bridgedWindow.js";
import {NotificationResponse} from "./bo/notify.js";
import Dict = NodeJS.Dict;
import {IJsonWebsiteData} from "../browserViews/js/bo/websiteData.js";
import {IChromeExtensionData} from "./bo/chromeNative.js";

const isFileProtocol = self.location.protocol === 'file:';



const onFocusCb:(() => void)[] = [];
ipcRenderer.on('onFocus', function () {
	for (let cb of onFocusCb) {
		cb();
	}
});



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

	console.info('websiteDataUpdate', data, lastUpdate);
	for (let cb of websiteDataUpdateCb) {
		cb(data, lastUpdate);
	}
})

const wsClientDatasUpdateCb:((data: Dict<IChromeExtensionData>) => void)[] = [];
// noinspection JSUnusedLocalSymbols
ipcRenderer.on('wsClientDatasUpdate', function (e, data: Dict<IChromeExtensionData>) {
	if (!isFileProtocol) {
		console.warn('Not file protocol, ignoring');
		return;
	}

	for (let cb of wsClientDatasUpdateCb) {
		cb(data);
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
	preferenceFileDialog: (prefId) => ipcRendererInvoke('preferenceFileDialog', prefId),
	_: (key:string) => ipcRendererInvoke('i18n', key),
	getWsClientDatas: () => ipcRendererInvoke('getWsClientDatas'),
	moveWsClientUrl: (data, targetId) => ipcRendererInvoke('moveWsClientUrl', data, targetId),
	getUpdateStatus: () => ipcRendererInvoke('getUpdateStatus'),
	doUpdate: () => ipcRendererInvoke('doUpdate'),

	parseIni: (rawString:string)=> ipcRendererInvoke('parseIni', rawString),

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

	sendNotification(message: string, title?: string, sound?: boolean): Promise<NotificationResponse> {
		return ipcRendererInvoke('sendNotification', message, title, sound);
	},

	nunjuckRender(templateName:string, context:any) {
		return ipcRendererInvoke('nunjuckRender', templateName, context)
	},

	getNetConnectionAddress(host:string, timeout?:number) {
		return ipcRendererInvoke('getNetConnectionAddress', host, timeout);
	},

	onFocus(cb: () => void) {
		onFocusCb.push(cb);
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
	onWsClientDatasUpdate: (cb:(data: Dict<IChromeExtensionData>) => void) => {
		wsClientDatasUpdateCb.push(cb);
	},
	refreshWebsitesData: () => {
		return ipcRendererInvoke('refreshWebsitesData');
	},
	openLoginUrl: (website:string) => {
		return ipcRendererInvoke('openLoginUrl', website);
	}
};

contextBridge.exposeInMainWorld('znmApi', znmApi);
