// noinspection ES6UnusedImports
import Vue from 'vue';

// @ts-ignore
import indexTemplate from '../index.js';
// @ts-ignore
import settingsTemplate from '../settings.js';
import {loadTranslations} from "./translation-api.js";
import {themeCacheUpdate} from "./theme/theme.js";
import {BridgedWindow} from "./bridgedWindow";

declare var window : BridgedWindow;



window.addEventListener("load", async function () {
	const data = {
		menu: 'streamlink',
		message: 'Hello Vue!',
		versions: window.process.versions
	};
	if (location.hash.length > 1) {
		data.menu = location.hash.substring(1);
	}
	window.znmApi.onShowSection(function (sectionName:string) {
		data.menu = sectionName;
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

	loadTranslations()
		.catch(console.error)
	;
	themeCacheUpdate()
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