const data = {
	search: '',
	list: []
};





window.addEventListener("load", function () {
	const path = require('path'),
		Vue = require(path.resolve(__dirname, './lib/vue.js')),
		{ ipcRenderer } = require('electron'),
		removeAccents = require('remove-accents')
	;

	Vue.directive('focus', {
		inserted: function (el) {
			el.focus()
		}
	});



	const app = new Vue({
		el: 'main',
		data: data,
		methods: {
			onEnter: function() {
				if (this.filteredList.length > 0) {
					ipcRenderer.sendSync('openShortcutItem', this.filteredList[this.filteredList.keys().next().value]);
					window.close();
				}
			},
			onEscape: function() {
				window.close();
			},
			onItemTrigger: function (item) {
				ipcRenderer.sendSync('openShortcutItem', item);
				window.close();
			}
		},

		computed: {
			filteredList() {
				if (this.search.length === 0) {
					return this.list;
				}

				return this.list.filter(item => {
					return item.search.includes(removeAccents(this.search.toLowerCase())) === true
				})
			}
		}
	});

	ipcRenderer.send('getShortcuts');
	ipcRenderer.on('async-getShortcuts', (event, list) => {
		// const shortcuts = ipcRenderer.sendSync('getShortcuts');
		data.list.splice(0, data.list.length);
		Array.prototype.push.apply(data.list, list);
	})
});