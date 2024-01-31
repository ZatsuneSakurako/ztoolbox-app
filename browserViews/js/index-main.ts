import {BridgedWindow} from "./bo/bridgedWindow.js";
import {ShowSectionEvent} from "./bo/showSectionEvent.js";
import {VersionState} from "../../classes/bo/versionState.js";
import {Dict} from "./bo/Dict.js";
import * as chromeNativeInstallers from "../../classes/bo/chromeNativeInstallers.js";
import {nunjuckRender} from "./nunjuckRenderHelper.js";

declare var CodeMirror : any;
declare var window : BridgedWindow;

function nonNullable<T>(element:T|null): NonNullable<T> {
	if (!element) {
		throw new Error('MISSING_INPUT');
	}
	return element;
}

const main_textarea_output = nonNullable(document.querySelector<HTMLTextAreaElement>('textarea#main_textarea_output'));



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
	chromeNativeInstallersStates?: chromeNativeInstallers.getInstallStatesResult
}
async function refreshData() {
	const $variousInfos = document.querySelector('#variousInfos');
	if (!$variousInfos || $variousInfos.classList.contains('loaded')) {
		console.info('wsClientNames update');
		const $wsClientNames = document.querySelector<HTMLUListElement>('ul#wsClientNames');
		if ($wsClientNames) {
			const elements = await nunjuckRender('_wsClientNames', {
				wsClientNames: await window.znmApi.getWsClientDatas()
			});
			$wsClientNames.replaceWith(...elements);
		}
		return;
	}
	$variousInfos.classList.add('loaded');

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
		window.znmApi.getNetConnectionAddress('zatsunenomokou.eu')
			.then(result => {
				infosData.internetAddress = result.address;
			})
			.catch(console.error)
	);
	promises.push(
		window.znmApi.chromeNative_installStates()
			.then(result => {
				infosData.chromeNativeInstallersStates = result;
			})
			.catch(console.error)
	);
	await Promise.allSettled(promises);

	const elements = await nunjuckRender('variousInfos', infosData)
	const $loader = $variousInfos.querySelector('.loader-container');
	if ($loader) {
		$loader.remove();
	}
	$variousInfos.append(...elements);
}

window.addEventListener('focus', function () {
	const input = document.querySelector<HTMLInputElement>('input[name="menu"][type="radio"]:checked');
	if (input?.value === 'infos') {
		refreshData()
			.catch(console.error)
		;
	}
});

window.addEventListener("showSection", function fn(e:ShowSectionEvent) {
	if (e.detail.newSection !== 'infos') {
		return;
	}

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






document.addEventListener('click', function digCmd(e) {
	const target = (<HTMLElement>e.target).closest<HTMLElement>('[data-dig-cmd]'),
		dataDigValue = target?.dataset.digCmd
	;
	if (!dataDigValue) return;

	window.znmApi.digCmd(dataDigValue)
		.then(result => {
			main_textarea_output.parentElement?.classList.remove('hidden');
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
