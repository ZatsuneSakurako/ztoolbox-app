import http from "http";
import WebSocket, {RawData} from "ws";
import {IChromeCommand, IChromeNativeMessage, IChromeNativeReply} from "./bo/chromeNative";
import {settings} from "../main";
import {Socket} from "net";
import {showSection, showWindow} from "./windowManager";

export const server = http.createServer(),
	wss = new WebSocket.Server({noServer: true})
;


server.on('upgrade', function upgrade(request, socket, head) {
	// Do what you normally do in `verifyClient()` here and then use
	// `WebSocketServer.prototype.handleUpgrade()`.

	const token = request.headers.token;
	if (!token || token !== 'VGWm4VnMVm72oIIEsaOd97GXNU6_Vg3Rv67za8Fzal9aAWNVUb1AWfAKktIu922c') {
		socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
		socket.destroy();
		return;
	}

	wss.handleUpgrade(request, <Socket>socket, head, function done(ws) {
		wss.emit('connection', ws, request);
	});
});

async function handleConnectionOpen(socket: WebSocket) {
	return await onMessageHandle({
		type: 'ws open'
	}, socket);
}
wss.on('connection', function(socket) {
	handleConnectionOpen(socket)
		.then(result => {
			socket.send(JSON.stringify(result));
		})
		.catch(console.error)
	;

	// When you receive a message, send that message to every socket.
	socket.on('message', async function(msg) {
		const response = await onSocketMessage(msg, socket);
		if (!!response) {
			socket.send(JSON.stringify(response));
		}
	});
});


/**
 *
 * @param rawData
 * @param socket
 */
export async function onSocketMessage(rawData: RawData, socket: WebSocket): Promise<IChromeNativeReply | undefined> {
	let msg: string | IChromeNativeMessage = rawData.toString();
	try {
		msg = JSON.parse(msg);
	} catch (_) {
	}

	if (typeof msg !== 'object' || msg === null) {
		console.error(msg);
		return {
			error: 'WS Incoming message error',
			type: 'error'
		}
	}

	return await onMessageHandle(msg, socket);
}
async function onMessageHandle<T extends object>(msg: IChromeNativeMessage<T>, socket: WebSocket): Promise<IChromeNativeReply | undefined> {
	if (msg.type === "nativeMessage") {
		switch (msg.data.command) {
			case 'getPreference':
				const getPreference_msg = <IChromeCommand<{ id: string }>>msg;
				return <IChromeNativeReply<{ id: string, value: string }>>{
					error: false,
					type: 'commandReply',
					data: msg.data,
					result: {
						id: getPreference_msg.data.id,
						value: settings.get(getPreference_msg.data.id)
					}
				}
			case 'getPreferences':
				const getPreferences_msg = <IChromeCommand<{ ids: string[] }>>msg;
				const result = [],
					prefIds: string[] = Array.isArray(getPreferences_msg.data.ids) ?
						getPreferences_msg.data.ids
						:
						[...settings.keys()]
				;

				for (let id of prefIds) {
					result.push({
						id: id,
						value: settings.get(id)
					})
				}

				return {
					error: false,
					type: 'commandReply',
					data: msg.data,
					result: result
				}
			case 'getDefaultValues':
				return {
					error: false,
					type: 'commandReply',
					data: msg.data,
					result: settings.getDefaultValues()
				}
			case 'ping':
				return {
					error: false,
					type: 'commandReply',
					data: msg.data,
					result: 'pong'
				}
			case 'showSection':
				const showSection_msg = <IChromeCommand<{ sectionName?: string }>>msg;
				if (typeof showSection_msg.data.sectionName !== 'string' || !showSection_msg.data.sectionName) {
					return {
						error: 'sectionName invalid',
						type: 'commandReply',
						data: msg.data
					}
				} else {
					showSection(showSection_msg.data.sectionName);
					return {
						error: false,
						type: 'commandReply',
						data: msg.data,
						result: 'success'
					}
				}
			default:
				console.dir(msg);
				return <IChromeNativeReply<string>>{
					error: 'UNKNOWN_COMMAND',
					type: 'error',
					data: msg.data,
					result: "z-toolbox received the message"
				};
		}
	}

	switch (msg.type) {
		case "ws open":
			console.dir(msg);
			return <IChromeNativeReply<{ connected: string }>>{
				error: false,
				type: 'ws open',
				result: {
					connected: "z-toolbox"
				}
			};
		case "log":
			if (Array.isArray(msg.data)) {
				console.log(...msg.data);
			} else {
				console.log(msg.data);
			}
			return;
		default:
			return {
				error: `UNHANDLED_TYPE "${(<any>msg).type}"`,
				type: 'error'
			}
	}
}
