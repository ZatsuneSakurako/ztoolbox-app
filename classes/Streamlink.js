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
	 * @return {Promise<String[]>}
	 */
	static async getQualities(url) {
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

	/**
	 *
	 * @param {String | URL} url
	 * @param {String} quality
	 * @param {String} [maxQuality]
	 * @return {Promise<boolean>}
	 */
	static async isAvailable(url, quality, maxQuality) {
		let result = null;

		try {
			result = await promisedExec(`streamlink --quiet --json${typeof maxQuality === 'string'? ' --stream-sorting-excludes=">' + maxQuality + '"' : ''} ${url.toString()} ${quality}`);
		} catch (e) {
			console.error(e)
		}

		return typeof result === 'object' && result !== null && result.hasOwnProperty('error') === false;
	}

	/**
	 *
	 * @param {String | URL} url
	 * @param {String} quality
	 * @param {String} [maxQuality]
	 * @return {Promise<void>}
	 */
	static async open(url, quality, maxQuality) {
		let result;

		try {
			result = await promisedExec(`streamlink --quiet${typeof maxQuality === 'string'? ' --stream-sorting-excludes=">' + maxQuality + '"' : ''} ${url.toString()} ${quality}`);
		} catch (e) {
			throw e;
		}

		return result;
	}
}



module.exports.Streamlink = Streamlink;