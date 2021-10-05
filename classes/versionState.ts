import simpleGit from 'simple-git';
import {VersionState} from "./bo/versionState";

export async function versionState(gitDir=process.cwd()) {
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
