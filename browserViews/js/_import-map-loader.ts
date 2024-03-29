import {BridgedWindow} from "./bo/bridgedWindow.js";
// @ts-ignore
const parentWindow : BridgedWindow = window.parent;
const baseDir = self.parent.location.href.replace(/[^/]+$/, '');

(async () => {
	const importMap = {
		"imports": {
			"yaml": baseDir + "/lib/yaml/index.js"
		}
	}
	const im = document.createElement('script');
	im.type = 'importmap';
	im.nonce = await parentWindow.znmApi.nonce();
	im.textContent = JSON.stringify(importMap);
	document.head.append(im);
	setTimeout(async () => {
		const scripts = document.querySelectorAll<HTMLScriptElement>('script[type="lazy-module"]');
		for (let script of scripts) {
			const _script = document.createElement('script');
			_script.src = script.src;
			_script.type = 'module';
			script.remove();
			document.head.append(_script);
		}
	})
})()
	.catch(err => {
		console.error(err, location.href);
	})
;
