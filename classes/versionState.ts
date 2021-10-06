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
		logs = (await dirGit.log()).latest,
		[firstRemote] = (await dirGit.getRemotes(true))
	;

	if (!logs || !status.current) {
		throw new Error('LATEST_COMMIT_ERROR');
	}

	const remoteOrigin = firstRemote.refs.fetch,
		originTest = /(?:git@gitlab\.com:|https:\/\/gitlab\.com\/)([^\/]+\/[^\/]+)\.git/i,
		result = originTest.exec(remoteOrigin),
		remoteGitlabOrigin = result ? result[1] : null
	;

	return <VersionState>{
		branch: status.current, // current branch
		commitHash: logs.hash,
		commitDate: new Date(logs.date), // current last local commit date
		remoteOrigin: {
			ref: remoteOrigin,
			gitLabPath: remoteGitlabOrigin
		}
	}
}

export {VersionState} from "./bo/versionState";
