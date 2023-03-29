import {BrowserWindow} from 'electron';
import http from "http";
import {
	ClientToServerEvents,
	InterServerEvents, ISendNotificationOptions, preferenceData,
	ServerToClientEvents,
	SocketData, SocketMessage
} from "./bo/chromeNative";
import {settings} from "../main";
import {setBadge, showSection} from "./windowManager";
import {Server, Socket, RemoteSocket} from "socket.io";
import Dict = NodeJS.Dict;
import {WebsiteData, IJsonWebsiteData} from "../browserViews/js/websiteData";
import {JsonSerialize} from "./JsonSerialize";
import {NotificationResponse} from "./bo/notify";
import {websitesData} from "./Settings";



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
	})

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

	socket.on('sendWebsitesData', function (websiteData:Dict<IJsonWebsiteData>) {
		const data : Dict<JsonSerialize<IJsonWebsiteData>> = {};
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
			browserWindow.webContents.send('websiteDataUpdate', websiteData);
		}
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

export async function getWsClientNames(): Promise<string[]> {
	const output : string[] = [];

	const sockets = await io.fetchSockets();
	for (let client of sockets) {
		if (client.data) {
			output.push(`${client.data.extensionId} ${client.data.notificationSupport ? '(notification support)' : ''} : ${client.data.userAgent}`);
		} else {
			output.push('Unknown');
		}
	}

	return output;
}
