import simpleGit from 'simple-git';

export async function versionState(gitDir=process.cwd()) {
	const dirGit = simpleGit({baseDir: gitDir}),
		status = await dirGit.status(),
		logs = (await dirGit.log()).latest
	;

	if (!logs) {
		throw new Error('LATEST_COMMIT_ERROR');
	}

	return {
		branch: status.current, // current branch
		commitHash: logs.hash,
		commitDate : new Date(logs.date) // current last local commit date
	}
}
