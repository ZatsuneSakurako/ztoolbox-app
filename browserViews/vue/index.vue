<template lang="pug">
	main
		p
			button(v-on:click='onStreamLink') Ouvrir streamlink
			button(v-on:click='reloadIframe') Run code !

		p
			// All of the Node.js APIs are available in this renderer process.
			| We are using Node.js {{versions.node}}, Chromium {{versions.chrome}}, and Electron {{versions.electron}}.

		div#codeInputs
		iframe#iframe(ref='iframe', sandbox='allow-same-origin allow-scripts', src='iframe.html')
</template>
