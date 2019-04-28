// noinspection JSUnresolvedFunction
const yargs = require('yargs')
	.usage('Usage: $0 [options]')

	.option('d', {
		"alias": ['dir'],
		"description": 'Do stable release',
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



(async function f() {
	const {build} = require('electron-builder');



	let buildResult = null;
	try {

		const buildOptions = {
			win: ['nsis:ia32', 'portable:ia32'],
			linux: ['deb:x64'],
			// mac: 'default', // Only supported when running from a Mac
			config: {
				"appId": "com.electron.zelectron-streamlink",
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