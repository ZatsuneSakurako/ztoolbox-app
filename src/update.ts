import {spawnSync} from 'child_process';
import {simpleGit} from "simple-git";
import {appExtensionPath, appRootPath, gitExtensionAddress, gitMainAddress} from "../classes/constants.js";
import fs from "node:fs";
import {errorToString} from "./errorToString.js";
import {app} from "electron";
import {IUpdateStatus} from "../browserViews/js/bo/update.js";

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
	return output.length;
}

function yarnCommand(folderPath: string, command:string) {
	const yarnInstall = spawnSync('yarn', [command], {
		cwd: folderPath,
		stdio: 'inherit'
	});

	if (yarnInstall.error) {
		console.error(`spawnSync error: ${yarnInstall.error}`);
	} else if (yarnInstall.status !== 0) {
		console.error(`yarn install failed with code ${yarnInstall.status}`);
	} else {
		console.log('yarn install completed successfully');
	}
	return yarnInstall.stdout;
}

function onlyIfUnpacked() {
	if (app.isPackaged) throw new Error('Update system reserved for unpacked app');
}

async function updateExtension(checkOnly:boolean=true, errors?:string[]) {
	onlyIfUnpacked();
	let sshCount: number = Infinity;
	try {
		sshCount = sshAddCount();
	} catch (e) {
		if (errors) errors.push(errorToString(e));
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
			await git.remote([
				'set-url', 'origin',
				`https://github.com/${gitExtensionAddress}`,
			]);
		}
		await git.raw(['switch', 'develop']).fetch();
		if (!checkOnly) {
			await git.pull();
		}
	} catch (e) {
		if (errors) {
			errors.push(errorToString(e));
		}
		console.error(e);
	}

	try {
		await git.remote([
			'set-url', 'origin',
			`git@github.com:${gitExtensionAddress}`,
		])
	} catch (e) {
		if (errors) {
			errors.push(errorToString(e));
		}
		console.error(e);
	}

	return git;
}

export async function updateMain(checkOnly:boolean=false, errors?:string[]) {
	onlyIfUnpacked();
	let sshCount: number = Infinity;
	try {
		sshCount = sshAddCount();
	} catch (e) {
		if (errors) errors.push(errorToString(e));
		console.error(e);
	}

	const git = simpleGit({ baseDir: appRootPath });
	try {
		if (sshCount <= 0) {
			await git.remote([
				'set-url', 'origin',
				`https://github.com/${gitMainAddress}`,
			]);
		}
		await git.fetch();
		if (!checkOnly) {
			await git.pull();
		}
	} catch (e) {
		if (errors) errors.push(errorToString(e));
		console.error(e);
	}

	try {
		await git.remote([
			'set-url', 'origin',
			`git@github.com:${gitMainAddress}`,
		]).catch(console.error);
	} catch (e) {
		if (errors) errors.push(errorToString(e));
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

	return output;
}

export async function doUpdate() {
	onlyIfUnpacked();

	const errors: string[] = [],
		git = await updateMain(false, errors).catch(console.error);
	if (git) {
		try {
			await git.pull();
			yarnCommand(appRootPath, 'install');
			yarnCommand(appRootPath, 'build');
		} catch (e) {
			if (errors) {
				errors.push(errorToString(e));
			}
			console.error(e);
		}
	}

	const gitExtension = await updateExtension(false, errors)
		.catch(console.error);
	if (gitExtension) {
		try {
			await gitExtension.pull();
			yarnCommand(appExtensionPath, 'install');
		} catch (e) {
			if (errors) {
				errors.push(errorToString(e));
			}
			console.error(e);
		}
	}

	return errors;
}
