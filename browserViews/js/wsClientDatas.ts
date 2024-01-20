import {IChromeExtensionData, IWsMoveSourceData} from "../../classes/bo/chromeNative.js";
import {nunjuckRender} from "./nunjuckRenderHelper.js";
import {BridgedWindow} from "./bo/bridgedWindow";
import {Dict} from "./bo/Dict";

declare var window : BridgedWindow;

let wsClientDatas: Map<string, IChromeExtensionData>|null = null;

export async function wsClientDatasUpdate(_wsClientDatas: Dict<IChromeExtensionData>) {
	const newData = new Map<string, IChromeExtensionData>();

	const _wsClientDataEntries = Object.entries(_wsClientDatas).sort((a, b) => {
		if (!a[1] || !b[1]) return !!a[1] ? 1 : -1;
		if (a[1].browserName === b[1].browserName) return 0;
		return a[1].browserName > b[1].browserName ? 1 : -1;
	})
	for (let [id, wsClientData] of _wsClientDataEntries) {
		if (!wsClientData) continue;
		newData.set(id, wsClientData);
	}
	wsClientDatas = newData;
	await wsClientDatasDisplay()
}

const containerId = 'wsClientDatas';
async function _wsClientDatasDisplay() {
	if (!wsClientDatas) {
		return;
	}

	const container = document.querySelector('#' + containerId);
	if (!container) {
		throw new Error('#wsClientDatas not found');
	}

	const tabPageServerIp_alias = await window.znmApi.getPreferences('tabPageServerIp_alias')
		.catch(console.error)
	;
	if (tabPageServerIp_alias && 'tabPageServerIp_alias' in tabPageServerIp_alias && tabPageServerIp_alias.tabPageServerIp_alias && typeof tabPageServerIp_alias.tabPageServerIp_alias === 'object') {
		tabPageServerIp_alias.tabPageServerIp_alias;

		const tagIpAlias  = <Dict<string>>(tabPageServerIp_alias.tabPageServerIp_alias);
		for (let [, wsClientData] of wsClientDatas) {
			if (wsClientData.tabData?.ip && wsClientData.tabData.ip in tagIpAlias) {
				wsClientData.tabData.ipMore = tagIpAlias[wsClientData.tabData.ip] ?? false;
			}
		}
	}

	const elements = await nunjuckRender('_wsClientDatas', {
		wsClientDatas
	});

	const section = elements.item(0);
	if (!section || elements.length > 1) {
		throw new Error('ONE_NODE_ONLY');
	}
	section.id = containerId;
	section.classList.add('grid-12');
	container.replaceWith(section);
}

document.addEventListener('click', function (e) {
	const target = (<Element> e.target).closest<HTMLElement>('.buttonItem.wsClientDatasItem [data-open-graph]');
	if (!target) return;

	const buttonItem = target.closest<HTMLElement>('.buttonItem.wsClientDatasItem');
	if (!buttonItem) return;

	buttonItem.classList.toggle('activated');
});



let timer : ReturnType<typeof setTimeout>|null = null;
export async function wsClientDatasDisplay() {
	if (timer) {
		clearTimeout(timer);
	}

	timer = setTimeout(() => {
		timer = null;
		_wsClientDatasDisplay()
			.catch(console.error)
		;
	}, 100);
}



const appDataType = 'application/ws-client-item-url'
function dragstartHandler(target:HTMLElement, e:DragEvent) {
	if (!e.dataTransfer) {
		throw new Error('NO_DATA_TRANSFERT');
	}
	const tabDataUrl = target.dataset.tabDataUrl,
		id = target.id
	;

	// Add the target element's id to the data transfer object
	e.dataTransfer.setData(appDataType, JSON.stringify({
		id,
		tabDataUrl
	}));
	e.dataTransfer.effectAllowed = "move";
}
function dragoverHandler(target:HTMLElement, e:DragEvent) {
	if (!e.dataTransfer) {
		throw new Error('NO_DATA_TRANSFERT');
	}
	e.preventDefault();
	e.dataTransfer.dropEffect = "move";
}
function dropHandler(target:HTMLElement, e:DragEvent) {
	if (!target) return;
	if (!e.dataTransfer) {
		throw new Error('NO_DATA_TRANSFERT');
	}
	e.preventDefault();

	const transferredData = e.dataTransfer.getData(appDataType);
	let data : IWsMoveSourceData|undefined = undefined;
	try {
		data = JSON.parse(transferredData);
	} catch (e) {
		console.error(e);
	}
	if (!data || typeof data !== 'object' || !data.id || !data.tabDataUrl) {
		throw new Error('DATA_TRANSFERT_DATA_ERROR');
	}

	console.debug('Moving ', data, 'to', 'to', target.id);
	window.znmApi.moveWsClientUrl(data, target.id)
		.catch(console.error)
	;
}

document.body.addEventListener('dragstart', function (e) {
	const target = (<Element> e.target).closest<HTMLElement>('.buttonItem.wsClientDatasItem[data-tab-data-url]');
	if (target) {
		dragstartHandler(target, e);
	}
});
document.body.addEventListener('dragover', function (e) {
	const target = (<Element> e.target).closest<HTMLElement>('.buttonItem.wsClientDatasItem');
	if (target) {
		dragoverHandler(target, e);
	}
});
document.body.addEventListener('drop', function (e) {
	const target = (<Element> e.target).closest<HTMLElement>('.buttonItem.wsClientDatasItem');
	if (target) {
		dropHandler(target, e);
	}
});
