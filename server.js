const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const runner = require('child_process');

const port = 8080;
const log = console.log;
const clients = new Set(); //all connected clients
const id = Symbol('id');

let currentClient = 0;
let wss = new WebSocket.Server({noServer: true});
let server = http.createServer(accept);
server.listen(port);
log(`start listening ${port}`);

var startUrl = `http://localhost:${port}`;
var start = (process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open');
runner.exec(start + ' ' + startUrl);

function accept(req, res) {
    log(`accept: ${req.url}`);
    if (req.url == '/ws' && req.headers.upgrade && req.headers.upgrade.toLowerCase() == 'websocket') {
        wss.handleUpgrade(req, req.socket, Buffer.alloc(0), connect);
    }
    else if (req.url == '/') {
        fs.createReadStream('./index.html').pipe(res);
    }
    else {
        res.writeHead(404);
        res.write(`<!DOCTYPE html>Not Found: ${req.url}<br/>Try <a href='/'>this</a>`);
        res.end();
    }
}

function connect(ws) {
    ws[id] = ++currentClient;
    log(`connected: ${ws[id]}`);
    clients.add(ws);
    
    ws.on('message', function(message) {
        message = message.slice(0, 100);
        log(`message from ${ws[id]}: ${message}`);
        for (let client of clients) {
            client.send(message);
        }
    });

    ws.on('close', function() {
        log(`disconnected: ${ws[id]}`);
        clients.delete(ws);
    });
}
