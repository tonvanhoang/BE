var express = require('express');
var router = express.Router();
const modelsComment = require('../models/comment');
const mongoose = require('mongoose')
/* GET home page. */
router.get('/allComment', async function(req, res, next) {
    const data = await modelsComment.find();
    res.json(data)
});
// API để trả lời bình luận
router.post('/repPost/:id', async function(req, res, next) {
    try {
        const { id } = req.params; // Lấy ID của bình luận từ tham số URL
        const { idAccount, text } = req.body; // Lấy userId và nội dung phản hồi từ body request
        const newReply = {
            idAccount: idAccount,
            text: text,
        };
        // Tìm và cập nhật bình luận bằng cách thêm repComment vào mảng
        const updatedComment = await modelsComment.findByIdAndUpdate(
            id, 
            { $push: { repComment: newReply } }, // Dùng $push để thêm phản hồi vào mảng repComment
            { new: true } // Tùy chọn để trả về tài liệu đã được cập nhật
        );
        if (updatedComment) {
            res.status(200).json({ message: 'Phản hồi đã được thêm thành công!', updatedComment });
        } else {
            res.status(404).json({ message: 'Không tìm thấy bình luận!' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi thêm phản hồi!', error });
    }
});
//post
router.get('/commentByPost/:id', async function(req,res,next){
    const {id} = req.params;
    const data = await modelsComment.find({'idPost':id})
    res.json(data)
})
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
//add post
router.post('/addpost', async function(req,res,next){
  try {
      const {comment,idPost,idAccount} = req.body;
      const _id = new mongoose.Types.ObjectId()
      const data = await modelsComment.create({_id,comment,idPost,idAccount})
      res.status(201).json({ message: 'Thêm thành công', data });
  } catch (error) {
      res.status(500).json({ message: 'Không thành công', error });
  }
})
// comment
router.put('/edit/:id', async function(req,res,next){
    try {
        const {id}= req.params
        const {repComment} = req.body;
        await modelsComment.findByIdAndUpdate(id,{repComment})
        res.status(201).json('bình luận thành công')
    } catch (error) {
        res.status(500).json('bình luận không thành công',error);
    }
})
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
      text
    });

    await comment.save();
    
    const updatedComment = await modelsComment
      .findById(commentId)
      .populate('idAccount', 'firstName lastName avatar')
      .populate('repComment.idAccount', 'firstName lastName avatar');

    res.json(updatedComment);
  } catch (error) {
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
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update reply like status', error });
  }
});

module.exports = router;
