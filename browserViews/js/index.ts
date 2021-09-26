// noinspection ES6UnusedImports
import Vue from 'vue';

// @ts-ignore
import indexTemplate from '../index.js';



window.addEventListener("load", async function () {
	const data = {
		menu: 'menu-streamlink',
		message: 'Hello Vue!',
		versions: window.process.versions
	};



	document.addEventListener('mui.tabs.showend', function (e) {
		const $e = (<HTMLElement> e.target).closest('[data-mui-controls^="menu-"]');
		if (!$e) return;

		data.menu = (<HTMLElement>$e).dataset.muiControls;
	});



	const app = new window.Vue(Object.assign({
		el: 'main',
		data: data
	}, indexTemplate));
});