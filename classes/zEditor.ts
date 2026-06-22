import {ipcMain, BrowserWindow, dialog} from "electron";
import path from "node:path";
import * as fs from 'node:fs';
import mime from 'mime-types';
import {browserViewDirPath} from "./constants.js";
import {ZEditorAPI} from "../browserViews/js/bo/bridgedWindowMonacoEditor.js";

const __dirname = import.meta.dirname;

let mainWindow:BrowserWindow|null = null;

export async function createZEditorWindow() {
	if (mainWindow) return;

	mainWindow = new BrowserWindow({
		width: 1000,
		height: 800,
		backgroundColor: '#272822',
		webPreferences: {
			nodeIntegration: true,
			preload: path.resolve(__dirname, '../classes/preload-zeditor.mjs'),
		},
	});
	mainWindow.on('closed', () => {
		mainWindow = null;
	});
	mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' })); // Security

	try {
		await mainWindow.loadFile(browserViewDirPath + '/monaco-editor.html');
	} catch (e) {
		console.error('Failed to render:', e);
	}
}

ipcMain.handle('dialog:open', async () => {
	const result = await dialog.showOpenDialog(mainWindow!, {
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

	const filePath = result.filePaths[0],
		content = fs.readFileSync(filePath, 'utf-8');
	mainWindow!.webContents.send('editor:update-file', filePath, content);
	return filePath;
});

ipcMain.handle('file:save', async (event, filePath:string, content:string) => {
	try {
		fs.writeFileSync(filePath, content, 'utf-8');
		return true;
	} catch (error) {
		console.error('Save failed:', error);
		return false;
	}
});

ipcMain.handle('file:read-path', async (event, filePath:string) => {
	try {
		const content = fs.readFileSync(filePath, 'utf-8');
		mainWindow!.webContents.send('editor:update-content', content);
		mainWindow!.webContents.send('editor:filepath', filePath);
		return filePath;
	} catch (error) {
		console.error('Read failed:', error);
		return null;
	}
});

/**
 * Generic MIME type to Monaco Language ID converter
 */
function getMonacoLanguage(filePath: string): Awaited<ReturnType<ZEditorAPI['resolveMonacoLanguage']>> {
	// Get MIME type from the path
	const mimeType = mime.lookup(filePath),
		ext = path.extname(filePath).replace(/^\./, '').toLowerCase();

	/**
	 * Generic extraction :
	 * - remove the prefix
	 * - some vendor "x-" (e.g., 'text/x-python' -> 'python', 'text/x-sh' -> 'sh')
	 * - use file extension as a fallback
	 */
	let langId = !mimeType ? ext :
		mimeType.split('/').pop()?.toLowerCase().replace(/^x-/, '');
	if (!langId || langId === 'plain') {
		langId = 'plaintext';
	}

	console.dir(langId)

	if (langId === 'plaintext') {
		const PLAIN_OVERRIDES : Set<string> = new Set([
			'conf',
		]);
		if (PLAIN_OVERRIDES.has(ext)) {
			langId = ext;
		}
	}

	const OVERRIDE_MAP: Record<string, string> = {
		'json5': 'json', // JSON variants all map to monaco 'json'

		'sh': 'shell',        // Note: Monaco uses 'shell', 'bash', or 'shellscript' depending on config
		'bash': 'shell',
		'shellscript': 'shell',

		'conf': 'ini',
		'cfg': 'ini',

		'njk': 'twig', // Use Twig for njk
		'stylus': 'styl', // Monaco may not support stylus out-of-box
		'toml': 'ini', // Monaco doesn't have 'toml', 'ini' is closest
		'cpp': 'c++', // Monaco uses 'cpp'
	};

	return {
		mimeType,
		langId: OVERRIDE_MAP[langId] ?? langId,
	};
}
ipcMain.handle('file:resolve-monaco-language', async (event, filePath:string) => {
	try {
		return getMonacoLanguage(filePath);
	} catch (error) {
		console.error(error);
		return null;
	}
});
