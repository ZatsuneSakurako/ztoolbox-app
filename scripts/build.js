// noinspection JSUnresolvedFunction
const yargs = require('yargs')
	.usage('Usage: $0 [options]')

	.option('d', {
		"alias": ['dir'],
		"description": 'electron builder --dir',
		"type": "boolean"
	})
	.fail(function (msg, err, yargs) {
		if(msg==="yargs error"){
			console.error(yargs.help());
		}

		process.exit(1)
	})

	.help('h')
	.alias('h', 'help')
	.argv
;



(async function() {
	const path = require('path'),
		{build} = require('electron-builder/out/index')
	;



	let buildResult = null;
	try {

		const buildOptions = {
			projectDir: path.resolve(__dirname, '..'),

			win: ['nsis:x64', '7z:x64'],
			linux: ['tar.gz:x64'/*,'deb:x64'*/],
			// mac: 'default', // Only supported when running from a Mac
			config: {
				"appId": "com.electron.zelectron-streamlink",
				"nsis": {
					"oneClick": false,
					"allowToChangeInstallationDirectory": true
				},
				"mac": {
					"category": "public.app-category.developer-tools"
				},
				"extraFiles": [
					{
						"from": "images/",
						"to": "resources/images",
						"filter": [
							"**/*.ico",
							"**/*.jpg",
							"**/*.png"
						]
					},
					{
						"from": "index.html",
						"to": "resources/"
					},
					{
						"from": "lib/",
						"to": "resources/lib/",
						"filter": [
							"**/*.js"
						]
					}
				]
			}
		};

		if (yargs.dir === true) {
			buildOptions.dir = false
		}

		buildResult = await build(buildOptions);
	} catch (e) {
		console.error(e);
	}



	if (buildResult !== null) {
		console.dir(buildResult);
	}
})();