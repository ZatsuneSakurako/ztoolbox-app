<template lang="pug">
	main.grid.no-c-gap.no-r-gap
		input#streamlink.hidden(type='radio', name="menu", v-model='menu', value='streamlink')
		input#codeTester.hidden(type='radio', name="menu", v-model='menu', value='code-tester')
		input#settings.hidden(type='radio', name="menu", v-model='menu', value='settings')

		p.grid-12(v-show='menu === \'streamlink\'')
			button(class='mui-btn', v-on:click='onStreamLink') Ouvrir streamlink

		p.grid-12(v-show='menu === \'code-tester\'')
			button(class='mui-btn', v-on:click='reloadIframe') Run code !

		p.grid-12(v-show='menu === \'streamlink\'')
			// All of the Node.js APIs are available in this renderer process.
			| We are using Node.js {{versions.node}}, Chromium {{versions.chrome}}, and Electron {{versions.electron}} (current i18next language :&nbsp;
			span(data-translate-id='language')
			| ).

		p.grid-12(v-show='menu === \'settings\'')
			settings(:menu='menu')

		div#input1.grid-4(ref='input1', v-show='menu === \'code-tester\'')
		div#input2.grid-4(ref='input2', v-show='menu === \'code-tester\'')
		div#input3.grid-4(ref='input3', v-show='menu === \'code-tester\'')

		iframe#iframe.grid-12(ref='iframe', sandbox='allow-same-origin allow-scripts', src='iframe.html', v-show='menu === \'code-tester\'')
</template>

<script type="module">
	const editors = {
		html: '<h3>No need to write &lt;body&gt; &lt;/body&gt;</h3>',
		css: 'body {\n\tpadding: 0;\n}\nbody.red {\n\tbackground: rgba(200,0,0,0.2);\n}',
		js: 'function test(){return true;}\ndocument.body.classList.add(\'red\');console.info("test console")'
	};



	const nonce = znmApi.nonce();
	let codeTesterLoaded = false;
	function codeTesterLoader() {
		codeTesterLoaded = true;
		const defaultOptions = {
			indentWithTabs: true,
			lineNumbers: true,
			lineSeparator: "\n",
			lineWrapping: true,
			theme: 'monokai'
		};

		const htmlEditor = new CodeMirror(this.$refs.input1, Object.assign({
			value: editors.html,
			mode: 'htmlmixed'
		}, defaultOptions));
		const cssEditor = new CodeMirror(this.$refs.input2, Object.assign({
			value: editors.css,
			mode: 'css'
		}, defaultOptions));
		const jsEditor = new CodeMirror(this.$refs.input3, Object.assign({
			value: editors.js,
			mode: 'javascript'
		}, defaultOptions));



		/**
		 *
		 * @type {HTMLIFrameElement}
		 */
		const iframe = this.$refs.iframe;
		iframe.addEventListener('load', async function () {
			// const {VM} = require('vm2');

			const iframeWin = iframe.contentWindow;
			// iframeWin.VM = VM;

			iframeWin.postMessage({
				type: 'init',
				nonce: await nonce
			}, location.href);



			try {
				editors.html = htmlEditor.getValue();
				iframeWin.postMessage({
					type: 'html',
					html: editors.html
				}, location.href);
			} catch (e) {
				console.error(e);
			}

			try {
				editors.css = cssEditor.getValue();
				iframeWin.postMessage({
					type: 'css',
					css: editors.css
				}, location.href);
			} catch (e) {
				console.error(e);
			}

			try {
				editors.js = jsEditor.getValue();
				iframeWin.postMessage({
					type: 'js',
					js: editors.js
				}, location.href);
			} catch (e) {
				console.error(e);
			}
		});



		iframe.contentWindow.location.reload();
	}





	export default {
		name: "index",
		methods: {
			nextTick() {
				return this.constructor.nextTick()
			},
			onStreamLink: function () {
				znmApi.openStreamlink();
			},
			reloadIframe: function () {
				this.$refs.iframe.contentWindow.location.reload();
			}
		},
		watch: {
			menu: function (val) {
				if (val === 'code-tester' && codeTesterLoaded === false) {
					this.nextTick()
						.then(() => {
							codeTesterLoader.call(this);
						})
						.catch(console.error)
					;
				}
			}
		}
	}
</script>

<style scoped>

</style>
