// noinspection ES6UnusedImports
import Vue from 'vue';

// @ts-ignore
import indexTemplate from '../index.js';
// @ts-ignore
import settingsTemplate from '../settings.js';
import {loadTranslations} from "./translation-api.js";
import {themeOnLoad, themeCacheUpdate} from "./theme/theme.js";
import {BridgedWindow} from "./bridgedWindow";
import {VersionState} from "../../classes/bo/versionState";

declare var window : BridgedWindow;


interface IData {
	main_input_type: string;
	menu: string;
	message: string;
	versions: NodeJS.ProcessVersions;
	versionState: VersionState | null;
}

const defaultMenu = 'main';
const data: IData = {
	main_input_type: 'url',
	menu: defaultMenu,
	message: 'Hello Vue!',
	versions: window.process.versions,
	versionState: null
};

if (location.hash.length > 1) {
	data.menu = location.hash.substring(1);
	if (data.menu === 'default') {
		data.menu = defaultMenu;
	}
}

loadTranslations()
	.catch(console.error)
;

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

window.addEventListener("load", async function () {
	window.znmApi.getVersionState()
		.then(versionState => {
			data.versionState = versionState;
		})
		.catch(console.error)
	;

	window.znmApi.onShowSection(function (sectionName:string) {
		data.menu = data.menu === 'default' ? defaultMenu : sectionName;
		setTimeout(() => {
			const $input = document.querySelector<HTMLInputElement>(`input[type="radio"][name="menu"][id="${sectionName}"]`);
			if ($input) {
				updateClassesFor($input);
			}
		});
	});



	window.Vue.component('settings', settingsTemplate);
	const app = new window.Vue(Object.assign({
		el: 'main',
		data: data
	}, indexTemplate));

	app.$watch('menu', function (val:string) {
		location.hash = val;
	});



	function updateClassesFor(target: HTMLInputElement) {
		const nodes: HTMLLabelElement[] = [...document.querySelectorAll<HTMLLabelElement>(`label[for="${target.id}"]`)];
		if (target.type === 'radio') {
			const radios = document.querySelectorAll(`input[type="radio"][name="${target.name}"]:not([id="${target.id}"])`);
			for (let radio of radios) {
				nodes.push(...document.querySelectorAll<HTMLLabelElement>(`label[for="${radio.id}"]`));
			}
		}

		for (let node of nodes) {
			node.classList.toggle('checked', (<HTMLInputElement|null> node.control)?.checked);
		}
	}
	document.addEventListener('change', function (e) {
		const target = (<Element> e.target).closest<HTMLInputElement>('input[type="checkbox"][id],input[type="radio"][id]');
		if (!target) return;

		updateClassesFor(target);
	});
	setTimeout(() => {
		for (let node of document.querySelectorAll('input[type="checkbox"][id],input[type="radio"][id]')) {
			updateClassesFor(<HTMLInputElement> node);
		}
	});
});