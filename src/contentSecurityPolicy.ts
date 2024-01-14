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
			let protocol : string = '';
			try {
				protocol = new URL(details.url).protocol
			} catch (e) {
				console.error(e);
			}
			if (protocol !== 'file:') {
				// If not file protocol, leave current csp headers
				callback({});
				return;
			}

			callback({
				responseHeaders: {
					...details.responseHeaders,
					'Content-Security-Policy': [
						`default-src 'none'; script-src 'self' https://unpkg.com/ 'nonce-${nonce}'; object-src https://*; style-src 'self' 'unsafe-inline'; img-src 'self' https://icons.duckduckgo.com https://www.deviantart.com https://dnslytics.com
https://dnschecker.org 'nonce-${nonce}'; media-src 'self'; frame-src 'self'; font-src 'self'; connect-src https://api.duckduckgo.com`
					]
				}
			})
		});
	})
	.catch(console.error)
;
