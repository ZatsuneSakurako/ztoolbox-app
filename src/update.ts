import {spawnSync} from 'child_process';
import {simpleGit} from "simple-git";
import {appExtensionPath, appRootPath, gitExtensionAddress, gitMainAddress} from "../classes/constants.js";
import fs from "node:fs";
import {errorToString} from "./errorToString.js";
import {app} from "electron";
import {IUpdateStatus} from "../browserViews/js/bo/update.js";
import {doRestartExtensions, sendToExtensionUpdateAvailable} from "../classes/chromeNative.js";

function sshAddCount() {
	const result = spawnSync('ssh-add', ['-l'], {
		cwd: app.getPath('userData'),
		stdio: 'pipe',
		encoding: 'utf8',
		timeout: 5000,
		shell: true,
		env: {
			...process.env,
			'LANG': 'C',
		}
	});

	const output: string[] = [];
	for (let item of result.output) {
		if (item === null) continue;
		item = item.trim();
		if (!item.length || /the agent has no identities\./i.test(item)) continue;
		output.push(item);
	}
	// console.info(`[SSH-ADD] ${output.length} key${output.length > 1 ? 's' : ''}`);
	return output.length;
}

function yarnCommand(folderPath: string, command:string) {
	const yarnInstall = spawnSync('yarn', [command], {
		cwd: folderPath,
		stdio: 'inherit',
		encoding: 'utf8',
	});

	if (yarnInstall.error) {
		throw new Error(`spawnSync error: ${yarnInstall.error}`);
	} else if (yarnInstall.status !== 0) {
		throw new Error(`yarn install failed with code ${yarnInstall.status}`);
	}
	return yarnInstall.stdout;
}

function onlyIfUnpacked() {
	if (app.isPackaged) throw new Error('Update system reserved for unpacked app');
}

async function updateExtension(checkOnly:boolean=true, logs?:string[]) {
	onlyIfUnpacked();
	let sshCount: number = Infinity;
	try {
		sshCount = sshAddCount();
	} catch (e) {
		if (logs) logs.push(errorToString(e));
		console.error(e);
	}

	if (!fs.existsSync(appExtensionPath)) {
		await simpleGit()
			.clone(`https://github.com/${gitExtensionAddress}`, appExtensionPath);
	}

	const git = simpleGit({
		baseDir: appExtensionPath,
	});
	try {
		if (sshCount <= 0) {
			const result = await git.remote([
				'set-url', 'origin',
				`https://github.com/${gitExtensionAddress}`,
			]);
			if (logs && result) {
				logs.push(result);
			}
		}
		await git.raw(['switch', 'develop']).fetch();
		if (!checkOnly) {
			await git.pull();
			await doRestartExtensions();
		}
	} catch (e) {
		if (logs) {
			logs.push(errorToString(e));
		}
		console.error(e);
	}

	try {
		const result = await git.remote([
			'set-url', 'origin',
			`git@github.com:${gitExtensionAddress}`,
		]);
		if (logs && result) {
			logs.push(result);
		}
	} catch (e) {
		if (logs) {
			logs.push(errorToString(e));
		}
		console.error(e);
	}

	return git;
}

export async function updateMain(checkOnly:boolean=false, logs?:string[]) {
	onlyIfUnpacked();
	let sshCount: number = Infinity;
	try {
		sshCount = sshAddCount();
	} catch (e) {
		if (logs) logs.push(errorToString(e));
		console.error(e);
	}

	const git = simpleGit({ baseDir: appRootPath });
	try {
		if (sshCount <= 0) {
			const result = await git.remote([
				'set-url', 'origin',
				`https://github.com/${gitMainAddress}`,
			]);
			if (logs && result) {
				logs.push(result);
			}
		}
		await git.fetch();
		if (!checkOnly) {
			await git.pull();
		}
	} catch (e) {
		if (logs) logs.push(errorToString(e));
		console.error(e);
	}

	try {
		const result = await git.remote([
			'set-url', 'origin',
			`git@github.com:${gitMainAddress}`,
		]).catch(console.error);
		if (logs && result) {
			logs.push(result);
		}
	} catch (e) {
		if (logs) logs.push(errorToString(e));
		console.error(e);
	}


	return git;
}

export async function updateStatus() {
	onlyIfUnpacked();

	const output: IUpdateStatus = {
		errors: [],
	};

	const git = await updateMain(true, output.errors).catch(console.error);
	if (git) {
		try {
			const gitStatus = await git.status();
			output.main = {
				ahead: gitStatus.ahead,
				behind: gitStatus.behind,
			}
		} catch (e) {
			if (output.errors) {
				output.errors.push(errorToString(e));
			}
			console.error(e);
		}
	}

	const gitExtension = await updateExtension(true, output.errors)
		.catch(console.error);
	if (gitExtension) {
		try {
			const gitStatus = await gitExtension.status();
			output.extension = {
				ahead: gitStatus.ahead,
				behind: gitStatus.behind,
			}
		} catch (e) {
			if (output.errors) {
				output.errors.push(errorToString(e));
			}
			console.error(e);
		}
	}

	sendToExtensionUpdateAvailable(
		((output.main?.behind ?? 0) + (output.extension?.behind ?? 0)) > 0
	).catch(console.error);

	return output;
}

export async function doUpdate() {
	onlyIfUnpacked();

	const logs: string[] = [],
		git = await updateMain(false, logs).catch(console.error);
	let mainUpdateErrored = false;
	if (git) {
		try {
			logs.push(JSON.stringify(await git.pull()));
			logs.push(yarnCommand(appRootPath, 'install'));
			logs.push(yarnCommand(appRootPath, 'build'));
		} catch (e) {
			mainUpdateErrored = true;
			if (logs) {
				logs.push(errorToString(e));
			}
			console.error(e);
		}
	}

	const gitExtension = await updateExtension(false, logs)
		.catch(console.error);
	if (gitExtension) {
		try {
			logs.push(JSON.stringify(await gitExtension.pull()));
			logs.push(yarnCommand(appExtensionPath, 'install'));
		} catch (e) {
			if (logs) {
				logs.push(errorToString(e));
			}
			console.error(e);
		}
	}

	if (!mainUpdateErrored) {
		setTimeout(() => {
			app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) });
			app.exit(0);
		});
	}

	return logs;
}
