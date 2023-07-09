import http from "http";
import {
	ClientToServerEvents, IChromeExtensionName,
	InterServerEvents, ISendNotificationOptions, preferenceData, ResponseCallback,
	ServerToClientEvents,
	SocketData, SocketMessage
} from "./bo/chromeNative";
import {settings} from "../main";
import {setBadge, showSection} from "./windowManager";
import {Server, Socket, RemoteSocket} from "socket.io";
import Dict = NodeJS.Dict;
import {IJsonWebsiteData, WebsiteData} from "../browserViews/js/websiteData";
import {NotificationResponse} from "./bo/notify";
import {websitesData, websitesDataLastRefresh} from "./Settings";
import {JsonSerialize} from "./JsonSerialize";
import {BrowserWindow, ipcMain} from "electron";
import {ZAlarm} from "./ZAlarm";



export type socket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type remoteSocket = RemoteSocket<ServerToClientEvents, SocketData>;
export const server = http.createServer(),
	io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server)
;


io.use((socket, next) => {
	const token = socket.request.headers.token;
	if (!token || token !== 'VGWm4VnMVm72oIIEsaOd97GXNU6_Vg3Rv67za8Fzal9aAWNVUb1AWfAKktIu922c') {
		next(new Error("invalid"));
	} else {
		next();
	}
});

io.on("connection", (socket: socket) => {
	console.dir(socket.request.headers["user-agent"]);

	socket.emit('ws open', {
		error: false,
		result: {
			connected: "z-toolbox"
		}
	});

	socket.on('getPreference', function (id:string, cb) {
		cb({
			error: false,
			result: {
				id,
				value: settings.get(id)
			}
		});
	});

	socket.on('getPreferences', function (ids:string[], cb) {
		cb({
			error: false,
			result: ids.map(id => {
				return {
					id,
					value: settings.get(id)
				}
			})
		});
	});

	socket.on('getDefaultValues', function (cb) {
		cb({
			error: false,
			result: settings.getDefaultValues()
		});
	});

	socket.on('ping', function (cb) {
		cb({
			error: false,
			result: 'pong'
		});
	});

	socket.on('showSection', function (sectionName, cb) {
		showSection(sectionName);
		cb({
			error: false,
			result: 'success'
		});
	});

	socket.on('updateSocketData', function (data) {
		if ('notificationSupport' in data) {
			socket.data.notificationSupport = data.notificationSupport;
		}
		if ('sendingWebsitesDataSupport' in data) {
			socket.data.sendingWebsitesDataSupport = data.sendingWebsitesDataSupport;

			if (data.sendingWebsitesDataSupport && !zAlarm_refreshWebsites) {
				const lastRefresh = settings.getDate(websitesDataLastRefresh);
				if (!!lastRefresh && Date.now() - lastRefresh.getTime() > 5 * 60 * 1000) {
					refreshWebsitesData()
						.catch(console.error)
					;
				} else {
					refreshWebsitesInterval();
				}
			}
		}
		if ('browserName' in data) {
			socket.data.browserName = data.browserName;
		}
		socket.data.extensionId = data.extensionId;
		socket.data.userAgent = data.userAgent;
	});

	socket.on('getWebsitesData', function (cb) {
		const data = settings.getObject<Dict<IJsonWebsiteData>>(websitesData);
		if (!!data) {
			cb({
				error: false,
				result: data
			});
		} else {
			cb({
				error: 'NOT_FOUND'
			})
		}
	});

	socket.on('getWsClientNames', async function (cb) {
		cb({
			error: false,
			result: await getWsClientNames()
		});
	});

	socket.on('openUrl', async function (browserName:string, url: string, cb: ResponseCallback<boolean>) {

		const sockets = await io.fetchSockets();
		let targetSocket: RemoteSocket<ServerToClientEvents, SocketData>|null = null;
		for (let client of sockets) {
			if (client.data.browserName === browserName) {
				targetSocket = client;
				break;
			}
		}

		if (!targetSocket) {
			cb({
				error: true
			});
			return;
		}

		targetSocket.emit('openUrl', url, function (response) {
			if (response.error === false) {
				cb({
					error: false,
					result: response.result
				});
			} else {
				cb({
					error: true
				});
			}
		});
	});
});

