import {ipcMain, BrowserWindow, dialog} from "electron";
import path from "node:path";
import * as fs from 'node:fs';
import {browserViewDirPath} from "./constants.js";
import {ZEditorAPI} from "../browserViews/js/bo/bridgedWindowMonacoEditor.js";
import {sendNotification} from "./notify.js";
import {getMonacoLanguage} from "../browserViews/js/getMonacoLanguage.js";

const __dirname = import.meta.dirname;

export const browserWindows = new Set<BrowserWindow>();

export async function createZEditorWindow(filePath?:string) {
	const browserWindow = new BrowserWindow({
		width: 1000,
		height: 800,
		backgroundColor: '#272822',
		webPreferences: {
			nodeIntegration: true,
			preload: path.resolve(__dirname, '../classes/preload-zeditor.mjs'),
		},
	});
	browserWindows.add(browserWindow);
	browserWindow.on('closed', () => {
		browserWindows.delete(browserWindow);
	});
	browserWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' })); // Security

	const query: Electron.LoadFileOptions['query'] = {};
	if (filePath) {
		try {
			query.filePath = filePath;
			query.fileContent = fs.readFileSync(filePath, 'utf-8');

			const langId = getMonacoLanguage(filePath)?.langId;
			if (langId) {
				query.fileLangId = langId;
			}
		} catch (e) {
			console.error(e);

			sendNotification({
				title: 'Erreur',
				message: 'Erreur lors de la lecture du fichier',
			})
				.catch(console.error);
		}
	}

	try {
		await browserWindow.loadFile(browserViewDirPath + '/monaco-editor.html', {
			query,
		});
	} catch (e) {
		console.error('Failed to render:', e);
	}
}

ipcMain.handle('dialog:open', async (event) => {
	const win = BrowserWindow.fromWebContents(event.sender);
	if (!win) {
		throw new Error('No window associated with this IPC request');
	}

	const result = await dialog.showOpenDialog(win, {
		properties: ['openFile'],
		filters: [
			{ name: 'Text/Markdown', extensions: ['txt', 'conf', 'log', 'md'] },
			{
				name: 'Web',
				extensions: [
					'html',
					'css',
					'json',

					'js',
					'cjs',
					'mjs',

					'ts',
					'cts',
					'mts'
				]
			},
		],
	});

	if (result.canceled || result.filePaths.length === 0) return null;

	const filePath = result.filePaths[0];
	return <Awaited<ReturnType<ZEditorAPI['openFileDialog']>>>{
		path: filePath,
		content: fs.readFileSync(filePath, 'utf-8'),
	};
});

ipcMain.handle('file:save', async (_, filePath:string, content:string) => {
	try {
		fs.writeFileSync(filePath, content, 'utf-8');
		return true;
	} catch (error) {
		console.error('Save failed:', error);
		return false;
	}
});
