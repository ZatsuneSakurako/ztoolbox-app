const notifier = require('node-notifier'),
	{app} = require('electron')
;

let appIcon = null;



/**
 *
 * @param {Object} options
 * @param {String} options.title
 * @param {String} options.message
 * @param {String} [options.icon]
 * @param {Boolean} [options.sound]
 * @return {Promise<*>}
 */
function notify(options) {
	return new Promise((resolve, reject) => {
		if (options === null || typeof options !== 'object') {
			reject('WrongArgument');
			return;
		}

		if (typeof options.title !== 'undefined') {
			options.title = `${app.getName()} - ${options.title.toString()}`;
		}
		if (options.hasOwnProperty('icon') === false || typeof options.icon !== 'string' && typeof appIcon === 'string') {
			options.icon = appIcon;
		}
		options.wait = true;
		notifier.notify(options, function (error, response) {
			if (!!error) {
				reject(error);
			} else if (!(typeof response === 'string' && response.indexOf('clicked'))) {
				resolve(response);
			}
		})
			.on('click', () => {
				resolve('click');
			})
			.on('timeout', () => {
				reject('timeout');
			})
	})
}



/**
 *
 * @param {String} [appIconPath]
 * @return {{notify: (function({title: String, message: String, icon?: String, sound?: Boolean}): Promise<*>)}}
 */
module.exports = function(appIconPath) {
	if (appIconPath === undefined) {
		appIconPath = null;
	}

	appIcon = appIconPath;

	return {
		notify
	}
};
