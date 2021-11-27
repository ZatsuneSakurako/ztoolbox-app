<template lang="pug">
	main.grid.no-c-gap.no-r-gap
		input#main.hidden(type='radio', name="menu", v-model='menu', value='main')
		input#codeTester.hidden(type='radio', name="menu", v-model='menu', value='code-tester')
		input#settings.hidden(type='radio', name="menu", v-model='menu', value='settings')

		div.grid-12(v-show='menu === \'main\'')
			div.grid.no-r-gap
				p.grid-4
					label(for="main_textarea_input", data-translate-id="textarea") Text area
					textarea#main_textarea_input(ref="main_textarea_input")
				p.grid-4
					input#main_input_type_text.hidden(name="main_input_type", v-model="main_input_type", value="text", type="radio")
					label.button.checkable.material-icons(for="main_input_type_text") text_fields
					input#main_input_type_url.hidden(name="main_input_type", v-model="main_input_type", value="url", type="radio")
					label.button.checkable.material-icons(for="main_input_type_url") link
					label(for="main_input", v-if="main_input_type === 'text'") Text&nbsp;:
					label(for="main_input", v-if="main_input_type === 'url'") URL&nbsp;:
					input#main_input(ref="main_input", type="url")
				p.grid-4
					label(for="main_textarea_output", data-translate-id="output") Output
					textarea#main_textarea_output(readonly, ref="main_textarea_output")
			div.grid.no-r-gap
				p.grid-4
					button.material-icons(v-on:click='onCopyTextArea') content_copy
					button.material-icons(v-on:click='onPasteTextArea') content_paste
				p.grid-4
					button(v-on:click='onStreamLink', v-if="main_input_type === 'url'") Ouvrir streamlink

		p.grid-12(v-show='menu === \'code-tester\'')
			button(v-on:click='reloadIframe', data-translate-id="runCode") Run code !

		p.grid-12(v-show='menu === \'main\'') Using Node.js {{versions.node}}, Chromium {{versions.chrome}}, and Electron {{versions.electron}} (current i18next language :&nbsp;
			span(data-translate-id='language')
			| ).
			span(v-if="!!versionState" ) Version actuelle basée sur la branche {{versionState.branch}}, commit du {{versionState.commitDate.toLocaleString()}}.

		p.grid-12(v-show='menu === \'settings\'')
			settings(:menu='menu')

		div#input1.grid-4(ref='input1', v-show='menu === \'code-tester\'')
		div#input2.grid-4(ref='input2', v-show='menu === \'code-tester\'')
		div#input3.grid-4(ref='input3', v-show='menu === \'code-tester\'')

		iframe#iframe.grid-12(ref='iframe', sandbox='allow-same-origin allow-scripts', src='iframe.html', v-show='menu === \'code-tester\'')
</template>

<script lang="ts">
	import {BridgedWindow} from "./js/bridgedWindow";

	declare var CodeMirror : any;
	declare var window : BridgedWindow;

	const editors = {
		html: '<h3>No need to write &lt;body&gt; &lt;/body&gt;</h3>',
		css: 'body {\n\tpadding: 0;\n}\nbody.red {\n\tbackground: rgba(200,0,0,0.2);\n}',
		js: 'function test(){return true;}\ndocument.body.classList.add(\'red\');console.info("test console")'
	};



	const nonce = window.znmApi.nonce();
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

		const htmlEditor = CodeMirror(this.$refs.input1, Object.assign({
			value: editors.html,
			mode: 'htmlmixed'
		}, defaultOptions));
		const cssEditor = CodeMirror(this.$refs.input2, Object.assign({
			value: editors.css,
			mode: 'css'
		}, defaultOptions));
		const jsEditor = CodeMirror(this.$refs.input3, Object.assign({
			value: editors.js,
			mode: 'javascript'
		}, defaultOptions));



		const iframe: HTMLIFrameElement = this.$refs.iframe;
		iframe.addEventListener('load', async function () {
			// const {VM} = require('vm2');

			const iframeWin = iframe.contentWindow;
			// iframeWin.VM = VM;

			iframeWin?.postMessage({
				type: 'init',
				nonce: await nonce
			}, location.href);



			try {
				editors.html = htmlEditor.getValue();
				iframeWin?.postMessage({
					type: 'html',
					html: editors.html
				}, location.href);
			} catch (e) {
				console.error(e);
			}

			try {
				editors.css = cssEditor.getValue();
				iframeWin?.postMessage({
					type: 'css',
					css: editors.css
				}, location.href);
			} catch (e) {
				console.error(e);
			}

			try {
				editors.js = jsEditor.getValue();
				iframeWin?.postMessage({
					type: 'js',
					js: editors.js
				}, location.href);
			} catch (e) {
				console.error(e);
			}
		});



		iframe.contentWindow?.location.reload();
	}





	export default {
		name: "index",
		methods: {
			nextTick() {
				return this.constructor.nextTick()
			},
			async onCopyTextArea() {
				try {
					await navigator.clipboard.writeText(this.$refs.main_textarea_input.value)
				} catch (e) {
					console.error(e);
					return;
				}

				window.znmApi.sendNotification(await window.znmApi._('textarea_copied'))
					.catch(console.error)
				;
			},
			onPasteTextArea() {
				navigator.clipboard.readText()
					.then(value => {
						this.$refs.main_textarea_input.value = value
					})
					.catch(console.error)
				;
			},
			onStreamLink() {
				window.znmApi.openStreamlink(this.$refs.main_input.value);
			},
			reloadIframe() {
				this.$refs.iframe.contentWindow.location.reload();
			}
		},
		watch: {
			menu: function (val:string) {
				if (val === 'code-tester' && !codeTesterLoaded) {
					this.nextTick()
						.then(() => {
							codeTesterLoader.call(this);
						})
						.catch(console.error)
					;
				}
			}
		},
		mounted() {
			this.$nextTick(function () {
				// Code that will run only after the
				// entire view has been rendered
				if (this.menu === 'code-tester' && !codeTesterLoaded) {
					codeTesterLoader.call(this);
				}
			});
		},
	}
</script>

<style scoped>

</style>
