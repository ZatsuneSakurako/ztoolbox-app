import {
	ClientToServerEvents, IChromeExtensionData,
	InterServerEvents, IWsMoveSourceData, preferenceData, ResponseCallback,
	ServerToClientEvents,
	SocketData,
} from "./bo/chromeNative.js";
import {showSection} from "./windowManager.js";
import {Server, Socket, RemoteSocket} from "socket.io";
import "../src/websitesData/refreshWebsitesData.js";
import electron, {BrowserWindow} from "electron";
import {settings} from "../src/init.js";
import Fastify, {FastifyInstance} from "fastify";
import path from "path";
import fs from "fs";
import {errorToString} from "../src/errorToString.js";
import {IUserscriptJson} from "./bo/userscript.js";
import {Userscript} from "../src/userScript/Userscript.js";
import nunjucks from "nunjucks";
import {appExtensionTemplatesPath} from "./constants.js";



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

	socket.on('isUpdateAvailable', function (cb) {
		cb({
			error: false,
			result: lastStatus_isUpdateAvailable,
		});
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
		if (ids.length === 0) {
			for (let [id, config] of Object.entries(settings.getSettingConfigs() ?? [])) {
				if (!config) continue;

				if (config.group && webExtensionSettingsGroups.has(config.group)) {
					ids.push(id);
				}
			}
		}
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
		cb({ error: false, result: settings.getDefaultValues() });
	});

	socket.on('ping', function (cb) {
		cb({ error: false, result: 'pong' });
	});

	socket.on('showSection', function (sectionName, cb) {
		showSection(sectionName);
		cb({ error: false, result: 'success' });
	});

	socket.on('updateSocketData', function (data) {
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
			cb({ error: true });
			return;
		}

		targetSocket.emit('openUrl', url, function (response) {
			if (response.error === false) {
				cb({
					error: false,
					result: response.result
				});
			} else {
				cb({ error: true });
			}
		});
	});

	socket.on('writeClipboard', async function (data, cb) {
		try {
			electron.clipboard.write(data);
			cb({
				error: false,
				result: true
			});
		} catch (e) {
			socket.emit('log', '[writeClipboard] ' + errorToString(e));
			console.error(e);
			cb({ error: true });
		}
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

		const logs: string[] = [];
		try {
			const userscripts = Userscript.search(userscriptsPath),
				result: IUserscriptJson[] = [];

			if (userscripts.ignoredFiles.length > 0) {
				logs.push('Ignored files : \n- ' + userscripts.ignoredFiles.join('\n- '));
			}

			for (let userscript of userscripts.userscripts) {
				await userscript.processContent();
				result.push(userscript.toJSON());
			}

			cb({
				error: false,
				result,
			})
		} catch (e) {
			logs.push(errorToString(e));
			console.error(e);
			cb({ error: true });
		}
		if (logs.length) {
			socket.emit('log', '[UserScripts] ' + logs.join('\n'));
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
			console.error(e);
			cb({ error: errorToString(e) });
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
			console.error(e);
			cb({ error: errorToString(e) });
			return;
		}
	});

	socket.on('nunjuckRender', async function (templateName, context, cb) {
		const absolutePath = path.normalize(`${appExtensionTemplatesPath}/${templateName}${templateName.endsWith('.njk') ? '' : '.njk'}`);
		if (!fs.existsSync(absolutePath)) {
			cb({ error: `FILE_NOT_FOUND ${JSON.stringify(absolutePath)}` });
			return;
		}
		if (appExtensionTemplatesPath.startsWith(absolutePath)) {
			cb({ error: `FILE_NOT_WELL_PLACED ${JSON.stringify(absolutePath)}` });
			return;
		}
		try {
			const fileContent = fs.readFileSync(absolutePath, { encoding: 'utf8' }),
				result = nunjucks.renderString(fileContent, context);
			cb({ error: false, result });
		} catch (e) {
			console.error(e);
			cb({ error: errorToString(e) });
			return;
		}
	})
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

export const webExtensionSettingsGroups = new Set<string>(['theme', 'web_extension']);
export async function onSettingUpdate(id: string, oldValue: preferenceData['value'], newValue: preferenceData['value']): Promise<void> {
	const settingConfig = settings.getSettingConfig(id);
	if (settingConfig && (!settingConfig.group || webExtensionSettingsGroups.has(settingConfig.group))) {
		/**
		 * Not web extension settings,
		 * not sending it to sockets
 		 */
		return;
	}

	const sockets = await io.fetchSockets();
	for (let socket of sockets) {
		socket.emit('onSettingUpdate', {
			id,
			oldValue,
			newValue
		});
	}
}

export async function doRestartExtensions(): Promise<void> {
	const sockets = await io.fetchSockets();
	for (let socket of sockets) {
		if (/Firefox/i.test(socket.data.browserName)) continue;
		socket.emit('doRestart');
	}
}

let lastStatus_isUpdateAvailable: boolean|null = null;
export async function sendToExtensionUpdateAvailable(isUpdateAvailable:boolean): Promise<void> {
	lastStatus_isUpdateAvailable = isUpdateAvailable
	const sockets = await io.fetchSockets();
	for (let socket of sockets) {
		socket.emit('updateAvailableUpdate', isUpdateAvailable);
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
