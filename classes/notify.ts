import {Notification} from "electron";
import {appIconPath_x3} from "./constants";
import {NotificationResponse} from "./bo/notify";



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
