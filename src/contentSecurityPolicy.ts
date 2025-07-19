import crypto from "crypto";
import {app, ipcMain, session} from "electron";

const nonce = crypto.randomBytes(16).toString('base64');
// noinspection JSUnusedLocalSymbols
ipcMain.handle('nonce-ipc', async (event, ...args) => {
	return nonce;
});

app.whenReady()
	.then(function () {
		session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
			let url : URL|null = null;
			try {
				url = new URL(details.url)
			} catch (e) {
				console.error(e);
			}
			if (url?.protocol !== 'file:') {
				// If not file protocol, leave current csp headers
				callback({});
				return;
			}

			callback({
				responseHeaders: {
					...details.responseHeaders,
					'Content-Security-Policy': [
						`default-src 'none'; script-src 'self' https://unpkg.com 'nonce-${nonce}'; object-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*; media-src 'self'; frame-src http://localhost:42080; font-src 'self'; connect-src https://api.duckduckgo.com https://unpkg.com`
					]
				}
			});
		});
	})
	.catch(console.error)
;
