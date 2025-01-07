const io = require('socket.io-client');
const mongoose = require('mongoose');

// Tạo ObjectId hợp lệ cho test
const user1Id = new mongoose.Types.ObjectId().toString();
const user2Id = new mongoose.Types.ObjectId().toString();

const user1 = io('http://localhost:4000');
const user2 = io('http://localhost:4000');

// User 1 connect
user1.on('connect', () => {
  console.log('User 1 connected');
  user1.emit('user_connected', user1Id);
});

// User 2 connect 
user2.on('connect', () => {
  console.log('User 2 connected');
  user2.emit('user_connected', user2Id);
});

// Test gửi tin nhắn
setTimeout(() => {
  user1.emit('send_message', {
    senderId: user1Id,
    receiverId: user2Id,
    content: 'Test message from user 1'
  });
}, 1000);

// Log các events
user1.on('message_sent', (msg) => console.log('Message sent:', msg));
user2.on('receive_message', (msg) => console.log('Message received:', msg));
user1.on('error', (error) => console.error('Socket error:', error));
