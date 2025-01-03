function initReelHandlers(io) {
  io.on('connection', (socket) => {
    // Handle reel interactions
    socket.on('joinReel', (reelId) => {
      socket.join(`reel:${reelId}`);
    });

    socket.on('leaveReel', (reelId) => {
      socket.leave(`reel:${reelId}`);
    });

    socket.on('new_reel_comment', async (data) => {
      try {
        const { reelId, comment } = data;
        // Broadcast comment to all connected clients except sender
        socket.broadcast.emit('reel_comment_received', {
          reelId,
          comment
        });
      } catch (error) {
        console.error('Error handling new reel comment:', error);
      }
    });

    socket.on('new_reel_like', (data) => {
      try {
        const { reelId, userId } = data;
        // Broadcast like to all connected clients except sender
        socket.broadcast.emit('reel_like_received', {
          reelId,
          userId
        });
      } catch (error) {
        console.error('Error handling new reel like:', error);
      }
    });
  });
}

module.exports = initReelHandlers;