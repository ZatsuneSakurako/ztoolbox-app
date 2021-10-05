import simpleGit from 'simple-git';
import {VersionState} from "./bo/versionState";
import path from "path";
import fs from "fs-extra";
import {app} from "electron";

export async function versionState(gitDir=process.cwd()) {
	if (app.isPackaged || !fs.existsSync(path.normalize(gitDir + '/.git'))) {
		return null;
	}

	const dirGit = simpleGit({baseDir: gitDir}),
		status = await dirGit.status(),
		logs = (await dirGit.log()).latest
	;

	if (!logs || !status.current) {
		throw new Error('LATEST_COMMIT_ERROR');
	}

	return <VersionState>{
		branch: status.current, // current branch
		commitHash: logs.hash,
		commitDate: new Date(logs.date) // current last local commit date
	}
}

export {VersionState} from "./bo/versionState";