export function ping(socket: socket): Promise<'pong'> {
	return new Promise((resolve, reject) => {
		socket.emit('ping', function (response) {
			if (response.error === false) {
				resolve(response.result);
			} else {
				reject('Error : ' + response.error);
			}
		});
	});
}

function _getWebsitesData(socket: remoteSocket): Promise<Dict<IJsonWebsiteData>> {
	return new Promise((resolve, reject) => {
		socket.emit('getWebsitesData', function (response) {
			if (response.error === false) {
				resolve(response.result);
			} else {
				reject('Error : ' + response.error);
			}
		});
	});
}

let zAlarm_refreshWebsites : ZAlarm|null = null;
export function refreshWebsitesInterval() : void {
	const checkDelay = settings.getNumber('check_delay') ?? 5;
	if (zAlarm_refreshWebsites) {
		zAlarm_refreshWebsites.cronOrDate = `*/${checkDelay} * * * *`;
	} else {
		zAlarm_refreshWebsites = ZAlarm.start(`*/${checkDelay} * * * *`, refreshWebsitesData);
	}
}
ipcMain.handle('refreshWebsitesData', function () {
	refreshWebsitesData()
		.catch(console.error)
	;
});
export async function refreshWebsitesData() : Promise<boolean> {
	const lastRefresh = settings.getDate(websitesDataLastRefresh);
	if (!!lastRefresh && Date.now() - lastRefresh.getTime() < 60 * 1000) {
		console.warn('Less than one minute, not refreshing');
		return false;
	}


	const currentRefresh = new Date();
	settings.set(websitesDataLastRefresh, currentRefresh);
	refreshWebsitesInterval();


	const sockets = await io.fetchSockets();

	let targetSocket : remoteSocket|null = null;
	for (let client of sockets) {
		if (client.data.sendingWebsitesDataSupport === true) {
			targetSocket = client;
			break;
		}
	}
	if (!targetSocket) return false;


	const websiteData = await _getWebsitesData(targetSocket),
		data : Dict<JsonSerialize<IJsonWebsiteData>> = {}
	;
	let count : number = 0;
	for (let [name, raw] of Object.entries(websiteData)) {
		if (!raw) continue;

		const newInstance = new WebsiteData();
		newInstance.fromJSON(raw);
		data[name] = newInstance;

		count += newInstance.count;
	}

	setBadge(count);
	settings.set<IJsonWebsiteData>(websitesData, data);


	for (let browserWindow of BrowserWindow.getAllWindows()) {
		browserWindow.webContents.send('websiteDataUpdate', websiteData, currentRefresh);
	}

	return true;
}


export async function onSettingUpdate(id: string, oldValue: preferenceData['value'], newValue: preferenceData['value']): Promise<void> {
	const sockets = await io.fetchSockets();
	for (let socket of sockets) {
		socket.emit('onSettingUpdate', {
			id,
			oldValue,
			newValue
		});
	}
}

function _sendNotification<T>(socket: remoteSocket, opts: ISendNotificationOptions): Promise<T> {
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

export async function sendNotification(opts: ISendNotificationOptions): Promise<NotificationResponse|null> {
	const sockets = await io.fetchSockets();
	for (let client of sockets) {
		if (!client.data.notificationSupport) continue;
		return await _sendNotification(client, opts);
	}
	return null;
}

export async function getWsClientNames(): Promise<IChromeExtensionName[]> {
	const output : IChromeExtensionName[] = [];

	const sockets = await io.fetchSockets();
	for (let client of sockets) {
		if (!client.data.userAgent) continue;
		output.push({
			browserName: client.data.browserName ?? 'Unknown',
			userAgent: client.data.userAgent,
			extensionId: client.data.extensionId ?? '',
			notificationSupport: client.data.notificationSupport ?? false,
			sendingWebsitesDataSupport: client.data.sendingWebsitesDataSupport ?? false
		});
	}

	return output;
}
