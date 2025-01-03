const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/message');
const Conversation = require('../models/conversation');

// GET tất cả users trừ current user
router.get('/users/:currentUserId', async (req, res) => {
  try {
    const { currentUserId } = req.params;
    const Account = mongoose.model('account');
    
    const users = await Account.find({ 
      _id: { $ne: currentUserId }
    })
    .select('_id firstName lastName avatar')
    .sort({ firstName: 1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ 
      message: 'Lỗi khi lấy danh sách users',
      error: error.message 
    });
  }
});

// GET lấy conversation theo ID
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'firstName lastName avatar');
    
    if (!conversation) {
      return res.status(404).json({ message: 'Không tìm thấy hội thoại' });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi khi lấy thông tin hội thoại', 
      error: error.message
    });
  }
});

// POST tạo conversation mới
router.post('/conversation/create', async (req, res) => {
  try {
    const { userId1, userId2 } = req.body;

    // Kiểm tra conversation đã tồn tại
    let conversation = await Conversation.findOne({
      participants: { 
        $all: [userId1, userId2],
        $size: 2
      }
    }).populate('participants', 'firstName lastName avatar');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId1, userId2]
      });
      await conversation.populate('participants', 'firstName lastName avatar');
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi khi tạo hội thoại',
      error: error.message
    });
  }
});

// GET lấy tin nhắn của conversation
router.get('/messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('senderId', 'firstName lastName avatar');

    const total = await Message.countDocuments({ conversationId });

    res.json({
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi khi lấy tin nhắn',
      error: error.message
    });
  }
});

// GET lịch sử chat giữa 2 users
router.get('/history/:userId1/:userId2', async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;

    let conversation = await Conversation.findOne({
      participants: { 
        $all: [userId1, userId2],
        $size: 2
      }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId1, userId2]
      });
    }

    const messages = await Message.find({ 
      conversationId: conversation._id 
    })
    .sort({ createdAt: 1 })
    .populate('senderId', 'firstName lastName avatar _id');

    res.json({
      conversation,
      messages
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Lỗi khi lấy lịch sử chat',
      error: error.message 
    });
  }
});

// POST gửi tin nhắn
router.post('/send', async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;

    let conversation = await Conversation.findOne({
      participants: { 
        $all: [senderId, receiverId],
        $size: 2
      }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId]
      });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content
    });

    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: content,
      lastUpdated: new Date()
    });

    await message.populate('senderId', 'firstName lastName avatar');

    res.status(201).json(message);

  } catch (error) {
    res.status(500).json({ 
      message: 'Lỗi khi gửi tin nhắn',
      error: error.message 
    });
  }
});

// GET danh sách conversations của 1 user
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('participants', 'firstName lastName avatar')
    .sort({ lastUpdated: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ 
      message: 'Lỗi khi lấy danh sách hội thoại',
      error: error.message 
    });
  }
});

// Soft delete message
router.delete('/delete/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body; // ID của người dùng thực hiện xóa

    // Tìm tin nhắn
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Tin nhắn không tồn tại' });
    }

    // Kiểm tra xem người dùng có quyền xóa tin nhắn không
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ message: 'Không có quyền xóa tin nhắn này' });
    }

    // Thực hiện soft delete
    message.isDeleted = true;
    await message.save();

    // Emit socket event để thông báo tin nhắn đã bị xóa
    req.app.get('io').to(message.conversationId.toString()).emit('message_deleted', {
      messageId: message._id
    });

    res.json({ message: 'Tin nhắn đã được xóa thành công' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Lỗi khi xóa tin nhắn', error });
  }
});

// Route để trả lời tin nhắn
router.post('/reply', async (req, res) => {
  try {
    const { conversationId, senderId, content, replyToId } = req.body;

    // Kiểm tra tin nhắn gốc có tồn tại
    const originalMessage = await Message.findById(replyToId);
    if (!originalMessage) {
      return res.status(404).json({ message: 'Original message not found' });
    }

    // Tạo tin nhắn trả lời mới
    const newMessage = new Message({
      conversationId,
      senderId,
      content,
      replyTo: replyToId
    });

    const savedMessage = await newMessage.save();

    // Populate thông tin người gửi và tin nhắn gốc
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('senderId', 'firstName lastName avatar')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'senderId',
          select: 'firstName lastName avatar'
        }
      });

    // Emit socket event cho tin nhắn mới
    req.app.get('io').to(conversationId).emit('new_message', populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error replying to message:', error);
    res.status(500).json({ message: 'Failed to reply to message', error });
  }
});

module.exports = router;
