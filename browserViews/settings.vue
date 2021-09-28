<template lang="pug">
	form(@submit.prevent="onSubmit")
		input.hidden(v-for="group in groups", type='radio', name="setting-group", :value="group", :id="'setting-group-' + group", @change="onGroupChange")
		label.tab.setting-group(v-for="group in groups", :for="'setting-group-' + group") {{group}}

		div(v-show="group === selected_group", v-for="(list, group) in settingsByGroup")
			div(v-for="conf in list")
				pre {{conf}}
</template>

<script type="module">
import settings from './js/settings/settings.js';

let settingsLoaded = false;
async function settingsLoader() {
	settingsLoaded = true;
	document.querySelector('label[for="setting-group-default"]')?.classList.add('checked');
	console.error('WIP settingsLoader');
}

export default {
	name: "settings",
	data: function () {
		const groups = new Set(), settingsByGroup = {};
		groups.add('default');
		for (let [, conf] of Object.entries(settings)) {
			if (conf.group) {
				groups.add(conf.group)
			}
		}

		for (let [prefId, conf] of Object.entries(settings)) {
			const group = conf.group ?? 'default';
			if (!settingsByGroup[group]) {
				settingsByGroup[group] = {};
			}

			settingsByGroup[group][prefId] = conf;
		}

		return {
			selected_group: 'default',
			groups: [...groups],
			settingsByGroup
		}
	},
	methods: {
		onGroupChange: function () {
			this.$data.selected_group = document.querySelector('input[type="radio"][name="setting-group"]:checked').value;
		},
		onSubmit: function () {
			console.log(arguments, this);
		}
	},
	props: [
		"menu"
	],
	watch: {
		menu: function (val) {
			if (val === 'settings' && settingsLoaded === false) {
				settingsLoader()
					.catch(console.error)
				;
			}
		}
	}
};
</script>
