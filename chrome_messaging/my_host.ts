#!/usr/local/bin/node
// Best to use a direct path on the shebang line in case node isn't in the
// PATH when launched by Chrome.

import fs from "fs";
import path from "path";
import {ChromeNativeBridge} from "@josephuspaye/chrome-native-bridge";

import dotenv from "dotenv";
import { io, Socket } from "socket.io-client";
import {ClientToServerEvents, ServerToClientEvents, SocketMessage} from "../classes/bo/chromeNative";

dotenv.config({
    path: path.normalize(__dirname + '/../.env')
});

let logFile: fs.WriteStream;
function log(data:string|object) {
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
        } else if (process.env.CHROME_BRIDGE_LOG) {
            bridge.emit({
                type: 'log',
                data
            });
            onDone();
        } else {
            if (socket.active) {
                socket.send('log', data);
            }
            onDone();
        }
    })
}



const url = 'ws://localhost:42080';

// please note that the types are reversed
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(url, {
    extraHeaders: {
        token: "VGWm4VnMVm72oIIEsaOd97GXNU6_Vg3Rv67za8Fzal9aAWNVUb1AWfAKktIu922c"
    }
});

socket.on('connect', function () {
    log(['ws open', 'WEBSOCKET_OPENED: client connected to server'])
        .catch(() => {})
    ;
});

socket.on('connect_error', function (err) {
    log(['ws error', 'Socket encountered error: ' + err.message])
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

socket.on('disconnect', function (reason, description) {
    log(['ws close', `Socket is closed. Reason : ${reason}`, JSON.stringify(description)])
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



function onReply(message: any, ...args: unknown[]) {
    bridge.emit({
        _id: message._id,
        type: 'commandReply',
        result: args.length === 1 ? args.at(0) : args
    });
}

const bridge = new ChromeNativeBridge(
    process.argv, // The arguments to the current process
    process.stdin, // The input stream that Chrome writes to
    process.stdout, // The output stream that Chrome reads from
    {
        onMessage(message) {
            log(message)
                .catch(() => {})
            ;

            if (socket.active && typeof message === 'object' && message !== null && !!message.type) {
                const emitData = !!message.data && Array.isArray(message.data) ?
                    message.data
                    :
                    (!!message.data ? [message.data] : [])
                ;

                if (message._id) {
                    emitData.push((...args: unknown[]) => {
                        log([...args]);
                        onReply(message, ...args);
                    });
                }

                socket.emit(message.type, ...emitData);
            } else {
                log(['UNEXPECTED_MESSAGE', JSON.stringify(message)]);
                bridge.emit({
                    type: 'log',
                    data: 'UNEXPECTED_MESSAGE'
                });
            }
        },

        onError(err) {
            // There's been an error parsing a received message.
            // Do something to handle it here...
            log(['bridge error', err])
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
