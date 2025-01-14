var express = require('express');
var router = express.Router();
const modelsComment = require('../models/comment');
const mongoose = require('mongoose');
const modelsReel = require('../models/reel');

/* GET home page. */
router.get('/allComment', async function(req, res, next) {
    const data = await modelsComment.find();
    res.json(data)
});

// API thêm bình luận mới
router.post('/addpost', async function(req, res, next) {
  try {
    const { comment, idPost, idAccount,dateComment } = req.body;
    const _id = new mongoose.Types.ObjectId();

    // Tạo bình luận mới trong cơ sở dữ liệu
    const data = await modelsComment.create({
      _id,
      comment,
      idPost,
      idAccount,
      dateComment,
      likes: 0,
      isLiked: false,
      repComment: [],
    });
    // Lấy dữ liệu bình luận với thông tin tài khoản (populate)
    const populatedComment = await modelsComment
      .findById(data._id)
    // Phát sự kiện real-time cho tất cả client với bình luận mới và thông tin tài khoản
    req.app.get('io').emit('newComment', populatedComment);
    res.status(201).json({ message: 'Thêm thành công', data: populatedComment });
  } catch (error) {
    res.status(500).json({ message: 'Không thành công', error });
  }
});

// API lấy bình luận theo bài viết
router.get('/commentByPost/:id', async function(req, res, next) {
  const { id } = req.params;
  try {
    const comments = await modelsComment
      .find({ idPost: id })
    req.app.get('io').emit('commentsByPost', comments);
    res.json(comments); 
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy bình luận', error });
  }
});

// API để trả lời bình luận
router.post('/repPost/:id', async function(req, res, next) {
  try {
    const { id } = req.params;
    const { idAccount, text,date } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!idAccount || !text) {
      return res.status(400).json({ message: 'Thiếu thông tin idAccount hoặc text' });
    }

    // Tìm bình luận gốc
    const comment = await modelsComment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: 'Bình luận không tồn tại' });
    }

    // Tạo phản hồi mới
    const newReply = {
      _id: new mongoose.Types.ObjectId(),
      idAccount,
      text,
      date
    };

    // Thêm phản hồi vào bình luận gốc
    comment.repComment.push(newReply);
    await comment.save();

    // Phát sự kiện real-time cho tất cả client với phản hồi mới
    req.app.get('io').emit('replyAdded', { commentId: id, ...newReply });

    res.status(201).json({ message: 'Thêm phản hồi thành công', data: newReply });
  } catch (error) {
    res.status(500).json({ message: 'Không thành công', error });
  }
});
// Thêm reply cho bình luận
router.post('/reply/:commentId', async function(req, res, next) {
  try {
    const { commentId } = req.params;
    const { text, idAccount } = req.body;

    const comment = await modelsComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.repComment.push({
      idAccount: new mongoose.Types.ObjectId(idAccount),
      text,
      date: new Date().toISOString(),
      likes: 0,
      isLiked: false
    });

    await comment.save();
    
    const updatedComment = await modelsComment
      .findById(commentId)
      .populate('idAccount', 'firstName lastName avatar')
      .populate('repComment.idAccount', 'firstName lastName avatar');

    req.app.get('io').emit('newReply', {
      commentId: commentId,
      reply: updatedComment.repComment[updatedComment.repComment.length - 1] // New reply
    });

    res.json(updatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add reply', error });
  }
});

// Thêm comment cho reel
router.post('/addReel', async function(req, res) {
  try {
    const { comment, idReel, idAccount } = req.body;
    const _id = new mongoose.Types.ObjectId();
    const data = await modelsComment.create({ _id, comment, idReel, idAccount });

    // Cập nhật số lượng comment trong Reel
    await modelsReel.findByIdAndUpdate(idReel, { $inc: { comments: 1 } });

    // Populate thông tin người dùng trước khi emit
    const populatedComment = await modelsComment
      .findById(data._id)
      .populate('idAccount', 'firstName lastName avatar');

    // Emit sự kiện newComment với comment đã được populate
    const io = req.app.get('io');
    io.to(`reel:${idReel}`).emit('newComment', populatedComment);

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Failed to add comment', error });
  }
});

// Lấy comment theo reel
router.get('/commentByReel/:id', async function(req, res) {
  try {
    const { id } = req.params;
    console.log('Fetching comments for reel:', id);

    const comments = await modelsComment
      .find({ idReel: id })
      .populate('idAccount', 'firstName lastName avatar')
      .populate('repComment.idAccount', 'firstName lastName avatar')
      .sort({ dateComment: -1 });

    console.log('Found comments:', comments);
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments', error });
  }
});

// Xóa comment
router.delete('/delete/:id', async function(req,res,next){
    try {
    const {id} = req.params;
    await modelsComment.findByIdAndDelete(id)
    res.status(201).json('thành công')
    } catch (error) {
        res.status(500).json('không thành công')
    }
});

// Thêm reply cho comment
router.post('/reply/:commentId', async function(req, res, next) {
  try {
    const { commentId } = req.params;
    const { text, idAccount } = req.body;

    const comment = await modelsComment.findById(commentId)
      .populate('idAccount', 'firstName lastName avatar');

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Tạo reply mới
    const newReply = {
      idAccount: new mongoose.Types.ObjectId(idAccount),
      text,
      date: new Date().toISOString(),
      likes: 0,
      isLiked: false
    };

    // Thêm reply vào comment
    comment.repComment.push(newReply);
    await comment.save();

    // Populate thông tin người dùng cho reply mới
    const populatedComment = await modelsComment.findById(commentId)
      .populate('idAccount', 'firstName lastName avatar')
      .populate('repComment.idAccount', 'firstName lastName avatar');

    const populatedReply = populatedComment.repComment[populatedComment.repComment.length - 1];

    // Emit socket event với reply đã được populate
    req.app.get('io').to(`reel:${comment.idReel}`).emit('newReply', {
      commentId: commentId,
      reply: populatedReply
    });

    res.json(populatedReply);
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ message: 'Failed to add reply', error });
  }
});

// Get replies for a comment
router.get('/replies/:commentId', async function(req, res, next) {
  try {
    const { commentId } = req.params;
    const comment = await modelsComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    res.json(comment.replies);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get replies', error });
  }
});

// API để like/unlike comment
router.put('/like/:commentId', async function(req, res) {
  try {
    const comment = await modelsComment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.isLiked = !comment.isLiked;
    comment.likes = comment.isLiked ? comment.likes + 1 : comment.likes - 1;
    await comment.save();

    // Emit like update event
    req.app.get('io').to(`reel:${comment.idReel}`).emit('commentLikeUpdate', {
      commentId: comment._id,
      likes: comment.likes,
      isLiked: comment.isLiked
    });

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update like status', error });
  }
});

// API để like/unlike reply
router.put('/like-reply/:commentId/:replyId', async function(req, res) {
  try {
    const { commentId, replyId } = req.params;
    const comment = await modelsComment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const reply = comment.repComment.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    reply.isLiked = !reply.isLiked;
    reply.likes = reply.isLiked ? reply.likes + 1 : reply.likes - 1;
    
    await comment.save();

    // Emit reply like update event
    req.app.get('io').to(`reel:${comment.idReel}`).emit('replyLikeUpdate', {
      commentId: req.params.commentId,
      replyId: req.params.replyId,
      likes: reply.likes,
      isLiked: reply.isLiked
    });

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update reply like status', error });
  }
});

module.exports = router;