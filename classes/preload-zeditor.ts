import {contextBridge, ipcRenderer, webUtils} from "electron";
import {onUpdateFileCallback} from "../browserViews/js/bo/bridgedWindowMonacoEditor.js";

contextBridge.exposeInMainWorld('ZEditor', {
	// Open a dialog to select a file, then read and send content back
	openFileDialog: () => ipcRenderer.invoke('dialog:open'),

	// Save current content to a specific path
	saveFile: (filePath:string, content:string) => ipcRenderer.invoke('file:save', filePath, content),

	// Auto-save trigger (can be debounced in renderer)
	autoSaveTrigger: (filePath:string, content:string) => ipcRenderer.invoke('file:save', filePath, content),

	readPath: (file:File) => webUtils.getPathForFile(file),

	onUpdateFile: (callback: onUpdateFileCallback) => ipcRenderer.on('editor:update-file', (event, path:string, content:string) => callback(path, content)),
});
