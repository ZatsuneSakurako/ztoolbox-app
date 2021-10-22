#!/usr/local/bin/node

// Best to use a direct path on the shebang line in case node isn't in the
// PATH when launched by Chrome.

const {ChromeNativeBridge} = require('@josephuspaye/chrome-native-bridge'),
    fs = require('fs'),
    path = require('path')
;

require('dotenv').config({
    path: path.normalize(__dirname + '/../.env')
});

let fd, logFile;
function log(data) {
    return new Promise(onDone => {
        if (process.env.NATIVE_LOGS) {
            if (!logFile) {
                fd = fs.openSync(path.normalize(__dirname + '/logs/' + `${Math.floor(Math.random() * 6000)}.log`), 'a');
                logFile = fs.createWriteStream(null, { fd });
            }

            logFile.write(JSON.stringify(data));
            logFile.write('\n', onDone);
        } else {
            onDone();
        }
    })
}



const WebSocket = require("ws"),
    url = 'ws://localhost:42080',
    timeInterval = 5000
;

/**
 *
 * @type {WebSocket|undefined}
 */
let ws;
function connect() {
    ws = new WebSocket(url);
    ws.addEventListener('open', function(port) {
        log(['ws open', `WEBSOCKET_OPENED: client connected to server at port ${JSON.stringify(port)}`])
            .catch(() => {})
        ;

        ws.send(JSON.stringify({
            type: 'ws open',
            port,
            bridge
        }));
    })

    ws.addEventListener('message', function(e) {
        let data = e.data;
        try {
            data = JSON.parse(data)
        } catch (_) {}

        log(['ws message', data])
            .catch(() => {})
        ;
        bridge.emit(data);
    });

    const onClose = function (e) {
        log(['ws close', `Socket is closed. Reconnect will be attempted in ${timeInterval / 1000} second. Reason : ${e.reason}`])
            .catch(() => {})
        ;
        setTimeout(function () {
            connect();
        }, timeInterval);
    };

    ws.addEventListener('close', onClose);

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
                ws.send(JSON.stringify({
                    type: 'nativeMessage',
                    data: message
                }));
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
const origin = bridge.origin;

// This is the decimal handle value of the calling Chrome window. Available on Windows only.
const parentWindow = bridge.parentWindow;
