import {spawnSync} from 'child_process';
import {app} from "electron";
import {simpleGit} from "simple-git";
import {appRootPath} from "../classes/constants.js";
import path from "node:path";
import fs from "node:fs";

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
}

async function checkUpdateExtension() {
	const extensionPath = path.normalize(`${app.getPath('userData')}/ztoolbox`);

	if (!fs.existsSync(extensionPath)) {
		await simpleGit()
			.clone('git@github.com:ZatsuneNoMokou/ztoolbox.git', extensionPath);
	}

	const git = simpleGit({
		baseDir: appRootPath,
	});
	await git.checkout('develop');
	await git.fetch();
	return git;
}

export async function checkUpdate() {
	const git = simpleGit({
		baseDir: appRootPath,
	});
	await git.fetch();

	const extension = await checkUpdateExtension();

	return {
		git,
		extension,
	};
}

export async function update() {
	const nbKeys = sshAddCount();
	if (nbKeys === 0) throw new Error('NO_SSH_KEY');


	const gits = await checkUpdate();
	await gits.git.pull();
	yarnCommand(appRootPath, 'install');
	yarnCommand(appRootPath, 'build');


	const extensionPath = path.normalize(`${app.getPath('userData')}/ztoolbox`);
	await gits.extension.pull();
	yarnCommand(extensionPath, 'install');
}
