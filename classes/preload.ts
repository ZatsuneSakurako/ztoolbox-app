import {contextBridge, ipcRenderer} from "electron";

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

contextBridge.exposeInMainWorld(
	'znmApi',
	{
		nonce: () => ipcRenderer.invoke('nonce-ipc'),
		openStreamlink: () => ipcRenderer.invoke('openStreamlink'),
		_: (key:string) => ipcRenderer.invoke('i18n', key),
		getPreference: (preferenceId:string) => {
			return ipcRenderer.invoke('getPreference', preferenceId)
		},
		getPreferences: (...preferenceIds:string[]) => {
			return ipcRenderer.invoke('getPreferences', ...preferenceIds)
		},
		savePreference: (preferenceId:string, newValue:any) => {
			return ipcRenderer.invoke('savePreference', preferenceId, newValue)
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
	}
);
