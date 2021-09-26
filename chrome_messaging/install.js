const path = require('path'),
	fs = require('fs-extra')
;
const json = {
	"name": "eu.gitlab.zatsunenomokou.chromenativebridge",
	"description": "Z-Toolbox integration with native messaging support",
	"path": path.normalize(`${__dirname}/my_host.${process.platform === 'win32' ? 'bat' : 'sh'}`),
	"type": "stdio",
	"allowed_origins": [
		"chrome-extension://ecgiibibekoebbdeieihohopccibchmg/"
	]
}

fs.writeJSONSync(
	path.normalize(`${__dirname}/eu.gitlab.zatsunenomokou.chromenativebridge_${process.platform}.json`),
	json,
	{
		encoding: 'utf8',
		spaces: '\t',
		EOL: '\n'
	}
);

delete json.allowed_origins;
json.allowed_extensions = [
	"ztoolbox_dev@zatsunenomokou.eu",
];

fs.writeJSONSync(
	path.normalize(`${__dirname}/eu.gitlab.zatsunenomokou.chromenativebridge_firefox_${process.platform}.json`),
	json,
	{
		encoding: 'utf8',
		spaces: '\t',
		EOL: '\n'
	}
);

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
	const paths = {
		"chrome": {
			"darwin": {
				"global": `/Library/Google/Chrome/NativeMessagingHosts/${name}.json`,
				"user": `${home}/Library/Application Support/Google/Chrome/NativeMessagingHosts/${name}.json`
			},
			"win32": {
				"global": `HKEY_LOCAL_MACHINE\\SOFTWARE\\Google\\Chrome\\NativeMessagingHosts\\${name}`,
				"user": `HKEY_CURRENT_USER\\SOFTWARE\\Google\\Chrome\\NativeMessagingHosts\\${name}`
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
				"global": `HKEY_LOCAL_MACHINE\\SOFTWARE\\Chromium\\NativeMessagingHosts\\${name}`,
				"user": `HKEY_CURRENT_USER\\SOFTWARE\\Chromium\\NativeMessagingHosts\\${name}`
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
				"global": `HKEY_LOCAL_MACHINE\\SOFTWARE\\Mozilla\\NativeMessagingHosts\\${name}`,
				"user": `HKEY_CURRENT_USER\\SOFTWARE\\Mozilla\\NativeMessagingHosts\\${name}`
			},
			"linux": {
				"global": `/usr/lib/mozilla/native-messaging-hosts/${name}.json`,
				"user": `${home}/.mozilla/native-messaging-hosts/${name}.json`
			}
		}
	};
	return paths[browser][os][type];
}

console.dir(getInstallPath('chrome'))
console.dir(getInstallPath('chromium'))
console.dir(getInstallPath('firefox'))
console.error('WIP');
process.exit(1)