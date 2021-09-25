import {exec, ExecException} from "child_process";


function promisedExec(command:string):Promise<any> {
	return new Promise((resolve, reject) => {
		const callback = function (error: ExecException, stdout:string, stderr:string) {
			if (!!error || !!stderr) {
				reject({
					error,
					stderr
				});
				return;
			}

			let result;
			try {
				result = JSON.parse(stdout);
			} catch (e) {}

			if (typeof result === 'object') {
				resolve(result);
			} else {
				resolve(stdout);
			}
		};

		exec(command, callback);
	})
}



export class Streamlink {
	static async getQualities(url:URL):Promise<string[]> {
		let output = null,
			result
		;

		try {
			result = await promisedExec(`streamlink --quiet --json ${url.toString()}`);
		} catch (e) {
			console.error(e);
		}

		try {
			output = Object.getOwnPropertyNames(result.streams)
		} catch (e) {
			console.error(e)
		}

		return output === null? [] : output;
	}

	static async isAvailable(url:string|URL, quality:string, maxQuality?:string):Promise<boolean> {
		let result:any = null;

		try {
			result = await promisedExec(`streamlink --quiet --json${typeof maxQuality === 'string'? ' --stream-sorting-excludes=">' + maxQuality + '"' : ''} ${url.toString()} ${quality}`);
		} catch (e) {
			console.error(e)
		}

		return typeof result === 'object' && result !== null && result.hasOwnProperty('error') === false;
	}

	static async open(url:string|URL, quality:string, maxQuality:string):Promise<void> {
		let result;

		try {
			result = await promisedExec(`streamlink --quiet${typeof maxQuality === 'string'? ' --stream-sorting-excludes=">' + maxQuality + '"' : ''} ${url.toString()} ${quality}`);
		} catch (e) {
			throw e;
		}

		return result;
	}
}
