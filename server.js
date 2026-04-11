const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));  // serves your HTML

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join a room
    socket.on('joinRoom', (room) => {
        socket.join(room);
        socket.to(room).emit('message', {
            user: 'System',
            text: `A new user joined ${room}`
        });
    });

    // Receive and broadcast a message
    socket.on('sendMessage', ({ room, user, text }) => {
        io.to(room).emit('message', { user, text });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));