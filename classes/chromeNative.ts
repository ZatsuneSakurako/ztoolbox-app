import http from "http";
import {
	ClientToServerEvents,
	InterServerEvents, preferenceData,
	ServerToClientEvents,
	SocketData
} from "./bo/chromeNative";
import {settings} from "../main";
import {setBadge, showSection} from "./windowManager";
import {Server, Socket} from "socket.io";
import Dict = NodeJS.Dict;
import {WebsiteData, IJsonWebsiteData} from "../browserViews/js/websiteData";
import {JsonSerialize} from "./JsonSerialize";



export type socket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
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

	socket.on('extensionName', function (extensionName) {
		socket.data.extensionId = extensionName.extensionId;
		socket.data.userAgent = extensionName.userAgent;
	});

	socket.on('getWebsitesData', function (cb) {
		const data = settings.getObject<Dict<IJsonWebsiteData>>('websitesData');
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
		settings.set<IJsonWebsiteData>('websitesData', data);
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

export async function getWsClientNames(): Promise<string[]> {
	const output : string[] = [];

	const sockets = await io.fetchSockets();
	for (let client of sockets) {
		if (client.data) {
			output.push(client.data.extensionId + ' - ' + client.data.userAgent);
		} else {
			output.push('Unknown');
		}
	}

	return output;
}
