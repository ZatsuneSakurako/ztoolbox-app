import {Notification} from "electron";
import notifier, {NotificationMetadata, NotificationCallback} from "node-notifier";
import NotifySend from "node-notifier/notifiers/notifysend";
import WindowsToaster from "node-notifier/notifiers/toaster";
import NotificationCenter from "node-notifier/notifiers/notificationcenter";
import {appIconPath_x3} from "./constants";
import {NotificationResponse} from "./bo/notify";



export function notify(options:{id?: number, title:string, message:string, icon?:string, remove?:number, sound?:boolean}):Promise<NotificationResponse & {metadata?: NotificationMetadata}> {
	return new Promise((resolve, reject) => {
		if (options === null || typeof options !== 'object') {
			reject('WrongArgument');
			return;
		}

		let opts : notifier.Notification | NotifySend.Notification | WindowsToaster.Notification | NotificationCenter.Notification = <notifier.Notification>{
			id: options.id,
			title: options.title,
			message: options.message,
			icon: appIconPath_x3,
			remove: options.remove,
			wait: true,
		};
		if (process.platform === "win32") {
			const _opts = <WindowsToaster.Notification>opts;
			_opts.sound = options.sound ?? true;
		} else if (process.platform === "linux") {
			const _opts = <NotifySend.Notification>opts;
		} else if (process.platform === 'darwin') {
			const _opts = <NotificationCenter.Notification>opts;
			_opts.sound = options.sound ?? true;
		}

		notifier.notify(opts, <NotificationCallback>function (error:Error | null, response:string, metadata?: NotificationMetadata) {
			if (!!error) {
				reject(error);
			} else if (!(typeof <any>response === 'string' && response.indexOf('clicked'))) {
				resolve({
					response,
					metadata
				});
			}
		});
	})
}



export function notifyElectron(options:{title:string, message:string, icon?:string | Electron.NativeImage, sound?:boolean}):Promise<NotificationResponse> {
	return new Promise((resolve, reject) => {
		if (options === null || typeof options !== 'object') {
			reject('WrongArgument');
			return;
		}



		const notification = new Notification({
			title: options.title,
			body: options.message,
			icon: options.icon || appIconPath_x3,
			timeoutType: 'default',
			actions: [],
			silent: options.sound !== undefined ? options.sound : false
		});

		notification.on('click', function () {
			resolve({
				response: 'click'
			});
		});
		notification.on('action', function (e, index) {
			resolve({
				response: 'action',
				index
			});
		});
		notification.on('close', function () {
			resolve({
				response: 'close'
			});
		});
		notification.on('failed', function (e, error) {
			reject(error);
		});



		if (notification.timeoutType === 'never') {
			setTimeout(() => {
				notification.close();
			}, 5000);
		}
		notification.show();
	})
}
