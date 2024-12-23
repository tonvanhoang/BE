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
router.post('/addPost',async function (req,res,next){
    const _id = new mongoose.Types.ObjectId()
    const {content,idAccount,owner,idPost,type,idReport} = req.body
    const data = await modelsNotification.create({_id,content,idAccount,owner,idPost,type,idReport})
})
module.exports = router;
