const path = require('path'),
	Vue = require(path.resolve(__dirname, './lib/vue.js')),
	{ ipcRenderer } = require('electron')
;

const data = {
	message: 'Hello Vue!',
	versions: process.versions
};



window.addEventListener("load", function () {
	const app = new Vue({
		el: 'main',
		data: data,
		methods: {
			onStreamLink: function () {
				ipcRenderer.send('openStreamlink');
			},
			reloadIframe: function () {
				app.$refs.iframe.contentWindow.location.reload();
			}
		}
	});





	const defaultOptions = {
		indentWithTabs: true,
		lineNumbers: true,
		lineSeparator: "\n",
		lineWrapping: true
	};

	const htmlEditor = new CodeMirror(document.querySelector('#codeInputs'), Object.assign({
		value: '<h3>No need to write &lt;body&gt; &lt;/body&gt;</h3>',
		mode: 'htmlmixed'
	}, defaultOptions));
	const cssEditor = new CodeMirror(document.querySelector('#codeInputs'), Object.assign({
		value: "body {\n\tpadding: 0;\n}",
		mode: 'css'
	}, defaultOptions));
	const jsEditor = new CodeMirror(document.querySelector('#codeInputs'), Object.assign({
		value: 'function test(){return true;}',
		mode: 'javascript'
	}, defaultOptions));



	const iframe = document.querySelector('#iframe');
	iframe.addEventListener('load', function () {
		const {VM} = require('vm2'),
			stripHtml = require('string-strip-html')
		;

		const iframeWin = iframe.contentWindow;
		iframeWin.stripHtml = stripHtml;
		iframeWin.VM = VM;

		iframeWin.postMessage({
			type: 'init'
		}, location.href);



		try {
			iframeWin.postMessage({
				type: 'html',
				html: htmlEditor.getValue()
			}, location.href);
		} catch (e) {
			console.error(e);
		}

		try {
			iframeWin.postMessage({
				type: 'css',
				css: cssEditor.getValue()
			}, location.href);
		} catch (e) {
			console.error(e);
		}

		try {
			iframeWin.postMessage({
				type: 'js',
				js: jsEditor.getValue()
			}, location.href);
		} catch (e) {
			console.error(e);
		}
	});



	iframe.contentWindow.location.reload();
});