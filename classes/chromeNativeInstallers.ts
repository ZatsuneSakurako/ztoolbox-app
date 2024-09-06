import fs from "fs-extra";
import * as Winreg from "winreg";
import Registry from "winreg";
import {homedir} from "os";
import {
	browsers,
	BrowsersOutput,
	getInstallStatesResult,
	install_types,
	installResult,
	osList
} from "./bo/chromeNativeInstallers.js";
import {WindowsRegistry} from "./WindowsRegistry.js";


/**
 *
 * @see https://unpkg.com/browse/native-installer@1.0.0/paths.json
 */
function getInstallPath(browser: browsers, os?: Exclude<osList, 'win32'>, type?:'user'):string
function getInstallPath(browser: browsers, os?: "win32", type?:'global'): WindowsRegistry
function getInstallPath(browser: browsers = 'chrome', os: osList = 'win32', type: install_types = 'user'): string | WindowsRegistry {
	const home = homedir(),
		name = "eu.zatsunenomokou.chromenativebridge"
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
			"win32": `\\SOFTWARE\\Google\\Chrome\\NativeMessagingHosts`,
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
			"win32": `\\SOFTWARE\\Chromium\\NativeMessagingHosts`,
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
			"win32": `\\SOFTWARE\\Mozilla\\NativeMessagingHosts`,
			"linux": {
				"global": `/usr/lib/mozilla/native-messaging-hosts/${name}.json`,
				"user": `${home}/.mozilla/native-messaging-hosts/${name}.json`
			}
		}
	};

	if (os === 'win32') {
		return new WindowsRegistry(new Registry({
			hive: type === 'global' ? Registry.HKLM : Registry.HKCU,
			key: `${paths[browser][os]}\\${name}`
		}));
	}
	return paths[browser][os][type];
}



export async function getInstallState(browser: browsers) : Promise<false|{ manifestPath: string, path?: string }> {
	if (process.platform !== "darwin" && process.platform !== "win32" && process.platform !== "linux") {
		throw new Error('PLATFORM_NOT_SUPPORTED');
	}

	const platform : osList = process.platform;
	if (platform === 'win32') {
		const installPath = getInstallPath(browser, platform);
		let result: Winreg.RegistryItem|undefined = undefined, path: any|undefined = undefined;

		try {
			if (!await installPath.parent.exist() || !await installPath.exist()) {
				return false;
			}

			result = await installPath.get('');
		} catch (e) {
			console.error(e);
			return false;
		}

		if (result && result.value) {
			try {
				path = fs.readJsonSync(result.value).path
			} catch (e) {
				console.error(e);
			}
		}
		if (path !== undefined && typeof path !== 'string') {
			throw new Error('UNEXPECTED_PATH_VALUE');
		}
		return {
			manifestPath: result.value,
			path
		};
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

export async function getInstallStates(): Promise<getInstallStatesResult> {
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



async function uninstallForBrowser(browser: browsers) : Promise<boolean> {
	if (process.platform !== "darwin" && process.platform !== "win32" && process.platform !== "linux") {
		throw new Error('PLATFORM_NOT_SUPPORTED');
	}

	const platform : osList = process.platform;
	if (platform === 'win32') {
		const installPath = getInstallPath(browser, platform);

		let exists = false;
		try {
			exists = await installPath.parent.exist();
		} catch (e) {
			console.error(e);
		}
		if (!exists) {
			console.warn(`${browser} reg key not found, skipping`);
			return false;
		}

		return await installPath.destroy();
	} else {
		try {
			const installPath = getInstallPath(browser, platform);
			if (fs.existsSync(installPath)) {
				fs.unlinkSync(installPath);
			}

			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}
}

/**
 * @deprecated
 * TODO delete / clear chrome native messing related lib/files
 */
export async function uninstall(): Promise<installResult> {
	const output : BrowsersOutput<boolean> = {
		chrome: false,
		chromium: false,
		firefox: false
	}
	for (let browser of browsers) {
		try {
			output[browser] = await uninstallForBrowser(browser);
		} catch (e) {
			console.error(e);
			output[browser] = false;
		}
	}
	return output;
}
