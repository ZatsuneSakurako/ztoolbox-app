const { exec } = require('child_process');



/**
 *
 * @param {String} command
 * @return {Promise<*>}
 */
function promisedExec(command) {
	return new Promise((resolve, reject) => {
		/**
		 *
		 * @param {ExecException?} error
		 * @param {string} stdout
		 * @param {string} stderr
		 */
		const callback = function (error, stdout, stderr) {
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



class Streamlink {
	/**
	 *
	 * @param {URL} url
	 * @param {String} [maxQuality]
	 * @return {Promise<String[]>}
	 */
	static async getQualities(url, maxQuality) {
		let output = null,
			result
		;

		try {
			result = await promisedExec(`streamlink --quiet --json ${url.toString()}${typeof maxQuality === 'string'? ' --stream-sorting-excludes ' + maxQuality : ''}`);
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

	/**
	 *
	 * @param {String | URL} url
	 * @param {String} quality
	 * @return {Promise<void>}
	 */
	static async open(url, quality) {
		let result;

		try {
			result = await promisedExec(`streamlink --quiet ${url.toString()} ${quality}`);
		} catch (e) {
			throw e;
		}

		return result;
	}
}



module.exports.Streamlink = Streamlink;