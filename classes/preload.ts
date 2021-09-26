import {contextBridge, ipcRenderer} from "electron";

// https://www.electronjs.org/docs/api/context-bridge#contextbridgeexposeinmainworldapikey-api



contextBridge.exposeInMainWorld(
	'process',
	{
		versions: process.versions
	}
);

contextBridge.exposeInMainWorld(
	'ipcRenderer',
	{
		send: function (name:string, ...args:any[]) {
			ipcRenderer.send(name, ...args);
		}
	}
);

let nonce:string|void;
(async () => {
	nonce = (await ipcRenderer.invoke('nonce-ipc')).toString();
})()
	.catch(console.error)
;
contextBridge.exposeInMainWorld('nodeCrypto', {
	nonce() {
		return nonce;
	}
})
