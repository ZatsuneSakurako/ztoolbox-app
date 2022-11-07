// @ts-ignore
import {stripHtml as _stripHtml} from 'string-strip-html';
import 'locutus';

import {BridgedWindow} from "./bridgedWindow";
// @ts-ignore
const parentWindow : BridgedWindow = window.parent;

const stripHtml:typeof _stripHtml = (window as any).stringStripHtml.stripHtml;



function clearAllSelect(sel: string) {
	document.querySelectorAll(sel).forEach(node => {
		node.remove();
	})
}

async function init(data: { type:'init', js: string, css: string, html: string }) {
	const nonce = await parentWindow.znmApi.nonce();
	if (data.type !== 'init') {
		return;
	}

	console.info('init');
	if (!!data.js) {
		const keys = new Set(['Function', ...Object.keys(globalThis)]),
			js = 'var ' +
				[...keys]
					.filter(n => {
						return !['document', 'console', 'Math', 'setTimout', 'setInterval', 'clearTimeout', 'clearInterval', 'locutus'].includes(n);
					})
					.map(n => n + ' = void 0')
					.join(",")
				+ ';'
		;

		clearAllSelect('head script.onMessage');
		const script = document.createElement('script');
		script.nonce = nonce;
		script.textContent = `(function(){ 'use strict'; ${js}; ${data.js} }.bind(null))()`;
		script.classList.add('onMessage');
		document.head.append(script);
	}
	if (!!data.css) {
		clearAllSelect('head style.onMessage');
		const css = document.createElement('style');
		css.nonce = nonce;
		css.textContent = data.css;
		css.classList.add('onMessage');
		document.head.appendChild(css);
	}
	if (!!data.html) {
		document.body.textContent = '';
		document.body.innerHTML = stripHtml(data.html, {
			skipHtmlDecoding: true,
			onlyStripTags: ['html', 'head', 'script']
		}).result;
	}
}
// @ts-ignore
window.znm_init = init;
window.parent.postMessage({
	type: 'iframe-loaded'
}, window.parent.location.href);
