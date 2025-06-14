import './index-main.js';
import './settings.js';
import {loadTranslations} from "./translation-api.js";
import {themeOnLoad, themeCacheUpdate} from "./theme/theme.js";
import {BridgedWindow} from "./bo/bridgedWindow.js";
import {ShowSectionEvent} from "./bo/showSectionEvent.js";
import {IJsonWebsiteData} from "./bo/websiteData.js";
import {WebsiteData} from "./websiteData.js";
import {Dict} from "./bo/Dict.js";
import {updateClassesFor} from "./labelChecked.js";
import {nunjuckRender} from "./nunjuckRenderHelper.js";
import {wsClientDatasDisplay, wsClientDatasUpdate} from "./wsClientDatas.js";

declare var window : BridgedWindow;



const defaultMenu = 'main';

loadTranslations()
	.catch(console.error)
;

document.addEventListener('click', function (evt) {
	const element = (<HTMLElement>evt.target).closest('[data-refresh-websites]');
	if (!element) {
		return;
	}

	const refreshButtons = [...document.querySelectorAll<HTMLButtonElement>('button[data-refresh-websites]')];
	for (let refreshButton of refreshButtons) {
		refreshButton.disabled = true;
	}

	window.znmApi.refreshWebsitesData()
		.catch(console.error)
	;
});
let enableButtonTimer:ReturnType<typeof setTimeout>|null = null;
async function loadWebsitesData(rawWebsitesData:Dict<IJsonWebsiteData>, lastUpdate:Date) {
	const container = document.querySelector('#websitesData');
	if (!container) {
		throw new Error('#websitesData not found');
	}

	// Clear array
	const websitesData : {websiteName: string, websiteData: WebsiteData|IJsonWebsiteData}[] = [];

	let count = 0;
	for (let [name, value] of Object.entries(rawWebsitesData ?? {})) {
		if (!value) continue;

		const instance = new WebsiteData();
		instance.fromJSON(value);
		websitesData.push({
			websiteName: name,
			websiteData: instance.toJSON()
		});

		count += instance.count;
	}

	let disableRefreshButton = (Date.now() - lastUpdate.getTime()) < 60 * 1000;
	if (enableButtonTimer) {
		clearTimeout(enableButtonTimer);
		enableButtonTimer = null;
	}
	const elements = await nunjuckRender('websitesData', {
		websitesData,
		lastUpdate: !isNaN(lastUpdate.getTime()) ? lastUpdate : undefined,
		disableRefreshButton
	});

	if (disableRefreshButton) {
		enableButtonTimer = setTimeout(() => {
			const refreshButtons = [...document.querySelectorAll<HTMLButtonElement>('button[data-refresh-websites]')];
			for (let refreshButton of refreshButtons) {
				refreshButton.disabled = false;
			}
		}, 60 * 1000);
	}

	const section = elements.item(0);
	if (!section || elements.length > 1) {
		throw new Error('ONE_NODE_ONLY');
	}

	section.id = 'websitesData';
	section.classList.add('grid-12');
	container.replaceWith(section);

	// @ts-ignore
	if (typeof navigator.setAppBadge === 'function') {
		// @ts-ignore
		navigator.setAppBadge(count);
	}
}
document.addEventListener('click', function (e) {
	const target = (<Element> e.target).closest<HTMLButtonElement>('button[data-login-website]');
	if (!target) return;

	target.disabled = true;
	e.preventDefault();
	e.stopImmediatePropagation();

	const website = target.dataset.loginWebsite;
	if (!website) return;

	window.znmApi.openLoginUrl(website)
		.then(result => {
			if (result) target.disabled = false;
		})
		.catch(console.error)
	;
});

themeOnLoad()
	.catch(console.error)
;

window.znmApi.onThemeUpdate(function (theme, background_color) {
	themeCacheUpdate(theme, background_color)
		.catch(console.error)
	;
});

window.znmApi.onWsClientDatasUpdate(function (wsClientDatas) {
	wsClientDatasUpdate(wsClientDatas)
		.catch(console.error)
	;
});

window.znmApi.onFocus(() => {
	wsClientDatasDisplay()
		.catch(console.error)
	;
});

document.addEventListener('click', function (e) {
	const link : HTMLLinkElement|null = (<HTMLElement>e.target).closest('a[target=_blank]');
	if (!link) return;

	window.znmApi.openExternal(link.href)
		.catch(console.error)
	;

	e.preventDefault();
	e.stopPropagation();
});

document.addEventListener('click', function (e) {
	const el = (e.target as HTMLButtonElement).closest<HTMLElement>('#gitStatus article.gitStatus:not(.disabled)');
	if (!el) return;

	el.classList.add('disabled');
	window.znmApi.doUpdate()
		.then(errors => {
			for (let error of errors) {
				console.error('[getUpdateStatus]', error);
			}
		})
		.catch(console.error);
});

