import electron, {Notification} from "electron";
import {appIconPath_x3} from "./constants.js";
import {NotificationResponse, NotifyElectron_Options} from "./bo/notify.js";
import {io, remoteSocket} from "./chromeNative.js";
import {ISendNotificationOptions, SocketMessage} from "./bo/chromeNative.js";
import * as os from "node:os";



function _notifyChromeNative<T>(socket: remoteSocket, opts: ISendNotificationOptions): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		socket.emit('sendNotification', opts, (response:SocketMessage<T>) => {
			if (response.error !== false) {
				reject(response.error);
			} else {
				resolve(response.result);
			}
		});
	});
}

async function notifyChromeNative(opts: ISendNotificationOptions): Promise<NotificationResponse|null> {
	const sockets = await io.fetchSockets();
	for (let client of sockets) {
		if (!client.data.notificationSupport) continue;
		return await _notifyChromeNative(client, opts);
	}
	return null;
}





export async function sendNotification(options:NotifyElectron_Options): Promise<NotificationResponse> {
	const response = await notifyChromeNative({
		title: options.title,
		message: options.message,
		timeoutType: options.timeoutType ?? 'default'
	});
	if (response !== null) {
		return response;
	}
	return _notifyElectron(options);
}
process.on('exit', async function () {
	const sockets = await io.fetchSockets();
	for (let client of sockets) {
		if (!client.data.notificationSupport) continue;
		await client.emit('clearNotifications');
	}
	process.exit(0);
});

function _notifyElectron(options:NotifyElectron_Options):Promise<NotificationResponse> {
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
			actions: (options.actions ?? []).map<electron.NotificationAction>(el => {
				return {
					text: el.text,
					type: 'button',
				}
			}),
			silent: options.sound !== undefined ? options.sound : false
		});

		let timer : ReturnType<typeof setTimeout>|null = null;
		if (os.platform().startsWith('win') && notification.timeoutType !== 'never') {
			/**
			 * @see https://www.electronjs.org/docs/latest/api/notification#event-close
			 * Only required on Windows (in case the notification goes in the notification center)
			 */
			timer = setTimeout(() => {
				notification.close();
			}, 15000);
		}

		notification.on('click', function () {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
			resolve({
				response: 'click'
			});
		});
		notification.on('action', function (e, index) {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
			resolve({
				response: 'action',
				index
			});
		});
		notification.on('close', function () {
			if (timer) {
				if (os.platform().startsWith('win')) {
					try {
						notification.close();
					} catch (e) {
						console.error(e);
					}
				}
				clearTimeout(timer);
				timer = null;
			}
			resolve({
				response: 'close'
			});
		});
		notification.on('failed', function (e, error) {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
			reject(error);
		});



		notification.show();
	})
}
