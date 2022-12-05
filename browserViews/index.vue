<template lang="pug">
	//-main.grid.no-c-gap.no-r-gap
	main.grid
		input#main.hidden(type='radio', name="menu", v-model='menu', value='main')
		input#codeTester.hidden(type='radio', name="menu", v-model='menu', value='code-tester')
		input#settings.hidden(type='radio', name="menu", v-model='menu', value='settings')
		input#infos.hidden(type='radio', name="menu", v-model='menu', value='infos')

		div.display-contents(v-show='menu === \'main\'')
			section#websitesData

		div.grid-12.grid.display-contents(v-show='menu === \'main\'')
			div.grid-3
				label(for="main_textarea_input", data-translate-id="textarea") Text area
				textarea#main_textarea_input(ref="main_textarea_input")
			div.grid-3
				input#main_input_type_text.hidden(name="main_input_type", v-model="main_input_type", value="text", type="radio")
				label.button.checkable.material-icons(for="main_input_type_text") text_fields
				input#main_input_type_dns.hidden(name="main_input_type", v-model="main_input_type", value="dns", type="radio")
				label.button.checkable.material-icons(for="main_input_type_dns") dns
				label(for="main_input", v-if="main_input_type === 'text'") Text&nbsp;:
				label(for="main_input", v-if="main_input_type === 'dns'") DNS / IP&nbsp;:
				input#main_input(ref="main_input", :type="main_input_type === 'url' ? 'url' : 'text'")
			div.grid-6.grid-row-2
				label(for="main_textarea_output", data-translate-id="output") Output
				textarea#main_textarea_output(readonly, ref="main_textarea_output")

			div.grid-3
				button.material-icons(v-on:click='onCopyTextArea') content_copy
				button.material-icons(v-on:click='onPasteTextArea') content_paste
			div.grid-3
				button(v-on:click='onDigCmd', v-if="main_input_type === 'dns'") Dig domain

		div.grid-12(v-show='menu === \'code-tester\'')
			button(v-on:click='reloadIframe', data-translate-id="runCode") Run code !

		div.grid-12(v-show='menu === \'infos\'')
			p Using Node.js {{versions.node}}, Chromium {{versions.chrome}}, and Electron {{versions.electron}} (current i18next language :&nbsp;
				span(data-translate-id='language')
				| ).
			p(v-if="!!versionState" ) Version actuelle basée sur la branche {{versionState.branch}}, commit du {{versionState.commitDate.toLocaleString()}}.
			p(v-if="!!processArgv.length") Arguments : {{processArgv.join(', ')}}
			p(v-if="!!internetAddress") Addresse ip : {{internetAddress}}
			p(v-if="!!wsClientNames") Web extensions :
				ul.list-style-inside.list-style-disc
					li(v-for="client in wsClientNames") {{client}}

		p.grid-12(v-show='menu === \'settings\'')
			settings(:menu='menu')

		div#input1.grid-4(ref='input1', v-show='menu === \'code-tester\'')
		div#input2.grid-4(ref='input2', v-show='menu === \'code-tester\'')
		div#input3.grid-4(ref='input3', v-show='menu === \'code-tester\'')

		iframe#iframe.grid-12(ref='iframe', sandbox='allow-same-origin allow-scripts', src='iframe.html', v-show='menu === \'code-tester\'')
</template>

<script lang="ts">
export default {
	name: "index"
}
</script>

<style scoped>

</style>
