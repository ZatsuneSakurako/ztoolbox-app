// noinspection ES6UnusedImports
import Vue from 'vue';

// @ts-ignore
import indexTemplate from '../index.js';
import {loadTranslations} from "./translation-api.js";
import {themeCacheUpdate} from "./theme/theme.js";



window.addEventListener("load", async function () {
	const data = {
		menu: 'streamlink',
		message: 'Hello Vue!',
		versions: window.process.versions
	};



	const app = new window.Vue(Object.assign({
		el: 'main',
		data: data
	}, indexTemplate));

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



	function updateClassesFor(target: HTMLInputElement) {
		const nodes = [...document.querySelectorAll(`label[for="${target.id}"]`)];
		if (target.type === 'radio') {
			const radios = document.querySelectorAll(`input[type="radio"][name="${target.name}"]:not([id="${target.id}"])`);
			for (let radio of radios) {
				nodes.push(...document.querySelectorAll(`label[for="${radio.id}"]`));
			}
		}

		for (let node of <HTMLLabelElement[]>nodes) {
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