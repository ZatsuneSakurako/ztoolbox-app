#!/usr/local/bin/node
// Best to use a direct path on the shebang line in case node isn't in the
// PATH when launched by Chrome.

import fs from "fs";
import path from "path";
import {ChromeNativeBridge} from "@josephuspaye/chrome-native-bridge";

import dotenv from "dotenv";
import WebSocket from "ws";

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
            if (ws) {
                ws.send(JSON.stringify({
                    type: 'log',
                    data
                }));
            }

            onDone();
        }
    })
}



const url = 'ws://localhost:42080',
    timeInterval = 5000
;

let ws : WebSocket,
    messageReceived = false
;
function connect() {
    ws = new WebSocket(url, {
        headers : {
            token: "VGWm4VnMVm72oIIEsaOd97GXNU6_Vg3Rv67za8Fzal9aAWNVUb1AWfAKktIu922c"
        }
    });
    ws.addEventListener('open', function(port) {
        log(['ws open', `WEBSOCKET_OPENED: client connected to server at port ${JSON.stringify(port)}`])
            .catch(() => {})
        ;
    });

    ws.addEventListener('message', function(e) {
        messageReceived = true;
        let data = e.data.toString();
        try {
            data = JSON.parse(data);
        } catch (_) {}

        bridge.emit(data);
    });

    ws.addEventListener('close', function (e: WebSocket.CloseEvent) {
        log(['ws close', `Socket is closed. Reconnect will be attempted in ${timeInterval / 1000} second. Reason : ${e.reason}`])
            .catch(() => {})
        ;

        if (messageReceived) {
            bridge.emit({
                error: false,
                type: 'ws close',
                result: {
                    disconnected: "z-toolbox"
                }
            });
        }
        messageReceived = false;

        ws.removeAllListeners();
        setTimeout(function () {
            connect();
        }, timeInterval);
    });

    ws.addEventListener('error', function (err) {
        log(['ws error', 'Socket encountered error: ' + err.message])
            .catch(() => {})
        ;
        ws.close();
    });
}

connect();



const bridge = new ChromeNativeBridge(
    process.argv, // The arguments to the current process
    process.stdin, // The input stream that Chrome writes to
    process.stdout, // The output stream that Chrome reads from
    {
        onMessage(message) {
            log(message)
                .catch(() => {})
            ;
            if (ws && ws.readyState === WebSocket.OPEN) {
                let output = message;

                if (typeof message === 'object' && message !== null) {
                    if (!!message.type && !!message.data) {
                        output = message;
                    } else {
                        output = {
                            type: 'nativeMessage',
                            data: message
                        };
                    }
                } else {
                    output = {
                        type: 'nativeMessage',
                        data: {
                            command: message
                        }
                    }
                }

                ws.send(JSON.stringify(output));
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
