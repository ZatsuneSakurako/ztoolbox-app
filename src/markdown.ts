import {BrowserWindow} from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import {SCHEME} from "./internalProtocol.js";

export const browserWindows = new Set<BrowserWindow>();

export async function createMarkdownWindow(filePath: string) {
	const browserWindow = new BrowserWindow({
		width: 1000,
		height: 800,
		backgroundColor: '#272822',
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			// No need to preload if not doing IPC
		}
	});
	browserWindows.add(browserWindow);
	browserWindow.on('closed', () => {
		browserWindows.delete(browserWindow);
	});
	browserWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' })); // Security


	let _error:unknown|null = null;
	try {
		const absolutePath = path.resolve(filePath),
			markdownContent = fs.readFileSync(absolutePath, 'utf-8');

		const _url = new URL(`${SCHEME}://bundle/markdown`);
		_url.searchParams.set('title', `${path.basename(filePath)} (${path.dirname(filePath)})`);
		_url.searchParams.set('htmlContent', sanitizeHtml(await marked(markdownContent)));

		await browserWindow.loadURL(_url.toString());
	} catch (e) {
		console.error('Failed to render:', e);
		_error = e;
	}

	if (_error) {
		try {
			const _url = new URL(`${SCHEME}://bundle/markdown`);
			_url.searchParams.set('title', `Error: ${path.basename(filePath)} (${path.dirname(filePath)})`);
			_url.searchParams.set('htmlContent', `<p>Could not render file&nbsp;: ${filePath}</p>
<pre style="background:#333; padding:10px;">${(_error as Error).message}</pre>`);

			await browserWindow.loadURL(_url.toString());
		} catch (e) {
			console.error(e);
		}
	}
}
