#!/usr/local/bin/node

// Best to use a direct path on the shebang line in case node isn't in the
// PATH when launched by Chrome.

const {ChromeNativeBridge} = require('@josephuspaye/chrome-native-bridge'),
    fs = require('fs'),
    path = require('path'),
    fd = fs.openSync(path.join(__dirname, `log${Math.floor(Math.random() * 6000)}.txt`), 'a'),
    logFile = fs.createWriteStream(null, { fd })
;

function log(data, onDone) {
    logFile.write(JSON.stringify(data, null, '  '));
    logFile.write('\n', onDone);
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
        log(['ws open', `WEBSOCKET_OPENED: client connected to server at port ${port.toString()}`]);

        ws.send(JSON.stringify({
            type: 'ws open',
            data: port
        }));
    })

    ws.addEventListener('message', function(e) {
        let data = e.data;
        try {
            data = JSON.parse(data)
        } catch (_) {}

        log(['ws message', data]);
        bridge.emit({
            type: 'ws',
            data: data
        });
    });

    const onClose = function (e) {
        log(['ws close', `Socket is closed. Reconnect will be attempted in ${timeInterval / 1000} second. Reason : ${e.reason}`]);
        setTimeout(function () {
            connect();
        }, timeInterval);
    };

    ws.addEventListener('close', onClose);

    ws.addEventListener('error', function (err) {
        log(['ws error', 'Socket encountered error: ' + err.message]);
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
            log(message);
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'chrome',
                    data: message
                }));
            }
        },

        onError(err) {
            // There's been an error parsing a received message.
            // Do something to handle it here...
            log(['bridge error', err]);
        },

        onEnd() {
            // End of `process.stdin` detected: it's likely Chrome wants
            // to end the native host process, so we exit here
            log('stdin ended, exiting native host', () => {
                process.exit();
            });
        },
    }
);

// This is the origin of the caller, usually chrome-extension://[ID of allowed extension]
const origin = bridge.origin;

// This is the decimal handle value of the calling Chrome window. Available on Windows only.
const parentWindow = bridge.parentWindow;
