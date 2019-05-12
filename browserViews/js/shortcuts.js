const path = require('path'),
	Vue = require(path.resolve(__dirname, './lib/vue.js')),
	{ ipcRenderer } = require('electron')
;

const data = {
	search: '',
	list: []
};





window.addEventListener("load", function () {
	const app = new Vue({
		el: 'main',
		data: data,
		methods: {
			onInputSearch: function () {
				console.warn(data.search)
			}
		}
	});

	const shortcuts = ipcRenderer.sendSync('getShortcuts');
	data.list.splice(0, data.list.length);
	Array.prototype.push.apply(data.list, shortcuts.files);
});