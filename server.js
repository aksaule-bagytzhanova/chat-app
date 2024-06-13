const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let users = {};

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'login':
        users[data.userId] = ws;
        broadcast({
          type: 'userStatus',
          userId: data.userId,
          status: 'online'
        });
        break;
      case 'message':
        if (users[data.to]) {
          users[data.to].send(JSON.stringify({
            type: 'message',
            from: data.from,
            text: data.text
          }));
        }
        break;
      case 'typing':
        if (users[data.to]) {
          users[data.to].send(JSON.stringify({
            type: 'typing',
            from: data.from
          }));
        }
        break;
      case 'logout':
        delete users[data.userId];
        broadcast({
          type: 'userStatus',
          userId: data.userId,
          status: 'offline'
        });
        break;
    }
  });

  ws.on('close', () => {
    for (const userId in users) {
      if (users[userId] === ws) {
        delete users[userId];
        broadcast({
          type: 'userStatus',
          userId,
          status: 'offline'
        });
        break;
      }
    }
  });
});

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
