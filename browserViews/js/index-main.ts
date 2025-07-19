import {BridgedWindow} from "./bo/bridgedWindow.js";
import {ShowSectionEvent} from "./bo/showSectionEvent.js";
import {VersionState} from "../../classes/bo/versionState.js";
import {Dict} from "./bo/Dict.js";
import {nunjuckRender} from "./nunjuckRenderHelper.js";

declare var window : BridgedWindow;





interface IVariousInfosData {
	versions?: Dict<string>; // NodeJS.ProcessVersions;
	processArgv?: string[] // NodeJS.Process.argv
	versionState?: VersionState | null
	internetAddress?: string
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
		window.znmApi.getNetConnectionAddress('duckduckgo.com')
			.then(result => {
				infosData.internetAddress = result.address;
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





console.info('index-main init !');
window.addEventListener('message', function (e) {
	if (!['http://localhost:42080', 'file://'].includes(e.origin)) {
		throw new Error(`WRONG_ORIGIN "${e.origin}"`);
	}
	if (!e.data && typeof e.data !== 'object') {
		console.error('UnexpectedData', e);
		return;
	}

	console.dir(e.data);
}, {
	passive: true
});
