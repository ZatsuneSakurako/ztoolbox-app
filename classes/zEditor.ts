import {ipcMain, BrowserWindow, dialog} from "electron";
import path from "node:path";
import * as fs from 'node:fs';
import mime from 'mime-types';
import {browserViewDirPath} from "./constants.js";
import {ZEditorAPI} from "../browserViews/js/bo/bridgedWindowMonacoEditor.js";
import {sendNotification} from "./notify.js";

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
ipcMain.handle('file:resolve-monaco-language', async (_, filePath:string) => {
	try {
		return getMonacoLanguage(filePath);
	} catch (error) {
		console.error(error);
		return null;
	}
});
