const path = require('path'),
	fs = require('fs-extra')
;const {promisified: regedit} = require("regedit");

const filePath = path.normalize(`${__dirname}/my_host.${process.platform === 'win32' ? 'bat' : 'js'}`);
const json = {
	"name": "eu.gitlab.zatsunenomokou.chromenativebridge",
	"description": "Z-Toolbox integration with native messaging support",
	"path": (process.platform === 'win32' ? filePath : 'node ' + JSON.stringify(filePath)),
	"type": "stdio",
	"allowed_origins": [
		"chrome-extension://ecgiibibekoebbdeieihohopccibchmg/"
	]
};

/**
 *
 * @param {"chrome"|"chromium"|"firefox"} browser
 * @return {string}
 */
function writeAndGetJsonFilePath(browser) {
	const jsonFilePath = path.normalize(`${__dirname}/eu.gitlab.zatsunenomokou.chromenativebridge_${browser === 'firefox' ? 'firefox_' : ''}${process.platform}.json`),
		_json = JSON.parse(JSON.stringify(json))
	;

	if (browser === 'firefox') {
		delete _json.allowed_origins;
		_json.allowed_extensions = [
			"ztoolbox_dev@zatsunenomokou.eu",
		];
	}

	fs.writeJSONSync(
		jsonFilePath,
		_json,
		{
			encoding: 'utf8',
			spaces: '\t',
			EOL: '\n'
		}
	);

	return jsonFilePath;
}

/**
 *
 * @see https://unpkg.com/browse/native-installer@1.0.0/paths.json
 * @param {"chrome"|"chromium"|"firefox"} browser
 * @param {"darwin"|"win32"|"linux"} os
 * @param {'user'|'global'} type
 * @return {string}
 */
function getInstallPath(browser='chrome', os='win32', type='user') {
	const home = require('os').homedir(),
		name = json.name
	;
	/*
	 * HKLM => HKEY_LOCAL_MACHINE
	 * HKCU => HKEY_CURRENT_USER
	 */
	const paths = {
		"chrome": {
			"darwin": {
				"global": `/Library/Google/Chrome/NativeMessagingHosts/${name}.json`,
				"user": `${home}/Library/Application Support/Google/Chrome/NativeMessagingHosts/${name}.json`
			},
			"win32": {
				"global": `HKLM\\SOFTWARE\\Google\\Chrome\\NativeMessagingHosts\\${name}`,
				"user": `HKCU\\SOFTWARE\\Google\\Chrome\\NativeMessagingHosts\\${name}`
			},
			"linux": {
				"global": `/etc/opt/chrome/native-messaging-hosts/${name}.json`,
				"user": `${home}/.config/google-chrome/NativeMessagingHosts/${name}.json`
			}
		},
		"chromium": {
			"darwin": {
				"global": `/Library/Application Support/Chromium/NativeMessagingHosts/${name}.json`,
				"user": `${home}/Library/Application Support/Chromium/NativeMessagingHosts/${name}.json`
			},
			"win32": {
				"global": `HKLM\\SOFTWARE\\Chromium\\NativeMessagingHosts\\${name}`,
				"user": `HKCU\\SOFTWARE\\Chromium\\NativeMessagingHosts\\${name}`
			},
			"linux": {
				"global": `/etc/chromium/native-messaging-hosts/${name}.json`,
				"user": `${home}/.config/chromium/NativeMessagingHosts/${name}.json`
			}
		},
		"firefox": {
			"darwin": {
				"global": `/Library/Application Support/Mozilla/NativeMessagingHosts/${name}.json`,
				"user": `${home}/Library/Application Support/Mozilla/NativeMessagingHosts/${name}.json`
			},
			"win32": {
				"global": `HKLM\\SOFTWARE\\Mozilla\\NativeMessagingHosts\\${name}`,
				"user": `HKCU\\SOFTWARE\\Mozilla\\NativeMessagingHosts\\${name}`
			},
			"linux": {
				"global": `/usr/lib/mozilla/native-messaging-hosts/${name}.json`,
				"user": `${home}/.mozilla/native-messaging-hosts/${name}.json`
			}
		}
	};
	return paths[browser][os][type];
}

async function install(isUninstall=false) {
	const browsers = ['chrome', 'chromium', 'firefox'];

	const addRegEdit = {};
	for (let browser of browsers) {
		const manifestPath = writeAndGetJsonFilePath(browser),
			installPath = getInstallPath(browser)
		;

		if (process.platform.startsWith('win')) {
			const regedit = require('regedit').promisified,
				regBaseDir = path.dirname(installPath)
			;

			let exists = false;
			try {
				const result = await regedit.list(regBaseDir);
				exists = result[regBaseDir].exists;
			} catch (e) {
				console.error(e);
			}
			if (exists !== true) {
				console.warn(`${browser} reg dir not found, skipping`);
				continue;
			}

			if (isUninstall) {
				await regedit.deleteKey(installPath);
			} else {
				addRegEdit[regBaseDir] = {
					[json.name]: {
						value: manifestPath,
						type: 'REG_DEFAULT'
					}
				};
			}
		} else {
			if (isUninstall) {
				if (fs.existsSync(installPath)) {
					fs.unlinkSync(installPath);
				}
			} else {
				const baseDir = path.dirname(installPath);
				if (!fs.existsSync(baseDir)) {
					fs.mkdirSync(baseDir, {
						recursive: true
					});
				}

				fs.copySync(installPath, manifestPath, {
					recursive: true
				});
			}
		}
	}

	if (!isUninstall && process.platform.startsWith('win') && [...Object.values(addRegEdit)].length) {
		await regedit.putValue(addRegEdit);
	}
}

install()
	.catch(console.error)
;
