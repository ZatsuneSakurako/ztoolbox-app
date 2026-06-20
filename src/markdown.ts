import { app, BrowserWindow } from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { marked } from 'marked';
import {nunjucksEnv} from "./nunjucksEnv.js";
import sanitizeHtml from 'sanitize-html';
import {browserViewPath} from "../classes/constants.js";

export const browserWindows = new Set<BrowserWindow>();

export async function createMarkdownWindow(filePath: string) {
	const baseUrl = new URL('file://' + browserViewPath);
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


	let _error:unknown|null = null;
	try {
		// 1. Read the file synchronously (or async with await)
		const absolutePath = path.resolve(filePath),
			markdownContent = fs.readFileSync(absolutePath, 'utf-8');

		// 2. Parse Markdown to HTML using Marked
		// You can pass options if needed
		const htmlContent = sanitizeHtml(await marked(markdownContent));
		console.dir(htmlContent)

		// const env = nunjucks.configure([], { autoescape: false });
		const finalHtml = nunjucksEnv.render('markdown.njk', {
			title: `${path.basename(filePath)} (${path.dirname(filePath)})`,
			content: htmlContent,
		});

		await browserWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(finalHtml)}`, {
			baseURLForDataURL: baseUrl.toString(),
		});
	} catch (e) {
		console.error('Failed to render:', e);
		_error = e;
	}

	if (_error) {
		try {
			const errorHtml = nunjucksEnv.renderString('markdown', {
				title: `Error: ${path.basename(filePath)} (${path.dirname(filePath)})`,
				content: `<p>Could not render file&nbsp;: ${filePath}</p>
<pre style="background:#333; padding:10px;">${(_error as Error).message}</pre>`,
			});
			await browserWindow?.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml), {
				baseURLForDataURL: baseUrl.toString(),
			});
		} catch (e) {
			console.error(e);
		}
	}
}
