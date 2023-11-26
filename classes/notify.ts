import {Notification} from "electron";
import {appIconPath_x3} from "./constants";
import {NotificationResponse, NotifyElectron_Options} from "./bo/notify";
import {io, remoteSocket} from "./chromeNative";
import {ISendNotificationOptions, SocketMessage} from "./bo/chromeNative";



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
