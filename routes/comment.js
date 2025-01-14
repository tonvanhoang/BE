const express = require('express');
const router = express.Router();
const modelsComment = require('../models/comment');
const modelsAccount = require('../models/account');
const mongoose = require('mongoose');

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
// Lấy bình luận theo reel
router.get('/commentByReel/:id', async function(req, res) {
  try {
    const { id } = req.params;
    const comments = await modelsComment
      .find({ idReel: id })
      .populate('idAccount', 'firstName lastName avatar')
      .populate('repComment.idAccount', 'firstName lastName avatar')
      .sort({ dateComment: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch comments', error });
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

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to like/unlike comment', error });
  }
});

module.exports = router;