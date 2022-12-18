import {BridgedWindow} from "./bo/bridgedWindow";
import {ShowSectionEvent} from "./bo/showSectionEvent.js";
import ddgWhatIsMyIp from "./ddgWhatIsMyIp.js";
import {VersionState} from "../../classes/bo/versionState";
import {Dict} from "./bo/Dict";

declare var CodeMirror : any;
declare var window : BridgedWindow;

function nonNullable<T>(element:T|null): NonNullable<T> {
	if (!element) {
		throw new Error('MISSING_INPUT');
	}
	return element;
}

const main_input = nonNullable(document.querySelector<HTMLInputElement>('input#main_input')),
	main_textarea_input = nonNullable(document.querySelector<HTMLTextAreaElement>('textarea#main_textarea_input')),
	main_textarea_output = nonNullable(document.querySelector<HTMLTextAreaElement>('textarea#main_textarea_output'))
;



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

	const htmlEditor = CodeMirror(document.querySelector('#input1'), Object.assign({
		value: editors.html,
		mode: 'htmlmixed'
	}, defaultOptions));
	const cssEditor = CodeMirror(document.querySelector('#input2'), Object.assign({
		value: editors.css,
		mode: 'css'
	}, defaultOptions));
	const jsEditor = CodeMirror(document.querySelector('#input3'), Object.assign({
		value: editors.js,
		mode: 'javascript'
	}, defaultOptions));



	const iframe = nonNullable(document.querySelector<HTMLIFrameElement>('iframe'));
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





interface IVariousInfosData {
	versions?: Dict<string>; // NodeJS.ProcessVersions;
	processArgv?: string[] // NodeJS.Process.argv
	versionState?: VersionState | null
	internetAddress?: string
	wsClientNames?: string[]
}
async function refreshData() {
	const $variousInfos = document.querySelector('#variousInfos');
	if (!$variousInfos) return;

	const infosData : IVariousInfosData = {},
		promises : Promise<any>[] = []
	;

	infosData.versions = window.process.versions;
	promises.push(
		window.znmApi.getProcessArgv()
			.then(result => {
				infosData.processArgv = result;
			})
			.catch(console.error)
	);
	promises.push(
		window.znmApi.getVersionState()
			.then(result => {
				infosData.versionState = result;
			})
			.catch(console.error)
	);
	promises.push(
		ddgWhatIsMyIp(true)
			.then(result => {
				infosData.internetAddress = result;
			})
			.catch(console.error)
	);
	promises.push(
		window.znmApi.getWsClientNames()
			.then(result => {
				infosData.wsClientNames = result;
			})
			.catch(console.error)
	);
	await Promise.allSettled(promises);

	const parser = new DOMParser();
	const htmlDoc = parser.parseFromString(
		await window.znmApi.twigRender('variousInfos', infosData),
		'text/html'
	);
	$variousInfos.append(...htmlDoc.body.children);
}

window.addEventListener("showSection", function fn(e:ShowSectionEvent) {
	if (e.detail.newSection !== 'infos') {
		return;
	}
	window.removeEventListener('showSection', fn, false);

	refreshData()
		.catch(console.error)
	;
});

window.addEventListener("showSection", function fn(e:ShowSectionEvent) {
	const val = e.detail.newSection;
	if (val === 'code-tester' && !codeTesterLoaded) {
		window.removeEventListener('showSection', fn, false);
		codeTesterLoader();
	}
}, false);

document.addEventListener('change', function onMenuChange(e) {
	const target = (<Element> e.target).closest<HTMLInputElement>('input[name="main_input_type"][type="radio"]');
	if (!target) return;

	if (main_input) {
		const onMainInputs = [...document.querySelectorAll<HTMLElement>('[data-main-input]')];
		for (let element of onMainInputs) {
			const value = element.dataset.mainInput
			element.classList.toggle('hidden', value !== target.value);
		}
	}
});





async function onCopyTextArea(isCut:boolean) {
	try {
		await navigator.clipboard.writeText(main_textarea_input.value);
		if (isCut) {
			main_textarea_input.value = '';
		}
	} catch (e) {
		console.error(e);
		return;
	}

	window.znmApi.sendNotification(await window.znmApi._(isCut ? 'textarea_clipped' : 'textarea_copied'))
		.catch(console.error)
	;
}

document.addEventListener('click', function(e) {
	const target = (<HTMLElement>e.target).closest<HTMLElement>('#copyTextArea,#cutTextArea');
	if (!target) return;

	onCopyTextArea(target.id === 'cutTextArea')
		.catch(console.error)
	;
});

document.addEventListener('click', function onPasteTextArea(e) {
	const target = (<HTMLElement>e.target).closest<HTMLElement>('#pasteTextArea');
	if (!target) return;

	navigator.clipboard.readText()
		.then(value => {
			main_textarea_input.value = value
		})
		.catch(console.error)
	;
});


document.addEventListener('click', function digCmd(e) {
	const target = (<HTMLElement>e.target).closest<HTMLElement>('#digCmd');
	if (!target) return;

	window.znmApi.digCmd(main_input.value)
		.then(result => {
			main_textarea_output.value = result;
		})
		.catch(console.error)
	;
});

document.addEventListener('click', function reloadIframe(e) {
	const target = (<HTMLElement>e.target).closest<HTMLElement>('[data-reload-iframe]');
	if (!target) return;

	const $iframe = document.querySelector<HTMLIFrameElement>('iframe#iframe');
	if ($iframe && $iframe.contentWindow) {
		$iframe.contentWindow.location.reload();
	}
});
