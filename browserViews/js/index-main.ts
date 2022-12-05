import {BridgedWindow} from "./bo/bridgedWindow";
import {ShowSectionEvent} from "./bo/showSectionEvent.js";
import ddgWhatIsMyIp from "./ddgWhatIsMyIp.js";

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
	window.addEventListener('message', function (e: WindowEventMap['message']) {
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

	window.znmApi.getProcessArgv()
		.then(processArgv => {
			window.data.processArgv = processArgv;
		})
		.catch(console.error)
	;
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





export function nextTick() {
	return this.constructor.nextTick()
}

export async function onCopyTextArea() {
	try {
		await navigator.clipboard.writeText(this.$refs.main_textarea_input.value)
	} catch (e) {
		console.error(e);
		return;
	}

	window.znmApi.sendNotification(await window.znmApi._('textarea_copied'))
		.catch(console.error)
	;
}

export function onPasteTextArea() {
	navigator.clipboard.readText()
		.then(value => {
			this.$refs.main_textarea_input.value = value
		})
		.catch(console.error)
	;
}

export function onDigCmd() {
	window.znmApi.digCmd(this.$refs.main_input.value)
		.then(result => {
			this.$refs.main_textarea_output.value = result;
		})
		.catch(console.error)
	;
}

export function reloadIframe() {
	this.$refs.iframe.contentWindow.location.reload();
}
