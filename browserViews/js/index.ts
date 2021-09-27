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
});