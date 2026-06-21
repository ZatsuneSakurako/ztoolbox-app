import {URL} from 'node:url';
import {app, protocol} from 'electron';
import {nunjucksEnv} from "./nunjucksEnv.js";
import {Dict} from "../browserViews/js/bo/Dict.js";
import {sanitizePath} from "./sanitizePath.js";
import {browserViewPath} from "../classes/constants.js";
import path from "node:path";
import fs from "node:fs";

// The custom scheme we will use
export const SCHEME = 'app';
const mimeTypes: Dict<string> = {
	'.js': 'application/javascript',
	'.css': 'text/css',
	'.png': 'image/png',
};

// Handle the registration (schemes are case-insensitive but usually lowercase)
protocol.registerSchemesAsPrivileged([
	{ scheme: SCHEME, privileges: { standard: true, secure: true, bypassCSP: false, supportFetchAPI: true } }
]);


async function onRequest(request: GlobalRequest){
	try {
		const _url = new URL(request.url);
		if (!request.url.startsWith(SCHEME + '://bundle/')) {
			// noinspection ExceptionCaughtLocallyJS
			throw new Error('UNEXPECTED_URL');
		}

		const pathExtension = path.extname(_url.pathname);
		let pathname = _url.pathname + (!pathExtension ? '.njk' : '');
		pathname = sanitizePath(pathname, path.dirname(browserViewPath));

		if (['.js', '.css', '.png'].includes(pathExtension)) {
			if (!fs.existsSync(pathname)) {
				return new Response('Not Found', { status: 404 });
			}

			const buffer = fs.readFileSync(pathname);
			return new Response(buffer, {
				headers: { 'Content-Type': mimeTypes[pathExtension] || 'application/octet-stream' },
			});
		}

		const queryParams = new URL(request.url).searchParams,
			context: Dict<any> = {
				'queryParams': Object.fromEntries(queryParams),
				'hash': _url.hash,
				'timestamp': new Date().toISOString(),
			};

		// Return the HTML as a buffer with correct MIME type
		const htmlContent = nunjucksEnv.render(`${pathname}`, context);
		return new Response(Buffer.from(htmlContent), {
			headers: {
				'Content-Type': 'text/html;charset=utf-8',
			},
		});
	} catch (error) {
		console.error('Protocol Handler Error:', error);
		// Return a simple 404 or error page
		return new Response('<h1>404 – Page Not Found</h1>', {
			status: 404,
			headers: {
				'Content-Type': 'text/html;charset=utf-8',
			},
		});
	}
}

app.whenReady().then(() => {
	protocol.handle(SCHEME, onRequest);
});
