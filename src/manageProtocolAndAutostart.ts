/*
 * Arguments taken from :
 * https://stackoverflow.com/questions/45570589/electron-protocol-handler-not-working-on-windows#53786254
 */
import shell, {which} from "shelljs";
import ProtocolRegistry from "protocol-registry";
import {autoStartArgument, zToolbox_protocol} from "../classes/constants";
import {app} from "electron";
import path from "path";
import {showSection} from "../classes/windowManager";
import {notifyElectron} from "../classes/notify";
import AutoLaunch from "auto-launch";
import {settings} from "../main";



if (app.requestSingleInstanceLock()) {
	// noinspection JSUnusedLocalSymbols
	app.on('second-instance', (event, commandLine, workingDirectory) => {
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
	if (/^v1[46]\.$/.test(nodeVersion)) {
		ProtocolRegistry.register({
			protocol: zToolbox_protocol,
			command: app.isPackaged ?
				`${JSON.stringify(process.execPath)} $_URL_`
				:
				`"${process.execPath}" "${__dirname}" $_URL_`,
			override: true,
			terminal: false,
			script: false,
		})
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
		let url:URL;
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
				unsupported = true;
				break;
		}
	}


	if (unsupported) {
		notifyElectron({
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
		args.push(JSON.stringify(__dirname));
	}
	args.push(autoStartArgument);

	if (process.platform === 'linux') {
		if (!app.isPackaged) {
			// auto-launch trick to be able to use argument
			// @ts-ignore
			const fileBasedUtilities = await import('auto-launch/dist/fileBasedUtilities');
			// @ts-ignore
			const AutoLaunchLinux = await  import('auto-launch/dist/AutoLaunchLinux');
			const targetFilePath = AutoLaunchLinux.getFilePath(autoLaunchName),
				isEnabled = await fileBasedUtilities.isEnabled(targetFilePath)
			;

			if (isEnabled !== autoStartPref) {
				if (autoStartPref) {
					await AutoLaunchLinux.enable({
						appName: autoLaunchName,
						appPath: `${JSON.stringify(process.execPath)} ${args.join(' ')}`,
						isHiddenOnLaunch: false
					})
						.then(() => {
							console.info('autostart enabled');
						})
						.catch(console.error)
					;
				} else {
					await fileBasedUtilities.removeFile(targetFilePath)
						.then(() => {
							console.info('autostart disabled');
						})
						.catch(console.error)
					;
				}
			}
			return;
		}

		const autoLaunch = new AutoLaunch({
				name: autoLaunchName
			}),
			isEnabled = await autoLaunch.isEnabled()
		;

		if (isEnabled !== autoStartPref) {
			if (autoStartPref) {
				await autoLaunch.enable()
					.then(() => {
						console.info('autostart enabled');
					})
					.catch(console.error);
			}
			else {
				await autoLaunch.disable()
					.then(() => {
						console.info('autostart disabled');
					})
					.catch(console.error);
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
