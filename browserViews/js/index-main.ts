import {BridgedWindow} from "./bo/bridgedWindow.js";
import {ShowSectionEvent} from "./bo/showSectionEvent.js";
import {Dict} from "./bo/Dict.js";
import {nunjucksRender} from "./nunjucksRenderHelper.js";

declare var window : BridgedWindow;





async function refreshData() {
	const data = {
		versions: window.process.versions,
		getProcessArgv : <string[]>[],
	}
	try {
		data.getProcessArgv = await window.znmApi.getProcessArgv();
	} catch (e) {
		console.error(e);
	}
	console.log(data);
}

refreshData()
	.catch(console.error)
;

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
