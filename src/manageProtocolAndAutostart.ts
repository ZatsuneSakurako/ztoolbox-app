/*
 * Arguments taken from :
 * https://stackoverflow.com/questions/45570589/electron-protocol-handler-not-working-on-windows#53786254
 */
import shell from "shelljs";
import ProtocolRegistry from "protocol-registry";
import {
	appRootPath,
	autoStartArgument,
	zToolbox_protocol,
	linuxAutoStartAppPath,
	appName
} from "../classes/constants.js";
import {app} from "electron";
import * as path from "node:path";
import {showSection} from "../classes/windowManager.js";
import {sendNotification} from "../classes/notify.js";
import {settings} from "./init.js";
import fs from "node:fs";



if (app.requestSingleInstanceLock()) {
	app.on('second-instance', (_event, commandLine, _workingDirectory) => {
		// Quelqu'un a tenté d'exécuter une seconde instance.
		onOpen(commandLine);
	});
} else {
	app.quit();
	process.exit();
}

app.setName('Z-ToolBox');
if (app.isDefaultProtocolClient(zToolbox_protocol)) {
	app.removeAsDefaultProtocolClient(zToolbox_protocol);
}



if (!process.platform.startsWith('win')) {
	/**
	 * electron workaround (ProtocolRegistry use shelljs internally)
	 * @see https://github.com/shelljs/shelljs/wiki/Electron-compatibility
	 */
	const nodePath = shell.config.execPath = shell.which('node')?.toString() ?? null,
		nodeVersion = !!nodePath ? shell.exec(JSON.stringify(nodePath) + ' --version').toString().trim() : ''
	;
	if (/^v\d{2}\./.test(nodeVersion)) {
		ProtocolRegistry.register(zToolbox_protocol,
			app.isPackaged ?
				`${JSON.stringify(process.execPath)} $_URL_`
				:
				`"${process.execPath}" "${appRootPath}" $_URL_`,
			{ override: true, terminal: false }
		)
			.then(async () => {
				console.log("Successfully registered protocol");
			})
			.catch(e => {
				console.error(e);
				console.error('ZToolbox protocol failed : Could not get node');
			})
		;
	} else {
		console.error('ZToolbox protocol failed : Could not get node');
	}
} else {
	let result;
	if (app.isPackaged) {
		result = app.setAsDefaultProtocolClient('ztoolbox');
	} else {
		/*
		 * Arguments taken from :
		 * https://stackoverflow.com/questions/45570589/electron-protocol-handler-not-working-on-windows#53786254
		 */
		result = app.setAsDefaultProtocolClient('ztoolbox', process.execPath, [`"${path.resolve(process.argv[1])}"`]);
	}

	if (!result) {
		console.error('ZToolbox protocol failed');
	}

	/**
	 * https://www.electronjs.org/fr/docs/latest/tutorial/notifications#windows
	 */
	app.setAppUserModelId(process.execPath);
}

export function onOpen(commandLine:string[]) {
	const zToolboxAllowedParams = [
		autoStartArgument
	];
	const args = commandLine
		.filter(arg => {
			return !arg.startsWith('--') || zToolboxAllowedParams.includes(arg)
		})
		.slice(!app.isPackaged ? 2 : 1, commandLine.length)
	;
	if (args.length === 0) {
		showSection('default');
		return;
	}

	const isAutoStarted = args.includes(autoStartArgument),
		requests = args.filter(value => {
			return value.indexOf(zToolbox_protocol + '://') !== -1
		})
	;
	let unsupported:boolean = false;

	if (isAutoStarted) {
		console.info('launch from autostart');
	}

	for (const value of requests) {
		let url:URL|null = null;
		try {
			url = new URL(value)
		} catch (e) {
			console.error(e);
			continue;
		}

		switch (url.host) {
			case 'settings':
				showSection('settings');
				break;
			case 'start':
				console.info('start link');
				showSection('default');
				break;
			default:
				console.error('unsupported link : ', value);
				unsupported = true;
				break;
		}
	}


	if (unsupported) {
		sendNotification({
			title: 'Erreur',
			message: 'Lien non supporté'
		})
			.catch(console.error)
		;
	}
}

export async function updateAutoStart() {
	// const exeName = path.basename(process.execPath);
	const autoLaunchName = "Z-Toolbox",
		autoStartPref = settings.getBoolean('autostart', true),

		args : string[] = []
	;
	if (!app.isPackaged) {
		args.push(JSON.stringify(appRootPath));
	}
	args.push(autoStartArgument);

	if (process.platform === 'linux') {
		if (!linuxAutoStartAppPath) {
			throw new Error(`Unsupported platform: ${process.platform}`);
		}
		if (!fs.existsSync('/etc/apparmor.d/ztoolbox-app')) {
			args.push('--no-sandbox');
		}

		if (fs.existsSync(linuxAutoStartAppPath) !== autoStartPref) {
			if (autoStartPref) {
				fs.writeFileSync(linuxAutoStartAppPath, `[Desktop Entry]
Type=Application
Version=1.0
Name=${appName}
Comment=${appName} startup script
Exec=${`${JSON.stringify(process.execPath)} ${args.join(' ')}`.trim()}
StartupNotify=false
Terminal=false
Icon=${appRootPath}/images/icon@8x.png
Path=`, "utf8")
				console.info('autostart enabled');
			} else {
				fs.unlinkSync(linuxAutoStartAppPath);
				console.info('autostart disabled')
			}
		}
	} else {
		app.setLoginItemSettings({
			name: autoLaunchName,
			openAtLogin: autoStartPref,
			args: args
		});
	}
}
