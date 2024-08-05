document.addEventListener('DOMContentLoaded', () => {
    const usernameForm = document.getElementById('username-form');
    const roomCardsContainer = document.getElementById('room-cards-container');

    // Example room data
    const rooms = [
        { name: 'JavaScript', description: 'Discuss JavaScript, frameworks, and libraries.' },
        { name: 'Python', description: 'Talk about Python, data science, and web development.' },
        { name: 'Data Structures', description: 'Learn and discuss various data structures.' },
        { name: 'Algorithms', description: 'Explore and solve algorithm problems.' },
        { name: 'Contests', description: 'Participate in or discuss coding contests.' },
    ];

    usernameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = e.target.elements.username.value;

        // Hide the form
        usernameForm.style.display = 'none';

        // Create and display room cards
        rooms.forEach(room => {
            const card = document.createElement('div');
            card.className = 'room-card';
            card.innerHTML = `
                <h3>${room.name}</h3>
                <p>${room.description}</p>
                <a href="chat.html?username=${encodeURIComponent(username)}&room=${encodeURIComponent(room.name)}" class="btn">Join</a>
            `;
            roomCardsContainer.appendChild(card);
        });

        // Show the room cards container
        roomCardsContainer.style.display = 'grid';
    });
});

const chatform = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});
const socket = io();

// Join chatroom
socket.emit('joinRoom', { username, room });

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
});

// Message from server
socket.on('message', message => {
    console.log(message);
    outputMessage(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatform.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get message text
    const msg = e.target.elements.msg.value;

    // Emit message to server
    socket.emit('chatMessage', msg);

    // Clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});

// Output message to DOM
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
                     <p class="text">${message.text}</p>`;
    document.querySelector('.chat-messages').appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
    roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
    userList.innerHTML = `
        ${users.map(user => `<li>${user.username}</li>`).join('')}
    `;
}
