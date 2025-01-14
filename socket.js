const socketIO = require('socket.io');
const Message = require('./models/message');

function initSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Lưu trữ thông tin user online
  const onlineUsers = new Map(); // userId -> socketId
  const socketToUser = new Map(); // socketId -> userId
  const activeUsers = new Map(); // Lưu trữ socket.id cho mỗi userId

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Message Sockets
    socket.on('user_connected', (userId) => {
      // Lưu thông tin mapping
      onlineUsers.set(userId, socket.id);
      socketToUser.set(socket.id, userId);
      activeUsers.set(userId, socket.id);

      console.log(`User ${userId} connected with socket ${socket.id}`);
      
      // Thông báo danh sách online users
      io.emit('online_users', Array.from(onlineUsers.keys()));
    });

    socket.on('join_conversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Xử lý gửi tin nhắn
    socket.on('send_message', async (messageData) => {
      try {
        console.log('Received message:', messageData);
        
        // Gửi tin nhắn đến conversation room
        socket.to(messageData.conversationId).emit('new_message', {
          ...messageData,
          isSentByCurrentUser: false
        });

        // Gửi tin nhắn đến người nhận cụ thể nếu online
        const receiverSocketId = onlineUsers.get(messageData.receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', {
            ...messageData,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });

    socket.on('send_reply', async (messageData) => {
      try {
        console.log('Received reply:', messageData);
        socket.to(messageData.conversationId).emit('new_message', {
          ...messageData,
          isSentByCurrentUser: false
        });
      } catch (error) {
        console.error('Error handling reply:', error);
      }
    });

    // Xử lý typing status
    socket.on('typing', (data) => {
      const { senderId, receiverId } = data;
      const receiverSocketId = onlineUsers.get(receiverId);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', {
          senderId,
          isTyping: true
        });
      }
    });

    socket.on('stop_typing', (data) => {
      const { senderId, receiverId } = data;
      const receiverSocketId = onlineUsers.get(receiverId);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', {
          senderId,
          isTyping: false
        });
      }
    });

    // Reel Sockets
    socket.on('joinReel', (reelId) => {
      socket.join(`reel:${reelId}`);
      console.log(`Socket ${socket.id} joined reel room: ${reelId}`);
    });

    socket.on('leaveReel', (reelId) => {
      socket.leave(`reel:${reelId}`);
      console.log(`Socket ${socket.id} left reel room: ${reelId}`);
    });

    // Handle new comments
    socket.on('newComment', (data) => {
      console.log('New comment received:', data);
      io.to(`reel:${data.reelId}`).emit('newComment', data.comment);
    });

    // Handle new replies
    socket.on('newReply', (data) => {
      console.log('New reply received:', data);
      io.to(`reel:${data.reelId}`).emit('newReply', {
        commentId: data.commentId,
        reply: data.reply
      });
    });

    // Handle comment likes
    socket.on('commentLikeUpdate', (data) => {
      io.to(`reel:${data.reelId}`).emit('commentLikeUpdate', {
        commentId: data.commentId,
        likes: data.likes,
        isLiked: data.isLiked
      });
    });

    // Handle reply likes
    socket.on('replyLikeUpdate', (data) => {
      io.to(`reel:${data.reelId}`).emit('replyLikeUpdate', {
        commentId: data.commentId,
        replyId: data.replyId,
        likes: data.likes,
        isLiked: data.isLiked
      });
    });

    // Handle reel likes
    socket.on('reelLikeUpdate', (data) => {
      io.emit('reelLikeUpdate', {
        reelId: data.reelId,
        isLiked: data.isLiked,
        totalLikes: data.totalLikes,
        userId: data.userId
      });
    });

    // Xử lý ngắt kết nối
    socket.on('disconnect', () => {
      // Lấy userId từ socketId
      const userId = socketToUser.get(socket.id);
      
      if (userId) {
        // Xóa mapping khi user offline
        onlineUsers.delete(userId);
        socketToUser.delete(socket.id);
        activeUsers.delete(userId);

        // Thông báo cho các users khác
        io.emit('online_users', Array.from(onlineUsers.keys()));
        io.emit('user_disconnected', userId);
      }

      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
}

module.exports = initSocket;