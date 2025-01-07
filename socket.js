const socketIO = require('socket.io');

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

  io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    // Xử lý user đăng nhập 
    socket.on('user_connected', (userId) => {
      // Lưu thông tin mapping
      onlineUsers.set(userId, socket.id);
      socketToUser.set(socket.id, userId);

      console.log(`User ${userId} connected with socket ${socket.id}`);
      
      // Thông báo danh sách online users
      io.emit('online_users', Array.from(onlineUsers.keys()));
    });

    // Xử lý gửi tin nhắn
    socket.on('send_message', (messageData) => {
      const { senderId, receiverId, content } = messageData;
      
      // Tạo message object với timestamp
      const message = {
        senderId,
        receiverId, 
        content,
        timestamp: new Date(),
      };

      // Lấy socket id của người nhận
      const receiverSocketId = onlineUsers.get(receiverId);

      if (receiverSocketId) {
        // Gửi tin nhắn đến người nhận nếu online
        io.to(receiverSocketId).emit('receive_message', message);
      }

      // Gửi xác nhận về cho người gửi
      socket.emit('message_sent', message);
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

    // Xử lý ngắt kết nối
    socket.on('disconnect', () => {
      // Lấy userId từ socketId
      const userId = socketToUser.get(socket.id);
      
      if (userId) {
        // Xóa mapping khi user offline
        onlineUsers.delete(userId);
        socketToUser.delete(socket.id);

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