import {contextBridge, ipcRenderer} from "electron";

// https://www.electronjs.org/docs/api/context-bridge#contextbridgeexposeinmainworldapikey-api

ipcRenderer.on('updatePreference', function (e, preferenceId:string, newValue:any) {
	console.info(preferenceId, newValue);
	for (let cb of updatePreferenceCb) {
		cb(preferenceId, newValue);
	}
})

contextBridge.exposeInMainWorld(
	'process',
	{
		versions: process.versions
	}
);

const updatePreferenceCb:Function[] = [];
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
		}
	}
);
