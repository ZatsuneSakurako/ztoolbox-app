interface CompiledVue {
	render: Function,
	staticRenderFns: Function[]
}








window.addEventListener("load", function () {
	const indexTemplate:CompiledVue = require(__dirname + '\\' + 'index.js');
	const Vue = require('vue');

	const data = {
		menu: 'streamlink',
		message: 'Hello Vue!',
		versions: process.versions
	};

	const app = new Vue(Object.assign({
		el: 'main',
		data: data
	}, indexTemplate));
});