async function onLoad() {
	console.info('index - onLoad');
	document.documentElement.classList.add('loaded');

	window.znmApi.onShowSection(function (sectionName:string) {
		if (!sectionName || sectionName === 'default') {
			sectionName = defaultMenu;
		}

		triggerMenu(sectionName);
	});



	window.znmApi.getPreferences('websitesData', 'websitesDataLastRefresh')
		.then(async (result) => {
			const websitesDataLastRefresh = result.websitesDataLastRefresh instanceof Date ?
				result.websitesDataLastRefresh
				:
				new Date(result.websitesDataLastRefresh as unknown as string)
			;
			if (!!result) {
				loadWebsitesData(result.websitesData as unknown as Dict<IJsonWebsiteData>, websitesDataLastRefresh)
					.catch(console.error)
				;
			}
		})
		.catch(console.error)
	;
	window.znmApi.getUpdateStatus()
		.then(async status => {
			for (let error of status.errors) {
				console.error('[getUpdateStatus]', error);
			}

			const $gitMainStatus = document.querySelector<HTMLElement>('#gitMainStatus');
			let mainHasChanges = false;
			if ($gitMainStatus) {
				const noHead = $gitMainStatus.classList.toggle('no-ahead', (status.main?.ahead ?? -1) <= 0);
				$gitMainStatus.style.setProperty('--ahead', (status.main?.ahead ?? -1).toString());

				const noBehind = $gitMainStatus.classList.toggle('no-behind', (status.main?.behind ?? -1) <= 0);
				$gitMainStatus.style.setProperty('--behind', (status.main?.behind ?? -1).toString());

				mainHasChanges = !noHead && !noBehind;
			}

			const $gitExtensionStatus = document.querySelector<HTMLElement>('#gitExtensionStatus');
			let extensionHasChanges = false;
			if ($gitExtensionStatus) {
				const noHead = $gitExtensionStatus.classList.toggle('no-ahead', (status.extension?.ahead ?? -1) <= 0);
				$gitExtensionStatus.style.setProperty('--ahead', (status.extension?.ahead ?? -1).toString());

				const noBehind = $gitExtensionStatus.classList.toggle('no-behind', (status.extension?.behind ?? -1) <= 0);
				$gitExtensionStatus.style.setProperty('--behind', (status.extension?.behind ?? -1).toString());

				extensionHasChanges = !noHead && !noBehind;
			}

			$gitMainStatus?.parentElement?.classList.toggle('has-updates', mainHasChanges || extensionHasChanges);
			$gitMainStatus?.parentElement?.classList.toggle('no-updates', !mainHasChanges && !extensionHasChanges);
		})
		.catch(console.error)
	;
	window.znmApi.getWsClientDatas()
		.then(wsClientDatas => {
			wsClientDatasUpdate(wsClientDatas)
				.catch(console.error)
			;
		})
		.catch(console.error)
	;
	window.znmApi.onWebsiteDataUpdate(function (data, lastUpdate) {
		const websitesDataLastRefresh = lastUpdate instanceof Date ?
			lastUpdate
			:
			new Date(lastUpdate as unknown as string)
		;
		loadWebsitesData(data, websitesDataLastRefresh)
			.catch(console.error)
		;
	});



	function triggerMenu(newSection:string) {
		if (!newSection || newSection === 'default') {
			newSection = defaultMenu;
		}

		const $input = document.querySelector<HTMLInputElement>(`input[name="menu"][value=${newSection}]`);
		if (!$input) {
			throw new Error(`MENU_NOT_FOUND "${newSection}"`);
		}
		if (!$input.checked) {
			$input.checked = true;
		}

		const event:ShowSectionEvent = new CustomEvent('showSection', {
			detail: {
				newSection
			}
		});
		updateMenuShown();
		updateClassesFor($input);
		window.dispatchEvent(event);
	}
	function updateMenuShown() {
		const target = document.querySelector<HTMLInputElement>('input[name="menu"][type="radio"]:checked')
		if (target) {
			const $menuShow = [...document.querySelectorAll<HTMLElement>('[data-menu-show]')];
			for (let item of $menuShow) {
				const menu = item.dataset.menuShow;
				item.style.display = menu === target.value ? '' : 'none';
			}
		}
	}

	triggerMenu(location.hash.substring(1));

	document.addEventListener('change', function onMenuChange(e) {
		const target = (<Element> e.target).closest<HTMLInputElement>('input[name="menu"][type="radio"]');
		if (!target) return;

		const newSection = target.value;
		location.hash = newSection;
		triggerMenu(newSection);
	});
}

if (document.readyState === 'complete') {
	onLoad()
		.catch(console.error)
	;
} else {
	window.addEventListener("load", onLoad);
}
