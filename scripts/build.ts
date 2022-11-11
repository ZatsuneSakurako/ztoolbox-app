import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from "path";
import {build, CliOptions} from "electron-builder";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const _yargs = yargs(hideBin(process.argv))
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

		process.exit(1);
	})

	.help('h')
	.alias('h', 'help')
	.parseSync()
;



(async function() {
	let buildResult = null;
	try {
		const buildOptions:CliOptions = {
			projectDir: path.resolve(__dirname, '..'),

			win: ['nsis:x64', '7z:x64'],
			linux: ['tar.gz:x64'/*,'deb:x64'*/],
			// mac: 'default', // Only supported when running from a Mac
			config: {
				"files": [
					"!scripts/*"
				],
				"appId": "eu.gitlab.zatsunenomokou.zelectron-streamlink",
				"nsis": {
					"oneClick": false,
					"allowToChangeInstallationDirectory": true
				},
				"mac": {
					"category": "public.app-category.developer-tools"
				},
				"extraFiles": [
					{
						"from": "chrome_messaging/",
						"to": "resources/chrome_messaging",
						"filter": "*"
					},
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
						"from": "browserViews/",
						"to": "resources/browserViews",
						"filter": "*.html"
					},
					{
						"from": "browserViews/js",
						"to": "resources/browserViews/js",
						"filter": [
							"**/*.js",
							"**/*.map"
						]
					},
					{
						"from": "browserViews",
						"to": "resources/browserViews",
						"filter": [
							"*.js",
							"*.map"
						]
					},
					{
						"from": "browserViews/css",
						"to": "resources/browserViews/css",
						"filter": [
							"**/*.css",
							"**/*.map"
						]
					},
					{
						"from": "browserViews/font",
						"to": "resources/browserViews/font",
						"filter": [
							"**/*.woff2"
						]
					},
					{
						"from": "browserViews/lib/",
						"to": "resources/browserViews/lib/",
						"filter": [
							"**/*.woff",
							"**/*.woff2",
							"**/*.css",
							"**/*.js",
							"**/*.map"
						]
					}
				]
			}
		};

		if (_yargs.dir === true) {
			buildOptions.dir = false;
		}

		buildResult = await build(buildOptions);
	} catch (e) {
		console.error(e);
	}



	if (buildResult !== null) {
		console.dir(buildResult);
	}
})();