import http from "http";
import {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData
} from "./bo/chromeNative";
import {settings} from "../main";
import {showSection} from "./windowManager";
import {Server} from "socket.io";



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

io.on("connection", (socket) => {
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

	socket.on('log', function (...data) {
		console.log(...data);
	});

	socket.on('extensionName', function (extensionName) {
		socket.data.extensionId = extensionName.extensionId;
		socket.data.userAgent = extensionName.userAgent;
	});
});

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
