const express = require('express');
const path = require('path');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const WebSocket = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');

const PORT = process.env.PORT || 5000;

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
    },
});

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws, request) => {
    setupWSConnection(ws, request);
    console.log('Y.js client connected');
});

server.on('upgrade', (request, socket, head) => {
    if (request.url.startsWith('/yjs')) {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    }
});

app.use(express.static(path.join(__dirname, 'collab.code', 'build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'collab.code', 'build', 'index.html'));
});

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            username: io.sockets.sockets.get(socketId)?.username,
        };
    });
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);
    socket.on('join', ({ roomId, username }) => {
        socket.username = username;
        socket.roomId = roomId;     
        socket.join(roomId);

        const clients = getAllConnectedClients(roomId);
        console.log(`${username} joined room ${roomId} | clients: ${clients.length}`);

        clients.forEach(({ socketId }) => {
            io.to(socketId).emit('joined', {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });


    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit('disconnected', {
                socketId: socket.id,
                username: socket.username,
            });
        });
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});