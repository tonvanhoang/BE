const initMessageHandlers = (io, userSocketMap) => {
  io.on('connection', (socket) => {
    // Handle user connection
    socket.on('user_connected', (userId) => {
      userSocketMap.set(userId, socket.id);
      console.log(`User ${userId} connected with socket ${socket.id}`);
    });

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} joined conversation: ${conversationId}`);
    });

    // Handle new message
    socket.on('new_message', async (data) => {
      const { conversationId, senderId, receiverId, content } = data;
      console.log('New message received:', data);

      // Emit to conversation room
      io.to(`conversation:${conversationId}`).emit('receive_message', {
        conversationId,
        senderId,
        content,
        timestamp: new Date()
      });

      // Also emit to specific receiver if they're not in the conversation room
      const receiverSocketId = userSocketMap.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('new_message_notification', {
          conversationId,
          senderId,
          content
        });
      }
    });

    // Handle message deletion
    socket.on('delete_message', (data) => {
      const { conversationId, messageId } = data;
      io.to(`conversation:${conversationId}`).emit('message_deleted', {
        messageId
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      // Remove user from userSocketMap
      for (const [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });
};

module.exports = initMessageHandlers;