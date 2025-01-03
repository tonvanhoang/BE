var express = require('express');
var router = express.Router();
const modelsComment = require('../models/comment');
const mongoose = require('mongoose')
const modelsReel = require('../models/reel');
/* GET home page. */
router.get('/allComment', async function(req, res, next) {
    const data = await modelsComment.find();
    res.json(data)
});


// reel
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


router.delete('/delete/:id', async function(req,res,next){
    try {
    const {id} = req.params;
    await modelsComment.findByIdAndDelete(id)
    res.status(201).json('thành công')
    } catch (error) {
        res.status(500).json('không thành công')
    }
})
// Add reply to comment
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
    
    const populatedReply = {
      // populate reply data
    };

    // Emit new reply event
    req.app.get('io').to(`reel:${comment.idReel}`).emit('newReply', {
      commentId: req.params.commentId,
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

// Thêm reply cho comment
router.post('/replyReel', async function(req, res, next) {
  try {
    const { comment, idReel, idAccount, parentCommentId } = req.body;
    const _id = new mongoose.Types.ObjectId();
    
    const data = await modelsComment.create({
      _id,
      comment,
      idReel,
      idAccount,
      parentCommentId
    });

    res.status(201).json({ message: 'Reply added successfully', data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add reply', error });
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

// Trong phần xử lý comment cho reel
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

module.exports = router;
