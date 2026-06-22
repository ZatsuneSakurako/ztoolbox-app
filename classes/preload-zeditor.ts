import {contextBridge, ipcRenderer, webUtils} from "electron";
import {ZEditorAPI, onUpdateFileCallback} from "../browserViews/js/bo/bridgedWindowMonacoEditor.js";

const zEditorApi: ZEditorAPI = {
	// Open a dialog to select a file, then read and send content back
	openFileDialog() {
		return ipcRenderer.invoke('dialog:open');
	},

	// Save current content to a specific path
	saveFile(filePath:string, content:string) {
		return ipcRenderer.invoke('file:save', filePath, content);
	},

	// Auto-save trigger (can be debounced in renderer)
	autoSaveTrigger(filePath:string, content:string) {
		return ipcRenderer.invoke('file:save', filePath, content);
	},

	readPath(file:File) {
		return webUtils.getPathForFile(file);
	},

	resolveMonacoLanguage(filePath:string) {
		return ipcRenderer.invoke('file:resolve-monaco-language', filePath);
	},

	onUpdateFile(callback: onUpdateFileCallback) {
		return ipcRenderer.on('editor:update-file', (event, path:string, content:string) => callback(path, content));
	},
};
contextBridge.exposeInMainWorld('ZEditor', zEditorApi);
