const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const botName = 'Room Admin';
const aiBotName = 'AI Bot';

// Initialize GoogleGenerativeAI
const genAI = new GoogleGenerativeAI('AIzaSyDyCB3H8TRa-FZy6Nrgkv748Hzxm2XOW6Q');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        // Welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to coding rooms'));

        // Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the room`));

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

        // Check if the user is alone in the room
        const users = getRoomUsers(user.room);
        if (users.length === 1) {
            // Send a message from the AI bot
            sendAIBotMessage(user.room, 'Hello! I am your AI assistant. How can I help you today?');
        }
    });

    // Listen for chatMessage
    socket.on('chatMessage', async msg => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));

        // Process the AI response
        await sendAIBotMessage(user.room, msg);
    });

    // Listen for image upload
    socket.on('imageUpload', image => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('imageMessage', image);
    });

    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the room`));

            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });

            // Check if the AI bot needs to leave
            const users = getRoomUsers(user.room);
            if (users.length === 1) {
                io.to(user.room).emit('message', formatMessage(aiBotName, 'AI Bot is leaving because another user has joined the room.'));
            }
        }
    });
});

// AI Bot Functionality
async function sendAIBotMessage(room, message) {
    try {
        const result = await model.generateContent(message);
        const aiMessage = await result.response.text();
        io.to(room).emit('message', formatMessage('AI Bot', aiMessage));
    } catch (error) {
        console.error('Error sending AI bot message:', error);
    }
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
