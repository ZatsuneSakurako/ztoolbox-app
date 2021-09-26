import {stripHtml as _stripHtml} from 'string-strip-html';

const stripHtml:typeof _stripHtml = (window as any).stringStripHtml.stripHtml;



function clearAllSelect(sel: string) {
	document.querySelectorAll(sel).forEach(node => {
		node.remove();
	})
}

let nonce:string|undefined;
function init(e: any) {
	if (e.origin.startsWith('file://') === false) {
		throw 'SomethingWrong';
	}

	if (typeof e.data !== 'object' || typeof e.type !== 'string') {
		throw 'SomethingWrong';
	}

	switch (e.data.type) {
		case 'init':
			console.info('init');
			nonce = e.data.nonce;
			break;
		case 'js':
			const keys = new Set(['Function', ...Object.keys(globalThis)]),
				js = 'var ' +
					[...keys]
						.filter(n => {
							return !['document', 'console'].includes(n);
						})
						.map(n => n + ' = void 0')
						.join(",")
					+ ';'
			;

			clearAllSelect('head script.onMessage');
			const script = document.createElement('script');
			script.nonce = nonce;
			script.textContent = `(function(){ 'use strict'; ${js}; ${ e.data.js } }.bind(null))()`;
			script.classList.add('onMessage');
			document.head.append(script);
			break;
		case 'css':
			clearAllSelect('head style.onMessage');
			const css = document.createElement('style');
			css.nonce = nonce;
			css.textContent = e.data.css;
			css.classList.add('onMessage');
			document.head.appendChild(css);
			break;
		case 'html':
			document.body.textContent = '';
			document.body.innerHTML = stripHtml(e.data.html, {
				skipHtmlDecoding: true,
				onlyStripTags: ['html', 'head', 'script']
			}).result;
	}
}
window.addEventListener('message', init, false);