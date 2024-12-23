var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const modelsFavorite = require('../models/favorite');

// Lấy tất cả các bài viết đã yêu thích
router.get('/allFavorite', async function(req, res, next) {
    const data = await modelsFavorite.find();
    res.json(data);
});

// Lấy biểu tượng yêu thích của bài viết theo ID
router.get('/showIconByPost/:id', async function (req, res, next) {
    const { id } = req.params;
    const data = await modelsFavorite.findOne({ 'idPost': id });
    res.json(data);
});

// Thêm bài viết vào danh sách yêu thích
router.post('/addPost', async function(req, res, next) {
    try {
        const _id = new mongoose.Types.ObjectId();
        const { idAccount, idPost, icon } = req.body;
        const data = await modelsFavorite.create({ _id, idAccount, idPost, icon });
        res.status(201).json({ message: 'Thêm thành công', data });
    } catch (error) {
        res.status(500).json({ message: 'Không thành công', error });
    }
});

// Xóa bài viết khỏi danh sách yêu thích
router.post('/removePost', async function(req, res, next) {
    try {
        const { idAccount, idPost } = req.body;

        // Tìm và xóa mục yêu thích
        const result = await modelsFavorite.findOneAndDelete({ idAccount, idPost });

        if (!result) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết để xóa' });
        }

        res.json({ message: 'Xóa thành công', result });
    } catch (error) {
        res.status(500).json({ message: 'Không thành công', error });
    }
});

module.exports = router;
