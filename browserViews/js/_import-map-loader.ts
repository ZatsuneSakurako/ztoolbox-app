export = 0;
// @ts-ignore
self.module = {}

import {BridgedWindow} from "./bridgedWindow";
// @ts-ignore
const parentWindow : BridgedWindow = window.parent;
const baseDir = self.parent.location.href.replace(/[^/]+$/, '');

(async () => {
	const importMap = {
		"imports": {
			"locutus": baseDir + "/lib/locutus/index.js"
		}
	}
	const im = document.createElement('script');
	im.type = 'importmap';
	im.nonce = await parentWindow.znmApi.nonce();
	im.textContent = JSON.stringify(importMap);
	document.head.append(im);
	setTimeout(() => {
		const iframeJs = document.createElement('script');
		iframeJs.type = 'module';
		iframeJs.src = baseDir + 'js/iframe.js';
		document.head.append(iframeJs);
	})
})()
	.catch(console.error)
;
