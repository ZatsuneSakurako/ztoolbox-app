<template lang="pug">
	form(@submit.prevent="onSubmit")
		input.hidden(v-for="group in groups", type='radio', name="setting-group", :value="group", :id="'setting-group-' + group", @change="onGroupChange", :checked="group === 'default'")
		label.tab.setting-group(v-for="group in groups", :for="'setting-group-' + group", :data-translate-id="'group_' + group")

		div.pref-group(v-show="group === selected_group", v-for="(list, group) in settingsByGroup")
			div.pref-container(v-for="(conf, id) in list")
				label(:for='"pref-" + id', :data-translate-id="'preferences.' + id + '_title'", :data-translate-title="'preferences.' + id + '_description'", v-if="['button', 'color', 'string', 'integer', 'json', 'path', 'paths'].includes(conf.type)")
				input(:type="conf.type === 'string' ? 'text' : conf.type", :id='"pref-" + id', :name='id', v-if="['button', 'color', 'string'].includes(conf.type)", @change="onChange", disabled)
				input(type="text", :id='"pref-" + id', :name='id', v-if="conf.type === 'path' && conf.opts.asText", @change="onChange", disabled)
				input(:type="conf.rangeInput ? 'range' : 'number'", :min="conf.minValue === undefined ? false : conf.minValue", :max="conf.maxValue === undefined ? false : conf.maxValue", :step="conf.stepValue === undefined ? false : conf.stepValue", :id='"pref-" + id', :name='id', v-if="conf.type === 'integer'", @change="onChange", disabled)
				textarea(:id='"pref-" + id', :name='id', v-if="conf.type === 'json'", @change="onChange", disabled)

				label.button.small(:for='"pref-" + id + "_file"', :data-translate-id="Array.isArray(conf.opts.asFile) ? 'select_file' : 'select_path'", v-if="['path', 'paths'].includes(conf.type) && conf.opts.asFile")
				input.hidden(type="button", :id='"pref-" + id + "_file"', :name='id', v-if="['path', 'paths'].includes(conf.type) && conf.opts.asFile", @click="onPathSettingClick(id, conf)")

				input(type="checkbox", :id='"pref-" + id', :name='id', v-if="conf.type === 'bool'", @change="onChange", disabled)
				label(:for='"pref-" + id', :data-translate-id="'preferences.' + id + '_title'", :data-translate-title="'preferences.' + id + '_description'", v-if="conf.type === 'bool'")

				div(v-for="choice in conf.options", v-if="conf.type === 'menulist' && conf.options.length <= 3")
					input(type="radio", :id='"pref-" + id + "-" + choice.value', :name='id', :value="choice.value", @change="onChange", disabled)
					label(:for='"pref-" + id + "-" + choice.value', :data-translate-id="'preferences.' + id + '-options-' + choice.value", :data-translate-title="'preferences.' + id + '_description'")

				label(:for='"pref-" + id', :data-translate-id="'preferences.' + id + '_title'", :data-translate-title="'preferences.' + id + '_description'", v-if="conf.type === 'menulist' && conf.options.length > 3")
				select(:id='"pref-" + id', :name='id', v-if="conf.type === 'menulist' && conf.options.length > 3", @change="onChange", disabled)
					option(:value='choice.value', :data-translate-id="'preferences.' + id + '-options-' + choice.value", v-for="choice in conf.options")
</template>

<script lang="ts">
import settings from './js/settings/settings.js';
import {BridgedWindow} from "./js/bo/bridgedWindow";
import {SettingConfig, SettingsConfig} from "../classes/bo/settings.js";
import {ShowSectionEvent} from "./js/bo/showSectionEvent.js";
import {Dict} from "./js/bo/Dict";

declare var window : BridgedWindow;

async function settingsLoader() {
	const $inputs = [...document.querySelectorAll<HTMLInputElement>('[id^="pref-"]')],
		names = new Set($inputs.map(el => el.name)),
		preferenceValues = await window.znmApi.getPreferences(...names)
	;

	for (let $input of $inputs) {
		const inputName = $input.name,
			conf = settings[inputName]
		;

		if (!conf || conf.type === 'button') continue;

		const value = preferenceValues[inputName] ?? conf.value;

		setInputValue($input, value);
	}
}

function setInputValue($input:HTMLInputElement, newValue:any) {
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
		case 'text':
			$input.value = newValue;
			$input.disabled = false;
			break;
		case 'radio':
			$input.checked = $input.value === newValue;
			$input.disabled = false;
			break;
		case 'button':
			// No value to write
			break;
		default:
			console.error('Unhandled value loading', $input);
	}
}

window.znmApi.onUpdatePreference(function (preferenceId:string, newValue:any) {
	const inputs = document.querySelectorAll<HTMLInputElement>(`[id^="pref-"][name="${preferenceId}"]`);
	for (let input of inputs) {
		setInputValue(input, newValue);
	}
});

window.addEventListener("showSection", function fn(e:ShowSectionEvent) {
	if (e.detail.newSection !== 'settings') {
		return;
	}

	window.removeEventListener('showSection', fn, false);
	settingsLoader()
		.catch(console.error)
	;
});

export default {
	name: "settings",
	data: function () {
		const groups = new Set<string>(), settingsByGroup : Dict<SettingsConfig> = {};
		groups.add('default');
		for (let [, conf] of Object.entries(settings)) {
			if (conf && conf.group) {
				groups.add(conf.group);
			}
		}

		for (let [prefId, conf] of Object.entries(settings)) {
			if (!conf) continue;

			const group = conf.group ?? 'default';
			if (!settingsByGroup[group]) {
				settingsByGroup[group] = {};
			}

			const containerGroup = settingsByGroup[group];
			if (!containerGroup) throw new Error('SHOULD_NOT_HAPPEN');

			containerGroup[prefId] = conf;
		}

		return {
			selected_group: 'default',
			groups: [...groups.values()],
			settingsByGroup
		}
	},
	methods: {
		onGroupChange() {
			const $input = document.querySelector<HTMLInputElement>('input[type="radio"][name="setting-group"]:checked');
			if ($input) {
				this.$data.selected_group = $input.value;
			}
		},
		onChange(e:Event) {
			const $input = <HTMLInputElement|null> e.target;
			if (!$input) return;

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
				case 'text':
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
		/**
		 *
		 * @param prefId
		 * @param conf
		 */
		async onPathSettingClick(prefId:string, conf:SettingConfig):Promise<void> {
			if (!conf) return;
			if (conf.type !== 'path' && conf.type !== 'paths') return;

			const result = await window.znmApi.preferenceFileDialog(prefId);
			if (typeof result === 'string') {
				console.error(result);
				return;
			}
			if (result.canceled) {
				console.info('fileDialog canceled');
				return;
			}

			switch (conf.type) {
				case "path":
					const [first] = result.filePaths;
					if (first === undefined || result.filePaths.length > 1) {
						console.error(`onPathSettingClick: Unexpected nb file list ${result.filePaths.length}`);
						return;
					}

					window.znmApi.savePreference(prefId, first)
						.then(() => {
							console.info('saved :', prefId);
						})
						.catch(console.error)
					;
					break;
				case "paths":
					window.znmApi.savePreference(prefId, result.filePaths)
						.then(() => {
							console.info('saved :', prefId);
						})
						.catch(console.error)
					;
					break;
				default:
					// @ts-ignore
					console.error(`onPathSettingClick: Unexpected type ${conf.type}`);
			}
		},
		onSubmit() {
			console.debug('onSubmit');
		}
	},
	props: [
		"menu"
	]
};
</script>
