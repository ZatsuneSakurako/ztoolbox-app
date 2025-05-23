import {
	ClientToServerEvents, IChromeExtensionData,
	InterServerEvents, IWsMoveSourceData, preferenceData, ResponseCallback,
	ServerToClientEvents,
	SocketData,
} from "./bo/chromeNative.js";
import {showSection} from "./windowManager.js";
import {Server, Socket, RemoteSocket} from "socket.io";
import "../src/websitesData/refreshWebsitesData.js";
import {BrowserWindow} from "electron";
import {settings} from "../src/init.js";
import Fastify, {FastifyInstance} from "fastify";
import path from "path";
import fs from "fs";
import {errorToString} from "../src/errorToString.js";
import {IUserscriptJson} from "./bo/userscript.js";
import {Userscript} from "../src/userScript/Userscript.js";



export type socket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type remoteSocket = RemoteSocket<ServerToClientEvents, SocketData>;
export const fastifyApp: FastifyInstance = Fastify({}),
	io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(fastifyApp.server)
;


/*
	await chrome.storage.local.set({
		chrome_native_token: 'VGWm4VnMVm72oIIEsaOd97GXNU6_Vg3Rv67za8Fzal9aAWNVUb1AWfAKktIu922c'
	});
 */
io.use((socket, next) => {
	const token = socket.handshake.query.token;
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
		if ('browserName' in data && data.browserName !== undefined) {
			socket.data.browserName = data.browserName;
		}
		if ('extensionId' in data && data.extensionId !== undefined) {
			socket.data.extensionId = data.extensionId;
		}
		if ('userAgent' in data && data.userAgent !== undefined) {
			socket.data.userAgent = data.userAgent;
		}
		if ('tabData' in data) {
			socket.data.tabData = data.tabData;

			if (typeof socket.data.tabData?.url === 'string') {
				let url:URL|undefined = undefined;
				try {
					url = new URL(socket.data.tabData?.url)
				} catch (e) {
					console.error(e);
				}

				if (url && ['chrome:', 'moz-extension:', 'edge:'].includes(url.protocol)) {
					socket.data.tabData.url = undefined;
					socket.data.tabData.domain = undefined;
				}
			}
		}

		getWsClientDatas()
			.then(getWsClientDatas => {
				for (let browserWindow of BrowserWindow.getAllWindows()) {
					browserWindow.webContents.send('wsClientDatasUpdate', Object.fromEntries(getWsClientDatas));
				}
			})
			.catch(console.error)
		;
	});

	socket.on('disconnect', reason => {
		console.log(`Socket disconnected : ${reason}`);

		getWsClientDatas()
			.then(getWsClientDatas => {
				for (let browserWindow of BrowserWindow.getAllWindows()) {
					browserWindow.webContents.send('wsClientDatasUpdate', Object.fromEntries(getWsClientDatas));
				}
			})
			.catch(console.error)
		;
	})

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

	socket.on('getUserscripts', async function (cb) {
		const userscriptsPath = Userscript.userscriptsPath;
		if (!fs.existsSync(userscriptsPath)) {
			cb({
				error: false,
				result: [],
			})
			return;
		}

		try {
			const userscripts = Userscript.search(userscriptsPath),
				result: IUserscriptJson[] = [];

			for (let userscript of userscripts) {
				await userscript.processContent();
				result.push(userscript.toJSON());
			}

			cb({
				error: false,
				result,
			})
		} catch (e) {
			socket.emit('log', '[UserScripts]\n' + errorToString(e)) || console.error(e);
			cb({
				error: true
			});
		}
	});

	socket.on('setUserscriptData', function (fileName, newData, cb) {
		if (!fs.existsSync(path.normalize(`${Userscript.userscriptsPath}/${fileName}`))) {
			cb({
				error: 'FILE_NOT_FOUND',
			});
			return;
		}

		const sockets = io.fetchSockets()
			.catch(console.error)

		try {
			const userScript = new Userscript(fileName, Userscript.userscriptsPath);
			cb({ error: false, result: userScript.setData(newData) });
		} catch (e) {
			cb({ error: e.toString() });
			return;
		}

		sockets
			.then(sockets => {
				if (!sockets) return;
				for (let _socket of sockets) {
					if (_socket.id === socket.id) continue;
					_socket.emit('userScriptDataUpdated', fileName, newData ?? {});
				}
			})
			.catch(console.error);
	});
	socket.on('getUserscriptData', function (fileName, cb) {
		if (!fs.existsSync(path.normalize(`${Userscript.userscriptsPath}/${fileName}`))) {
			cb({ error: 'FILE_NOT_FOUND' });
			return;
		}

		try {
			const userScript = new Userscript(fileName, Userscript.userscriptsPath);
			cb({ error: false, result: userScript.getData() });
		} catch (e) {
			cb({ error: e.toString() });
			return;
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



export async function getWsClientDatas(): Promise<Map<string, IChromeExtensionData>> {
	const output = new Map<string, IChromeExtensionData>();

	const sockets = await io.fetchSockets();
	for (let client of sockets) {
		if (!client.data.userAgent) continue;
		output.set(client.id, {
			browserName: client.data.browserName ?? 'Unknown',
			userAgent: client.data.userAgent,
			extensionId: client.data.extensionId ?? '',
			notificationSupport: client.data.notificationSupport ?? false,
			tabData: client.data.tabData ?? undefined
		});
	}

	return output;
}

export async function moveWsClientUrl(srcData:IWsMoveSourceData, targetId:string) {
	const sockets = await io.fetchSockets();
	let targetSocket: RemoteSocket<ServerToClientEvents, SocketData>|null = null,
		sourceTargetSocket: RemoteSocket<ServerToClientEvents, SocketData>|null = null
	;
	for (let client of sockets) {
		if (client.id === targetId) {
			targetSocket = client;
		}
		if (srcData.id !== undefined && client.id === srcData.id) {
			sourceTargetSocket = client;
		}
		if (!!targetSocket && !!sourceTargetSocket) {
			break;
		}
	}

	if (!targetSocket) {
		throw new Error('MV_CLIENT_URL_TARGET_NOT_FOUND');
	}

	targetSocket.emit('openUrl', srcData.tabDataUrl, function (response) {
		if (response.error === false) {
			if (sourceTargetSocket) {
				sourceTargetSocket.emit('closeActiveUrl', srcData.tabDataUrl);
			} else {
				console.error('CANNOT_CLOSE_TAB_' + srcData.id);
			}
		} else {
			console.error(response);
		}
	});
}
