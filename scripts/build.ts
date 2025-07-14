import * as path from "node:path";
import {build, CliOptions} from "electron-builder";

const __dirname = import.meta.dirname;



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
				"appId": "eu.zatsunenomokou.zelectron-streamlink",
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
						"from": "browserViews/",
						"to": "resources/browserViews",
						"filter": [
							"*.html",
							"*.twig"
						],
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

		if (process.env.DO_PACK) {
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
