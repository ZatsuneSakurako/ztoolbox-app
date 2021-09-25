import notifier from "node-notifier";
import {app} from "electron";


let appIcon:string = null;



function notify(options:{title:string, message:string, icon?:string, sound?:boolean}):Promise<any> {
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
		// @ts-ignore
		options.wait = true;
		notifier.notify(options, function (error:any, response:any) {
			if (!!error) {
				reject(error);
			} else if (!(typeof response === 'string' && response.indexOf('clicked'))) {
				resolve(response);
			}
		})
			/*.on('click', () => {
				resolve('click');
			})
			.on('timeout', () => {
				reject('timeout');
			})*/
	})
}



/**
 *
 * @param {String} [appIconPath]
 * @return {{notify: (function({title: String, message: String, icon?: String, sound?: Boolean}): Promise<*>)}}
 */
module.exports = function(appIconPath:string) {
	if (appIconPath === undefined) {
		appIconPath = null;
	}

	appIcon = appIconPath;

	return {
		notify
	}
};
