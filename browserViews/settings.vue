<template lang="pug">
	form#settingsForm()
		input.hidden(v-for="group in groups", type='radio', name="setting-group", :value="group", :id="'setting-group-' + group", data-on-group-change='', :checked="group === 'default'")
		label.tab.setting-group(v-for="group in groups", :for="'setting-group-' + group", :data-translate-id="'group_' + group")

		div.pref-group(v-show="group === selected_group", v-for="(list, group) in settingsByGroup")
			div.pref-container(v-for="(conf, id) in list")
				label(:for='"pref-" + id', :data-translate-id="'preferences.' + id + '_title'", :data-translate-title="'preferences.' + id + '_description'", v-if="['button', 'color', 'string', 'integer', 'json', 'yaml', 'path', 'paths'].includes(conf.type)")
				input(:type="conf.type === 'string' ? 'text' : conf.type", :id='"pref-" + id', :name='id', v-if="['button', 'color', 'string'].includes(conf.type)", data-on-change="", disabled)
				input(type="text", :id='"pref-" + id', :name='id', v-if="conf.type === 'path' && conf.opts.asText", data-on-change="", disabled)
				input(:type="conf.rangeInput ? 'range' : 'number'", :min="conf.minValue === undefined ? false : conf.minValue", :max="conf.maxValue === undefined ? false : conf.maxValue", :step="conf.stepValue === undefined ? false : conf.stepValue", :id='"pref-" + id', :name='id', v-if="conf.type === 'integer'", data-on-change="", data-on-output-update="", disabled)
				textarea.auto-height(:id='"pref-" + id', :name='id', v-if="['json', 'yaml'].includes(conf.type)", data-on-change="", disabled, :data-type="conf.type")
				output.output(:for='"pref-" + id', v-if="conf.type === 'integer' && !!conf.rangeInput")

				label.button.small(:for='"pref-" + id + "_file"', :data-translate-id="Array.isArray(conf.opts.asFile) ? 'select_file' : 'select_path'", v-if="['path', 'paths'].includes(conf.type) && conf.opts.asFile")
				input.hidden(type="button", :id='"pref-" + id + "_file"', :name='id', v-if="['path', 'paths'].includes(conf.type) && conf.opts.asFile", :data-on-click-path-setting="id", @click="onPathSettingClick(id, conf)")

				input(type="checkbox", :id='"pref-" + id', :name='id', v-if="conf.type === 'bool'", data-on-change="", disabled)
				label(:for='"pref-" + id', :data-translate-id="'preferences.' + id + '_title'", :data-translate-title="'preferences.' + id + '_description'", v-if="conf.type === 'bool'")

				div(v-for="choice in conf.options", v-if="conf.type === 'menulist' && conf.options.length <= 3")
					input(type="radio", :id='"pref-" + id + "-" + choice.value', :name='id', :value="choice.value", data-on-change="", disabled)
					label(:for='"pref-" + id + "-" + choice.value', :data-translate-id="'preferences.' + id + '-options-' + choice.value", :data-translate-title="'preferences.' + id + '_description'")

				label(:for='"pref-" + id', :data-translate-id="'preferences.' + id + '_title'", :data-translate-title="'preferences.' + id + '_description'", v-if="conf.type === 'menulist' && conf.options.length > 3")
				select(:id='"pref-" + id', :name='id', v-if="conf.type === 'menulist' && conf.options.length > 3", data-on-change="", disabled)
					option(:value='choice.value', :data-translate-id="'preferences.' + id + '-options-' + choice.value", v-for="choice in conf.options")
</template>

<script lang="ts">
import {data} from "./js/settings.js";
export default {
	name: "settings",
	data: function () {
		return data
	}
};
</script>
