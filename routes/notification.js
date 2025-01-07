var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')
const modelsNotification = require('../models/notification')
/* GET home page. */
router.get('/all', async function(req, res, next) {
    const data = await modelsNotification.find();
    res.json(data)
});
router.get('/notificationByAccount/:id', async function(req, res, next) {
    const { id } = req.params;
    try {
        const data = await modelsNotification
            .find({ 'idAccount': id })
            .sort({ _id: -1 });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy thông báo', error });
    }
});

// add post
// Add post and emit real-time notification
router.post('/addPost', async function (req, res, next) {
    const _id = new mongoose.Types.ObjectId();
    const { content, idAccount, owner, idPost, type, idReport } = req.body;

    try {
        // Tạo thông báo mới trong cơ sở dữ liệu
        const data = await modelsNotification.create({
            _id,
            content,
            idAccount,
            owner,
            idPost,
            type,
            idReport,
        });

        // Nếu cần, lấy dữ liệu thông báo đã được populate
        const populatedNotification = await modelsNotification.findById(data._id);

        // Phát sự kiện "newNotification" qua Socket.IO
        const io = req.app.get('io'); // Đảm bảo `io` được truyền vào app
        io.emit('newNotification', populatedNotification);

        // Gửi phản hồi thành công tới client
        res.status(201).json({
            message: 'Notification created and emitted successfully.',
            notification: populatedNotification,
        });
    } catch (error) {
        console.error('Error adding notification:', error);

        // Gửi phản hồi lỗi
        res.status(500).json({
            message: 'Failed to add notification.',
            error,
        });
    }
});
    
module.exports = router;
