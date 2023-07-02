#!/bin/node
// Best to use a direct path on the shebang line in case node isn't in the
// PATH when launched by Chrome.

import fs from "fs";
import path from "path";
import {ChromeNativeBridge} from "@josephuspaye/chrome-native-bridge";
import {EventEmitter} from "events";

import dotenv from "dotenv";
import { io, Socket } from "socket.io-client";
import {ClientToServerEvents, ServerToClientEvents} from "../classes/bo/chromeNative";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



dotenv.config({
    path: path.normalize(__dirname + '/../.env')
});

let logFile: fs.WriteStream;
function log(...data:any[]) {
    return new Promise<void>((onDone) => {
        if (process.env.NATIVE_LOG_FILE) {
            if (!logFile) {
                const logsDir = path.normalize(__dirname + '/logs');
                if (!fs.existsSync(logsDir)) {
                    fs.mkdirSync(logsDir)
                }

                logFile = fs.createWriteStream(__dirname + '/logs/' + `${Math.floor(Math.random() * 6000)}.log`, {
                    flags: 'a'
                });
            }

            logFile.write(JSON.stringify(data));
            logFile.write('\n', () => {
                onDone();
            });
        } else {
            bridge.emit({
                type: 'log',
                data
            });
            onDone();
        }
    })
}



const url = 'ws://localhost:42080';

// please note that the types are reversed
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(url, {
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    randomizationFactor: 1, // Not needed, only local server
    extraHeaders: {
        token: "VGWm4VnMVm72oIIEsaOd97GXNU6_Vg3Rv67za8Fzal9aAWNVUb1AWfAKktIu922c"
    }
});

socket.on('connect', function () {
    log('ws open', 'WEBSOCKET_OPENED: client connected to server')
        .catch(() => {})
    ;
});

socket.on('connect_error', function (err) {
    log('ws error', 'Socket encountered error: ' + err.message)
        .catch(() => {})
    ;
});

socket.on('ws open', function (err) {
    bridge.emit({
        error: false,
        type: 'ws open',
        data: err
    });
});

socket.on('log', function (...args) {
    bridge.emit({
        error: false,
        type: 'log',
        data: args
    });
});

function randomId(): string {
    let output = '';
    // noinspection SpellCheckingInspection
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
    for (let i = 0; i <= 16; i++) {
        characters.sort(() => {
            return Math.random() * 2 - 1;
        });
        output += characters[Math.round(Math.random() * characters.length - 1)];
    }
    return output;
}

socket.on('ping', function (cb) {
    const _id = randomId();
    bridge.emit({
        error: false,
        _id,
        type: 'ping'
    });
    bridgeEventEmitter.on('commandReply', function listener(message) {
        if (!message || message._id !== _id) return;

        bridgeEventEmitter.off('commandReply', listener);
        cb({
            error: false,
            result: 'pong'
        });
    });
});

socket.on('sendNotification', (opts, cb) => {
	const _id = randomId();
	bridge.emit({
		error: false,
		_id,
		opts,
		type: 'sendNotification'
	});
	bridgeEventEmitter.on('commandReply', function listener(message) {
		if (!message || message._id !== _id) return;

		bridgeEventEmitter.off('commandReply', listener);
		cb({
			error: false,
			result: message.data
		});
	});
});

socket.on('openUrl', (url:string) => {
	bridge.emit({
		error: false,
		url,
		type: 'openUrl'
	});
});

socket.on('onSettingUpdate', function (preference) {
    bridge.emit({
        error: false,
        type: 'onSettingUpdate',
        data: preference
    });
})

socket.on('disconnect', function (reason, description) {
    log('ws close', `Socket is closed. Reason : ${reason}`, description)
        .catch(() => {})
    ;

    bridge.emit({
        error: false,
        type: 'ws close',
        result: {
            disconnected: "z-toolbox"
        }
    });
})



function onReply(message: any, err:any, ...args: unknown[]) {
    bridge.emit({
        _id: message._id,
        type: 'commandReply',
        result: args.length === 1 ? args.at(0) : args
    });
}

const bridgeEventEmitter = new EventEmitter();
const bridge = new ChromeNativeBridge(
    process.argv, // The arguments to the current process
    process.stdin, // The input stream that Chrome writes to
    process.stdout, // The output stream that Chrome reads from
    {
        onMessage(message) {
            let result = false;
            if (!!message && typeof message === 'object' && !!message.type) {
                result = bridgeEventEmitter.emit(message.type, message);

                if (socket.active && message.type !== 'commandReply') {
                    result = true;
                    const emitData = !message.data ? [] :
                        (Array.isArray(message.data) ?
                            message.data
                            :
                            [message.data])
                    ;

                    if (message._id) {
                        emitData.push((err: any, ...args: unknown[]) => {
                            log(err, ...args)
                                .catch(console.error)
                            ;
                            onReply(message, err, ...args);
                        });
                    }

                    socket.timeout(10000).emit(message.type, ...emitData);
                }
            }

            if (!result) {
                bridge.emit({
                    type: 'log',
                    data: 'UNEXPECTED_MESSAGE',
                    message
                });
            }
        },

        onError(err) {
            // There's been an error parsing a received message.
            // Do something to handle it here...
            log('bridge error', err)
                .catch(() => {})
            ;
        },

        onEnd() {
            // End of `process.stdin` detected: it's likely Chrome wants
            // to end the native host process, so we exit here
            log('stdin ended, exiting native host')
                .finally(() => {
                    process.exit();
                })
            ;
        },
    }
);

// This is the origin of the caller, usually chrome-extension://[ID of allowed extension]
// noinspection JSUnusedLocalSymbols
const origin = bridge.origin;

// This is the decimal handle value of the calling Chrome window. Available on Windows only.
// noinspection JSUnusedLocalSymbols
const parentWindow = bridge.parentWindow;
