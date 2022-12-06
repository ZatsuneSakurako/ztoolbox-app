import * as Yaml from 'yaml';
import settings from './settings/settings.js';
import {BridgedWindow} from "./bo/bridgedWindow.js";
import {SettingConfig, SettingsConfig} from "../../classes/bo/settings.js";
import {ShowSectionEvent} from "./bo/showSectionEvent.js";
import {Dict} from "./bo/Dict";
import {reloadClassesFor} from "./labelChecked.js";

declare var window : BridgedWindow;

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

export const settingFormId = 'settingsForm';
export const data = {
	selected_group: 'default',
	groups: [...groups.values()],
	settingsByGroup
};

async function init() {
	const $container = document.querySelector<HTMLFormElement>(`#settingsContainer`);
	if (!$container) {
		throw new Error('CONTAINER_NOT_FOUND');
	}

	const parser = new DOMParser();
	const htmlDoc = parser.parseFromString(
		await window.znmApi.twigRender('settings', data),
		'text/html'
	);

	$container.append(...htmlDoc.body.children);
	reloadClassesFor($container)
}





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

	if (inputType === 'range') {
		const output = $input.parentElement?.querySelector('output');
		if (output) {
			output.textContent = newValue;
		}
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
		case 'text':
			$input.value = newValue;
			$input.disabled = false;
			break;
		case 'radio':
			$input.checked = $input.value === newValue;
			$input.disabled = false;
			break;
		case 'textarea':
			if ($input.dataset.type === 'yaml') {
				const value = Yaml.stringify(newValue);
				$input.value = value.trim() === '{}' ? '' : value;
			} else {
				$input.value = newValue;
			}
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
	(async () => {
		await init();
		await settingsLoader();
	})()
		.catch(console.error)
	;
});





document.addEventListener('change', function onGroupChange(e: SubmitEvent) {
	if (!e.target) return;
	const target = (<Element> e.target).closest(`#${settingFormId} [data-on-group-change]`);
	if (!target) return;

	const $input = document.querySelector<HTMLInputElement>('input[type="radio"][name="setting-group"]:checked');
	if ($input) {
		data.selected_group = $input.value;

		const groups = [...document.querySelectorAll<HTMLElement>(`#${settingFormId} [data-group-show]`)];
		for (let $group of groups) {
			const group = $group.dataset.groupShow;
			$group.classList.toggle('group-hidden', data.selected_group !== group);
		}
	}
});

document.addEventListener('input', function outputUpdate(e:Event) {
	if (!e.target) return;
	const $input = (<Element> e.target).closest<HTMLInputElement>(`#${settingFormId} input[data-on-output-update]`);
	if (!$input || $input.type !== 'range') return;

	const output = $input.parentElement?.querySelector('output');
	if (output) {
		output.textContent = $input.value;
	}
});

document.addEventListener('change', function onChange(e:Event) {
	if (!e.target) return;
	const $input = (<Element> e.target).closest<HTMLInputElement>(`#${settingFormId} input[data-on-change]`);
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
		case 'select':
			newValue = $input.value;
			break;
		case 'textarea':
			if ($input.dataset.type === 'yaml') {
				newValue = Yaml.parse($input.value.trim());
				if (newValue === null) {
					newValue = {}
				}
			} else {
				newValue = $input.value;
			}
			break;
		case 'number':
		case 'range':
			newValue = $input.valueAsNumber;
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
});

document.addEventListener('click', function (e) {
	if (!e.target) return;
	const cn = 'data-on-click-path-setting',
		$target = (<Element> e.target).closest<HTMLInputElement>(`#${settingFormId} input[${cn}]`)
	;
	if (!$target) return;

	const id = $target.dataset.onClickPathSetting;
	if (!id) return;

	const conf = settings[id];
	if (conf) {
		onPathSettingClick(id, conf)
			.catch(console.error)
		;
	}
});

/**
 *
 * @param prefId
 * @param conf
 */
async function onPathSettingClick(prefId:string, conf:SettingConfig):Promise<void> {
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
}

document.addEventListener('submit', function onSubmit(e: SubmitEvent) {
	if (!e.target) return;
	const form = (<Element> e.target).closest('#settingsForm');
	if (!form) return;

	console.debug('onSubmit');
});
