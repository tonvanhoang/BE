const socketIO = require('socket.io');

function initSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Xử lý kết nối socket
  io.on('connection', (socket) => {
    console.log('A user connected');

    // Xử lý user kết nối
    socket.on('user_connected', (userId) => {
      socket.userId = userId;
      console.log('User connected:', userId);
    });

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
      console.log('User joined conversation:', conversationId);
    });

    // Xử lý gửi tin nhắn
    socket.on('send_message', (messageData) => {
      socket.to(messageData.conversationId).emit('receive_message', messageData);
    });

    // Xử lý xóa tin nhắn
    socket.on('delete_message', (data) => {
      socket.to(data.conversationId).emit('message_deleted', {
        messageId: data.messageId
      });
    });

    socket.on('send_reply', async (data) => {
      const { messageId, replyData } = data;
      // Broadcast reply to all users in conversation
      socket.to(data.conversationId).emit('receive_reply', {
        messageId,
        replyData
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });

    // Handle joining reel room
    socket.on('joinReel', (reelId) => {
      socket.join(`reel:${reelId}`);
      console.log(`User joined reel room: ${reelId}`);
    });

    // Handle leaving reel room
    socket.on('leaveReel', (reelId) => {
      socket.leave(`reel:${reelId}`);
      console.log(`User left reel room: ${reelId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  return io;
}

module.exports = initSocket;