import {BridgedWindow} from "./bo/bridgedWindow.js";
import {ShowSectionEvent} from "./bo/showSectionEvent.js";
import {VersionState} from "../../classes/bo/versionState.js";
import {Dict} from "./bo/Dict.js";
import * as chromeNativeInstallers from "../../classes/bo/chromeNativeInstallers.js";
import {nunjuckRender} from "./nunjuckRenderHelper.js";
import {IEditorData} from "./bo/iframe.js";

declare var window : BridgedWindow;

function nonNullable<T>(element:T|null): NonNullable<T> {
	if (!element) {
		throw new Error('MISSING_INPUT');
	}
	return element;
}



let codeTesterLoaded = false;
function codeTesterLoader() {
	codeTesterLoaded = true;
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





console.info('index-main init !');
const editors: IEditorData = {
	files: [
		{
			name: 'app.html',
			content: '<h3>No need to write &lt;body&gt; &lt;/body&gt;</h3>'
		},
		{
			name: 'app.css',
			content: 'body {\n\tpadding: 0;\n}\nbody.red {\n\tbackground: rgba(200,0,0,0.2);\n}'
		},
		{
			name: 'app.js',
			content: `function test(){return true;}
document.body.classList.add('red');
console.info("test console");

import * as uuid from 'https://jspm.dev/uuid';
console.info('uuid v4 :', uuid.v4());

const MY_NAMESPACE = window.localStorage.getItem('NAMESPACE') || uuid.v4(); // Or replace with a static uuid
console.info(
	'uuid v5 (sha1) :',
	uuid.v5('Lorem Ipsum', MY_NAMESPACE)
);
`,
		},
	],
	libs: [
		'lodash',
		'dayjs',
	]
};
window.addEventListener('message', function (e) {
	if (!['http://localhost:42080', 'file://'].includes(e.origin)) {
		throw new Error(`WRONG_ORIGIN "${e.origin}"`);
	}
	if (!e.data && typeof e.data !== 'object') {
		console.error('UnexpectedData', e);
		return;
	}

	switch (e.data.type) {
		case 'export-data':
			editors.libs = e.data.links;
			editors.files = e.data.files;
			console.debug(editors);
			break;
		case 'iframe-init':
			const $iframe = document.querySelector<HTMLIFrameElement>('iframe#iframe');
			if (!$iframe?.contentWindow) {
				throw new Error('IFRAME_NOT_FOUND');
			}
			$iframe.contentWindow.postMessage({
				type: 'loadData',
				editors
			}, '*');
			break;
	}
}, {
	passive: true
});
