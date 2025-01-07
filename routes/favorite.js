var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const modelsFavorite = require('../models/favorite');

// Middleware xử lý lỗi
// const handleError = (res, error, message = 'Có lỗi xảy ra') => {
//     res.status(500).json({ message, error });
// };

// Lấy tất cả các bài viết đã yêu thích
router.get('/allFavorite', async function(req, res) {
    try {
        const data = await modelsFavorite.find();
        res.json(data);
    } catch (error) {
        handleError(res, error, 'Không thể lấy danh sách yêu thích');
    }
});

// Lấy biểu tượng yêu thích của bài viết theo ID
router.get('/favoriteByPost/:id', async function (req, res) {
    const { id } = req.params;
    try {
        const data = await modelsFavorite.find({ 'idPost': id });
        res.json(data);
    } catch (error) {
        handleError(res, error, 'Không thể lấy dữ liệu yêu thích');
    }
});

// Thêm bài viết vào danh sách yêu thích
router.post('/addPost', async function(req, res) {
    try {
        const { idAccount, idPost, icon } = req.body;

        // Kiểm tra xem bài viết đã được yêu thích chưa
        const existingFavorite = await modelsFavorite.findOne({ idAccount, idPost });
        if (existingFavorite) {
            return res.status(400).json({ message: 'Bài viết đã được yêu thích' });
        }

        const _id = new mongoose.Types.ObjectId();
        const data = await modelsFavorite.create({ _id, idAccount, idPost, icon });

        const likeCount = await modelsFavorite.countDocuments({ idPost });
        req.app.get('io').emit('favoriteUpdated', { idPost, likeCount });

        res.status(201).json({ message: 'Thêm thành công', data });
    } catch (error) {
        handleError(res, error, 'Không thành công');
    }
});

// Xóa bài viết khỏi danh sách yêu thích
router.post('/removePost', async function(req, res) {
    try {
        const { idAccount, idPost } = req.body;

        const result = await modelsFavorite.findOneAndDelete({ idAccount, idPost });
        if (!result) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết để xóa' });
        }

        const likeCount = await modelsFavorite.countDocuments({ idPost });
        req.app.get('io').emit('favoriteUpdated', { idPost, likeCount });

        res.json({ message: 'Xóa thành công', result });
    } catch (error) {
        handleError(res, error, 'Không thành công');
    }
});

module.exports = router;
