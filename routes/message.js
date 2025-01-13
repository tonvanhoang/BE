const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/message');
const Conversation = require('../models/conversation');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const stream = require('stream');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    const conversationId = [userId1, userId2].sort().join('-');

    const messages = await Message.find({ 
      conversationId 
    })
    .populate('senderId', 'firstName lastName avata _id')
    .populate({
      path: 'replyTo',
      populate: {
        path: 'senderId',
        select: 'firstName lastName avata _id'
      }
    })
    .sort({ createdAt: 1 });

    const mappedMessages = messages.map(msg => ({
      ...msg.toObject(),
      isSentByCurrentUser: msg.senderId._id.toString() === userId1
    }));

    res.json({ messages: mappedMessages });

  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy lịch sử chat',
      error: error.message 
    });
  }
});

// POST gửi tin nhắn
router.post('/send', async (req, res) => {
  try {
    const { senderId, receiverId, content, conversationId } = req.body;

    const newMessage = new Message({
      conversationId,
      senderId,
      content
    });

    const savedMessage = await newMessage.save();
    
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('senderId', 'firstName lastName avata _id');

    console.log("Sending normal message:", populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error in /send route:", error);
    res.status(500).json({ 
      message: 'Lỗi khi gửi tin nhắn',
      error: error.message,
      stack: error.stack
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
    const { userId } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Tin nhắn không tồn tại' });
    }

    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ message: 'Không có quyền xóa tin nhắn này' });
    }

    message.isDeleted = true;
    await message.save();

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
    console.log("Received reply request:", { conversationId, senderId, content, replyToId });

    const originalMessage = await Message.findById(replyToId);
    if (!originalMessage) {
      return res.status(404).json({ message: 'Không tìm thấy tin nhắn gốc' });
    }

    const newMessage = new Message({
      conversationId,
      senderId,
      content,
      replyTo: replyToId
    });

    const savedMessage = await newMessage.save();
    
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('senderId', 'firstName lastName avata')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'senderId',
          select: 'firstName lastName avata'
        }
      });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error in /reply route:", error);
    res.status(500).json({ 
      message: "Failed to send reply", 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Route to send a message with media
router.post('/sendMediaMessage', async (req, res) => {
  try {
    const { senderId, receiverId, conversationId, imageUrl, videoUrl } = req.body;

    console.log('Received message data:', { senderId, receiverId, conversationId, imageUrl, videoUrl });

    const newMessage = new Message({
      conversationId,
      senderId,
      imageUrl,
      videoUrl,
      createdAt: new Date()
    });

    const savedMessage = await newMessage.save();
    console.log('Message saved:', savedMessage);
    
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('senderId', 'firstName lastName avata _id');

    console.log('Sending populated message:', populatedMessage);
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending media message:', error);
    res.status(500).json({ 
      message: 'Failed to send media message', 
      error: error.message 
    });
  }
});

module.exports = router;
