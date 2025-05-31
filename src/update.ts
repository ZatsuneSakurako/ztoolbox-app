import {spawnSync} from 'child_process';
import {app} from "electron";
export function sshAddCount() {
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
