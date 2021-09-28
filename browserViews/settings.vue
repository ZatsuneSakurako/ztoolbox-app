<template lang="pug">
	form(@submit.prevent="onSubmit")
		input.hidden(v-for="group in groups", type='radio', name="setting-group", :value="group", :id="'setting-group-' + group", @change="onGroupChange")
		label.tab.setting-group(v-for="group in groups", :for="'setting-group-' + group", :data-translate-id="'group_' + group")

		div(v-show="group === selected_group", v-for="(list, group) in settingsByGroup")
			div(v-for="(conf, id) in list")
				label(:for='"pref-" + id', :data-translate-id="'preferences.' + id + '_title'", :data-translate-title="'preferences.' + id + '_description'", v-if="conf.type === 'json'")
				textarea(:id='"pref-" + id', :name='id', v-if="conf.type === 'json'", @change="onChange", disabled)

				label(:for='"pref-" + id', :data-translate-id="'preferences.' + id + '_title'", :data-translate-title="'preferences.' + id + '_description'", v-if="['button', 'color', 'string', 'integer'].includes(conf.type)")
				input(:type="conf.type === 'string' ? 'text' : conf.type", :id='"pref-" + id', :name='id', v-if="['button', 'color', 'string'].includes(conf.type)", @change="onChange", disabled)
				input(:type="conf.rangeInput ? 'range' : 'number'", :min="conf.minValue === undefined ? false : conf.minValue", :max="conf.maxValue === undefined ? false : conf.maxValue", :step="conf.stepValue === undefined ? false : conf.stepValue", :id='"pref-" + id', :name='id', v-if="conf.type === 'integer'", @change="onChange", disabled)

				input(type="checkbox", :id='"pref-" + id', :name='id', v-if="conf.type === 'bool'", @change="onChange", disabled)
				label(:for='"pref-" + id', :data-translate-id="'preferences.' + id + '_title'", :data-translate-title="'preferences.' + id + '_description'", v-if="conf.type === 'bool'")

				div(v-for="choice in conf.options", v-if="conf.type === 'menulist' && conf.options.length <= 3")
					input(type="radio", :id='"pref-" + id + "-" + choice.value', :name='id', :value="choice.value", @change="onChange", disabled)
					label(:for='"pref-" + id + "-" + choice.value', :data-translate-id="'preferences.' + id + '-options-' + choice.value", :data-translate-title="'preferences.' + id + '_description'")

				label(:for='"pref-" + id', :data-translate-id="'preferences.' + id + '_title'", :data-translate-title="'preferences.' + id + '_description'", v-if="conf.type === 'menulist' && conf.options.length > 3")
				select(:id='"pref-" + id', :name='id', v-if="conf.type === 'menulist' && conf.options.length > 3", @change="onChange", disabled)
					option(:value='choice.value', :data-translate-id="'preferences.' + id + '-options-' + choice.value", v-for="choice in conf.options")
</template>

<script type="module">
import settings from './js/settings/settings.js';

let settingsLoaded = false;
async function settingsLoader() {
	settingsLoaded = true;
	document.querySelector('label[for="setting-group-default"]')?.classList.add('checked');

	const $inputs = Array.from(document.querySelectorAll('[id^="pref-"]')),
		names = new Set($inputs.map(el => el.name)),
		preferenceValues = await window.znmApi.getPreferences(...names)
	;

	for (let $input of $inputs) {
		const inputName = $input.name,
			conf = settings[inputName]
		;

		if (!conf) continue;

		const value = preferenceValues[inputName] ?? conf.value;

		setInputValue($input, value);
	}
}

function setInputValue($input, newValue) {
	const inputName = $input.name,
		conf = settings[inputName]
	;

	if (!conf) return;

	let inputType = $input.tagName.toLowerCase();
	if (inputType === 'input') {
		inputType = $input.type;
	}

	switch (inputType) {
		case 'checkbox':
			$input.checked = !!newValue;
			$input.disabled = false;
			break;
		case 'color':
		case 'string':
			$input.value = newValue;
			$input.disabled = false;
			break;
		case 'number':
		case 'range':
		case 'select':
		case 'textarea':
			$input.value = newValue;
			$input.disabled = false;
			break;
		case 'radio':
			$input.checked = $input.value === newValue;
			$input.disabled = false;
			break;
		default:
			console.error('Unhandled value loading', $input);
	}
}

window.znmApi.onUpdatePreference(function (preferenceId, newValue) {
	const inputs = document.querySelectorAll(`[id^="pref-"][name="${preferenceId}"]`);
	for (let input of inputs) {
		setInputValue(input, newValue);
	}
})

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
		onChange: function (e) {
			const $input = e.target;

			let inputType = $input.tagName.toLowerCase();
			if (inputType === 'input') {
				inputType = $input.type;
			}

			let newValue;
			switch (inputType) {
				case 'checkbox':
					newValue = $input.checked;
					break;
				case 'color':
				case 'string':
					newValue = $input.value;
					break;
				case 'number':
				case 'range':
				case 'select':
				case 'textarea':
					newValue = $input.value;
					break;
				case 'radio':
					newValue = $input.value;
					break;
				default:
					console.error('Unhandled value loading', $input);
			}

			if (newValue !== undefined) {
				window.znmApi.savePreference($input.name, newValue)
					.then(() => {
						console.info('saved :', $input.name);
					})
					.catch(console.error)
				;
			}
		},
		onSubmit: function () {
			console.debug('onSubmit');
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
