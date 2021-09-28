import notifier from "node-notifier";
import {app} from "electron";


let appIcon:string|null = null;



function notify(options:{title:string, message:string, icon?:string, sound?:boolean}):Promise<any> {
	return new Promise((resolve, reject) => {
		if (options === null || typeof options !== 'object') {
			reject('WrongArgument');
			return;
		}

		if (typeof options.title !== 'undefined') {
			options.title = `${app.getName()} - ${options.title.toString()}`;
		}
		if (!options.icon && !!appIcon) {
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
export default function(appIconPath:string) {
	if (appIconPath === undefined) {
		appIcon = null;
	} else {
		appIcon = appIconPath;
	}


	return {
		notify
	}
};
