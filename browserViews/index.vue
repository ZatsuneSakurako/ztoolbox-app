<template lang="pug">
	main.grid.no-c-gap
		p.grid-12
			button(v-on:click='onStreamLink') Ouvrir streamlink
			button(v-on:click='reloadIframe') Run code !

		p.grid-12
			// All of the Node.js APIs are available in this renderer process.
			| We are using Node.js {{versions.node}}, Chromium {{versions.chrome}}, and Electron {{versions.electron}}.

		div#input1.grid-4
		div#input2.grid-4
		div#input3.grid-4

		iframe#iframe.grid-12(ref='iframe', sandbox='allow-same-origin allow-scripts', src='iframe.html')
</template>

<script>
	export default {
		name: "index"
	}
</script>

<style scoped>

</style>
