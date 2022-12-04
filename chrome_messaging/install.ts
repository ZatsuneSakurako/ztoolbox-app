import path from "path";
import fs from "fs-extra";
import * as Winreg from "winreg";
import {homedir} from "os";
import Registry from 'winreg';
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const filePath = path.normalize(`${__dirname}/my_host.${process.platform === 'win32' ? 'bat' : 'js'}`);
const json = {
	"name": "eu.gitlab.zatsunenomokou.chromenativebridge",
	"description": "Z-Toolbox integration with native messaging support",
	"path": (process.platform === 'win32' ? filePath : 'node ' + JSON.stringify(filePath)),
	"type": "stdio",
	"allowed_origins": [
		"chrome-extension://ecgiibibekoebbdeieihohopccibchmg/",
		"chrome-extension://gojepdjljocnjlifemonhphjnafigcfe/"
	]
};

function getJsonFilePath(browser: browsers) {
	return path.normalize(`${__dirname}/eu.gitlab.zatsunenomokou.chromenativebridge_${browser === 'firefox' ? 'firefox_' : ''}${process.platform}.json`);
}

function writeAndGetJsonFilePath(browser: browsers): string {
	const jsonFilePath = getJsonFilePath(browser),
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



export const browsers : readonly browsers[] = Object.freeze(['chrome', 'chromium', 'firefox']);
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

type BrowsersOutput<T> = {
	[key in browsers]: T
}

export async function getInstallState(browser: browsers) : Promise<false|{ manifestPath: string, path?: string }> {
	if (process.platform !== "darwin" && process.platform !== "win32" && process.platform !== "linux") {
		throw new Error('PLATFORM_NOT_SUPPORTED');
	}

	const platform : osList = process.platform;
	if (platform === 'win32') {
		const installPath = getInstallPath(browser, platform);
		try {
			return await new Promise((resolve, reject) => {
				installPath.target.get(json.name, (err, result) => {
					if (err) {
						console.error(err);
						resolve(false);
					} else {
						let path;
						try {
							path = JSON.parse(result.value).path
						} catch (e) {
							console.error(e);
						}

						if (path !== undefined && typeof path !== 'string') {
							reject('UNEXPECTED_PATH_VALUE');
							return;
						}
						resolve({
							manifestPath: result.value,
							path
						});
					}
				});
			});
		} catch (e) {
			console.error(e);
		}
	} else {
		const installPath = getInstallPath(browser, platform);
		if (fs.existsSync(installPath)) {
			let path;
			try {
				path = JSON.parse(installPath).path
			} catch (e) {
				console.error(e);
			}
			if (path !== undefined && typeof path !== 'string') {
				throw new Error('UNEXPECTED_PATH_VALUE');
			}
			return {
				manifestPath: installPath,
				path
			};
		}
	}

	return false;
}

export async function getInstallStates(): Promise<BrowsersOutput<{ manifestPath: string, path?: string }|false>> {
	const output : BrowsersOutput<{ manifestPath: string, path?: string }|false> = {
		chrome: false,
		chromium: false,
		firefox: false
	};
	for (let browser of browsers) {
		output[browser] = await getInstallState(browser);
	}
	return output;
}





async function installForBrowser(browser: browsers, isUninstall=false) : Promise<boolean> {
	if (process.platform !== "darwin" && process.platform !== "win32" && process.platform !== "linux") {
		throw new Error('PLATFORM_NOT_SUPPORTED');
	}

	const platform : osList = process.platform,
		manifestPath = writeAndGetJsonFilePath(browser)
	;

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
			return false;
		}

		if (isUninstall) {
			return await new Promise<boolean>(resolve => {
				installPath.target.remove(json.name, err => {
					console.error(err);
					resolve(!err);
				});
			});
		} else {
			console.warn(`${browser} reg key found, installing`);
			return await new Promise<boolean>(resolve => {
				installPath.target.set('', Registry.REG_SZ, manifestPath, err => {
					console.error(err);
					resolve(!err);
				});
			});
		}
	} else {
		try {
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

				fs.symlinkSync(installPath, manifestPath);
			}

			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}
}
export async function install(isUninstall=false): Promise<BrowsersOutput<boolean>> {
	const output : BrowsersOutput<boolean> = {
		chrome: false,
		chromium: false,
		firefox: false
	}
	for (let browser of browsers) {
		try {
			output[browser] = await installForBrowser(browser, isUninstall);
		} catch (e) {
			console.error(e);
			output[browser] = false;
		}
	}
	return output;
}

install()
	.catch(console.error)
;
