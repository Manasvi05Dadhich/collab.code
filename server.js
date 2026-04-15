const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
    },
});

const PORT = process.env.PORT || 5000;

/* ── Helper: get all connected clients in a room ── */
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

    /* ── JOIN: user joins a room ── */
    socket.on('join', ({ roomId, username }) => {
        socket.username = username;   // store on socket for later lookups
        socket.roomId = roomId;       // store for disconnect cleanup
        socket.join(roomId);

        const clients = getAllConnectedClients(roomId);
        console.log(`${username} joined room ${roomId} | clients: ${clients.length}`);

        // Notify everyone in the room (including the new joiner)
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit('joined', {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    /* ── CODE-CHANGE: relay code to everyone else in the room ── */
    socket.on('code-change', ({ roomId, code }) => {
        socket.in(roomId).emit('code-change', { code });
    });

    /* ── SYNC-CODE: send current code to a specific new joiner ── */
    socket.on('sync-code', ({ socketId, code }) => {
        io.to(socketId).emit('code-change', { code });
    });

    /* ── DISCONNECT: notify others in the room ── */
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