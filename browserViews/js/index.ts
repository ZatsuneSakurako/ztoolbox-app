import Vue from 'vue';

// @ts-ignore
import indexTemplate from '../index.js';

import {nextTick, onPasteTextArea, onCopyTextArea, onDigCmd, reloadIframe} from './index-main.js';
import './settings.js';
import {loadTranslations} from "./translation-api.js";
import {themeOnLoad, themeCacheUpdate} from "./theme/theme.js";
import {BridgedWindow} from "./bo/bridgedWindow";
import {ShowSectionEvent} from "./bo/showSectionEvent";
import {IData} from "./bo/IData";
import {IJsonWebsiteData} from "./bo/websiteData";
import {WebsiteData} from "./websiteData.js";
import {Dict} from "./bo/Dict";
import {updateClassesFor} from "./labelChecked.js";

declare var window : BridgedWindow;



const defaultMenu = 'main';
const data: IData = {
	main_input_type: 'dns',
	menu: defaultMenu,
	message: 'Hello Vue!',
	versions: window.process.versions,
	internetAddress: null,
	processArgv: [],
	versionState: null,
	wsClientNames: []
};

if (location.hash.length > 1) {
	data.menu = location.hash.substring(1);
	if (data.menu === 'default') {
		data.menu = defaultMenu;
	}
}
window.data = data;

loadTranslations()
	.catch(console.error)
;

async function loadWebsitesData(rawWebsitesData:Dict<IJsonWebsiteData>) {
	const container = document.querySelector('#websitesData');
	if (!container) {
		throw new Error('#websitesData not found');
	}

	// Clear array
	const websitesData : {websiteName: string, websiteData: WebsiteData|IJsonWebsiteData}[] = [];

	let count = 0;
	for (let [name, value] of Object.entries(rawWebsitesData)) {
		if (!value) continue;

		const instance = new WebsiteData();
		instance.fromJSON(value);
		websitesData.push({
			websiteName: name,
			websiteData: instance.toJSON()
		});

		count += instance.count;
	}

	const parser = new DOMParser();
	const htmlDoc = parser.parseFromString(
		await window.znmApi.twigRender('websitesData', {
			websitesData
		}),
		'text/html'
	);

	const section = htmlDoc.body.children.item(0);
	if (!section || htmlDoc.body.children.length > 1) {
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

themeOnLoad()
	.then(styleTheme => {
		if (styleTheme) {
			document.head.append(styleTheme);
		}
	})
	.catch(console.error)
;

window.znmApi.onThemeUpdate(function (theme, background_color) {
	themeCacheUpdate(theme, background_color)
		.catch(console.error)
	;
})

document.addEventListener('click', function (e) {
	const link : HTMLLinkElement|null = (<HTMLElement>e.target).closest('a[target=_blank]');
	if (!link) return;

	window.znmApi.openExternal(link.href)
		.catch(console.error)
	;

	e.preventDefault();
	e.stopPropagation();
});

async function onLoad() {
	window.znmApi.onShowSection(function (sectionName:string) {
		data.menu = data.menu === 'default' ? defaultMenu : sectionName;
		setTimeout(() => {
			const $input = document.querySelector<HTMLInputElement>(`input[type="radio"][name="menu"][id="${sectionName}"]`);
			if ($input) {
				triggerMenu(sectionName);
				updateClassesFor($input);
			}
		});
	});



	// @ts-ignore
	const app = new Vue({
		el: 'main',
		data: data,
		render: indexTemplate.render,
		staticRenderFns: indexTemplate.staticRenderFns,
		methods: {
			nextTick,
			onPasteTextArea,
			onCopyTextArea,
			onDigCmd,
			reloadIframe
		}
	});


	window.znmApi.getPreferences('websitesData')
		.then(async (result) => {
			if (!!result) {
				loadWebsitesData(result.websitesData as unknown as Dict<IJsonWebsiteData>)
					.catch(console.error)
				;
			}
		})
		.catch(console.error)
	;
	window.znmApi.onWebsiteDataUpdate(function (data) {
		loadWebsitesData(data)
			.catch(console.error)
		;
	});



	function triggerMenu(newSection:string) {
		const event:ShowSectionEvent = new CustomEvent('showSection', {
			detail: {
				newSection,
				app
			}
		});
		updateMenuShown();
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
	triggerMenu(data.menu);
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