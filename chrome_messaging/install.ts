import path from "path";
import fs from "fs-extra";
import * as Winreg from "winreg";
import {homedir} from "os";
import Registry = require('winreg');


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

function writeAndGetJsonFilePath(browser: "chrome" | "chromium" | "firefox"): string {
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

export type browsers = "chrome" | "chromium" | "firefox";
export type osList = "darwin" | "win32" | "linux";
export type install_types = 'user' | 'global';

/**
 *
 * @see https://unpkg.com/browse/native-installer@1.0.0/paths.json
 */
function getInstallPath(browser: browsers, os?: Exclude<osList, 'win32'>, type?:'user'):string
function getInstallPath(browser: browsers, os?: "win32", type?:'global'): { container: Winreg.Registry, target: Winreg.Registry }
function getInstallPath(browser: browsers = 'chrome', os: osList = 'win32', type: install_types = 'user'): string | { container: Winreg.Registry, target: Winreg.Registry } {
	const home = homedir(),
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
			"win32": `\\SOFTWARE\\Google\\Chrome\\NativeMessagingHosts\\`,
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
			"win32": `\\SOFTWARE\\Chromium\\NativeMessagingHosts\\`,
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
			"win32": `\\SOFTWARE\\Mozilla\\NativeMessagingHosts\\`,
			"linux": {
				"global": `/usr/lib/mozilla/native-messaging-hosts/${name}.json`,
				"user": `${home}/.mozilla/native-messaging-hosts/${name}.json`
			}
		}
	};

	if (os === 'win32') {
		return {
			container: new Registry({
				hive: type === 'global' ? Registry.HKLM : Registry.HKCU,
				key: paths[browser][os]
			}),
			target: new Registry({
				hive: type === 'global' ? Registry.HKLM : Registry.HKCU,
				key: paths[browser][os] + name
			})
		}
	}
	return paths[browser][os][type];
}

async function install(isUninstall=false) {
	const browsers : browsers[] = ['chrome', 'chromium', 'firefox'];

	if (process.platform !== "darwin" && process.platform !== "win32" && process.platform !== "linux") {
		throw new Error('PLATFORM_NOT_SUPPORTED');
	}
	const platform : osList = process.platform,
		promises : Promise<void>[] = []
	;

	for (let browser of browsers) {
		const manifestPath = writeAndGetJsonFilePath(browser);

		if (platform === 'win32') {
			const installPath = getInstallPath(browser, platform);

			let exists = false;
			try {
				exists = await new Promise<boolean>((resolve, reject) => {
					installPath.container.keyExists((err, exists) => {
						if (err) {
							reject(err);
						} else {
							resolve(exists);
						}
					})
				});
			} catch (e) {
				console.error(e);
			}
			if (!exists) {
				console.warn(`${browser} reg key not found, skipping`);
				continue;
			}

			if (isUninstall) {
				const promise = new Promise<void>((resolve, reject) => {
					installPath.target.remove(json.name, err => {
						if (err) {
							reject(err);
						} else {
							resolve();
						}
					});
				});
				promise
					.catch(console.error)
				;
				promises.push(promise);
			} else {
				console.warn(`${browser} reg key found, installing`);
				const promise = new Promise<void>((resolve, reject) => {
					installPath.target.set('', Registry.REG_SZ, manifestPath, err => {
						if (err) {
							reject(err);
						} else {
							resolve();
						}
					});
				});
				promise
					.catch(console.error)
				;
				promises.push(promise);
			}
		} else {
			const installPath = getInstallPath(browser, platform);

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

	if (promises.length > 1) {
		await Promise.allSettled(promises)
			.catch(console.error)
		;
	}
}

install()
	.catch(console.error)
;
