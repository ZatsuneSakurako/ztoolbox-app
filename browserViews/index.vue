<template lang="pug">
	main.grid.no-c-gap.no-r-gap
		input#main.hidden(type='radio', name="menu", v-model='menu', value='main')
		input#codeTester.hidden(type='radio', name="menu", v-model='menu', value='code-tester')
		input#settings.hidden(type='radio', name="menu", v-model='menu', value='settings')
		input#infos.hidden(type='radio', name="menu", v-model='menu', value='infos')

		div.grid-12(v-show='menu === \'main\'')
			websitesData(:websitesData='websitesData')
			div.grid.no-r-gap
				p.grid-4
					label(for="main_textarea_input", data-translate-id="textarea") Text area
					textarea#main_textarea_input(ref="main_textarea_input")
				p.grid-4
					input#main_input_type_text.hidden(name="main_input_type", v-model="main_input_type", value="text", type="radio")
					label.button.checkable.material-icons(for="main_input_type_text") text_fields
					input#main_input_type_url.hidden(name="main_input_type", v-model="main_input_type", value="url", type="radio")
					label.button.checkable.material-icons(for="main_input_type_url") link
					input#main_input_type_dns.hidden(name="main_input_type", v-model="main_input_type", value="dns", type="radio")
					label.button.checkable.material-icons(for="main_input_type_dns") dns
					label(for="main_input", v-if="main_input_type === 'text'") Text&nbsp;:
					label(for="main_input", v-if="main_input_type === 'url'") URL&nbsp;:
					label(for="main_input", v-if="main_input_type === 'dns'") DNS / IP&nbsp;:
					input#main_input(ref="main_input", :type="main_input_type === 'url' ? 'url' : 'text'")
				p.grid-4
					label(for="main_textarea_output", data-translate-id="output") Output
					textarea#main_textarea_output(readonly, ref="main_textarea_output")
			div.grid.no-r-gap
				p.grid-4
					button.material-icons(v-on:click='onCopyTextArea') content_copy
					button.material-icons(v-on:click='onPasteTextArea') content_paste
				p.grid-4
					button(v-on:click='onStreamLink', v-if="main_input_type === 'url'") Ouvrir streamlink
					button(v-on:click='onDigCmd', v-if="main_input_type === 'dns'") Dig domain

		p.grid-12(v-show='menu === \'code-tester\'')
			button(v-on:click='reloadIframe', data-translate-id="runCode") Run code !

		div.grid-12(v-show='menu === \'infos\'')
			p Using Node.js {{versions.node}}, Chromium {{versions.chrome}}, and Electron {{versions.electron}} (current i18next language :&nbsp;
				span(data-translate-id='language')
				| ).
			p(v-if="!!versionState" ) Version actuelle basée sur la branche {{versionState.branch}}, commit du {{versionState.commitDate.toLocaleString()}}.
			p(v-if="!!internetAddress") Addresse ip : {{internetAddress}}
			p(v-if="!!wsClientNames") Web extensions :
				ul.list-style-inside.list-style-disc
					li(v-for="client in wsClientNames") {{client}}

		p.grid-12(v-show='menu === \'settings\'')
			settings(:menu='menu')

		div#input1.grid-4(ref='input1', v-show='menu === \'code-tester\'')
		div#input2.grid-4(ref='input2', v-show='menu === \'code-tester\'')
		div#input3.grid-4(ref='input3', v-show='menu === \'code-tester\'')

		iframe#iframe.grid-12(ref='iframe', sandbox='allow-same-origin allow-scripts', src='iframe.html', v-show='menu === \'code-tester\'')
</template>

<script lang="ts">
import {BridgedWindow} from "./js/bridgedWindow.js";
import {ShowSectionEvent} from "./js/bo/showSectionEvent.js";
import ddgWhatIsMyIp from "./js/ddgWhatIsMyIp.js";

declare var CodeMirror : any;
declare var window : BridgedWindow;

const editors = {
	html: '<h3>No need to write &lt;body&gt; &lt;/body&gt;</h3>',
	css: 'body {\n\tpadding: 0;\n}\nbody.red {\n\tbackground: rgba(200,0,0,0.2);\n}',
	js: `function test(){return true;}
document.body.classList.add('red');
console.info("test console");

const {serialize, unserialize} = locutus.php.var;
console.dir(serialize(['test']));
console.dir(unserialize('a:1:{i:0;s:4:"test";}'));`
};



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
	window.addEventListener('message', function (e) {
		if (e.data.type === 'iframe-loaded') {
			// @ts-ignore
			const znm_init : (object:object)=>void = iframe.contentWindow?.znm_init;

			try {
				editors.html = htmlEditor.getValue();
			} catch (e) {
				console.error(e);
			}

			try {
				editors.css = cssEditor.getValue();
			} catch (e) {
				console.error(e);
			}

			try {
				editors.js = jsEditor.getValue();
			} catch (e) {
				console.error(e);
			}

			znm_init({
				type: 'init',
				html: editors.html,
				css: editors.css,
				js: editors.js
			});
		}
	}, false);



	iframe.contentWindow?.location.reload();
}





window.addEventListener("showSection", function fn(e:ShowSectionEvent) {
	if (e.detail.newSection !== 'infos') {
		return;
	}
	window.removeEventListener('showSection', fn, false);

	window.znmApi.getVersionState()
		.then(versionState => {
			window.data.versionState = versionState;
		})
		.catch(console.error)
	;
	ddgWhatIsMyIp(true)
		.then(result => {
			window.data.internetAddress = result;
		})
		.catch(console.error)
	;
	window.znmApi.getWsClientNames()
		.then(wsClientNames => {
			window.data.wsClientNames = wsClientNames;
		})
		.catch(console.error)
	;
});

window.addEventListener("showSection", function fn(e:ShowSectionEvent) {
	const val = e.detail.newSection;
	if (val === 'code-tester' && !codeTesterLoaded) {
		window.removeEventListener('showSection', fn, false);
		codeTesterLoader.call(e.detail.app);
	}
}, false);





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
		onDigCmd() {
			window.znmApi.digCmd(this.$refs.main_input.value)
				.then(result => {
					this.$refs.main_textarea_output.value = result;
				})
				.catch(console.error)
			;
		},
		reloadIframe() {
			this.$refs.iframe.contentWindow.location.reload();
		}
	}
}
</script>

<style scoped>

</style>
