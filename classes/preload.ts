import {contextBridge, ipcRenderer} from "electron";

// https://www.electronjs.org/docs/api/context-bridge#contextbridgeexposeinmainworldapikey-api

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
		savePreference: (preferenceId:string, newValue:any) => {
			return ipcRenderer.invoke('savePreference', preferenceId, newValue)
		},
		mustacheRender: (templateName:string, context:any) => {
			return ipcRenderer.invoke('mustacheRender', templateName, context)
		}
	}
);
