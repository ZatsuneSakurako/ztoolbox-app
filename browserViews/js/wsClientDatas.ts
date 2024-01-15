import {IChromeExtensionData} from "../../classes/bo/chromeNative.js";
import {nunjuckRender} from "./nunjuckRenderHelper.js";
import {BridgedWindow} from "./bo/bridgedWindow";
import {Dict} from "./bo/Dict";

declare var window : BridgedWindow;

let wsClientDatas: IChromeExtensionData[]|null = null;

export async function wsClientDatasUpdate(_wsClientDatas: IChromeExtensionData[]) {
	wsClientDatas = _wsClientDatas;
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

	wsClientDatas.sort((a, b) => {
		if (a.browserName === b.browserName) return 0;
		return a.browserName > b.browserName ? 1 : -1;
	});

	const tabPageServerIp_alias = await window.znmApi.getPreferences('tabPageServerIp_alias')
		.catch(console.error)
	;
	if (tabPageServerIp_alias && 'tabPageServerIp_alias' in tabPageServerIp_alias && tabPageServerIp_alias.tabPageServerIp_alias && typeof tabPageServerIp_alias.tabPageServerIp_alias === 'object') {
		tabPageServerIp_alias.tabPageServerIp_alias;

		const tagIpAlias  = <Dict<string>>(tabPageServerIp_alias.tabPageServerIp_alias);
		for (let wsClientData of wsClientDatas) {
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
	const target = (<Element> e.target).closest<HTMLElement>('.buttonItem.wsClientDatasItem');
	if (!target) return;

	const currentState = target.classList.contains('activated');
	target.classList.toggle('activated', !currentState);
})



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