var express = require('express');
var router = express.Router();
const modelsFriend = require('../models/friendship')
const mongoose = require('mongoose')
/* GET home page. */
router.get('/allFriendship', async function(req, res, next) {
    const data = await modelsFriend.find();
    res.json(data)
});
router.get('/detail/:id', async function(req, res, next) {
    const {id}= req.params
    const data = await modelsFriend.findOne({'_id':id});
    res.json(data)
});
router.post('/add', async function(req, res, next) {
    try {
        const _id = new mongoose.Types.ObjectId();
        const { status, idAccount, owner } = req.body;
        // Ghi log req.body để kiểm tra dữ liệu
        console.log(req.body);
        const data = await modelsFriend.create({ _id, status, idAccount, owner });
        res.status(201).json({ message: 'Thêm thành công', data });
    } catch (error) {
        console.error('Lỗi:', error); // Ghi log chi tiết lỗi
        res.status(500).json({ message: 'Không thành công', error });
    }
 });
 router.get('/nguoitheodoi/:id', async function(req, res, next) {
    try {
      const { id } = req.params;
      const data = await modelsFriend.find({ 'owner': id, 'status': 'đang theo dõi' });
    res.status(200).json(data); 
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error });
    }
  });
  router.get('/duoctheodoi/:id', async function(req, res, next) {
    try {
      const { id } = req.params;
      const data = await modelsFriend.find({ 'owner': id, 'status': 'theo dõi' });
    res.status(200).json(data); 
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error });
    }
  });
  router.put('/xacnhan/:id', async function (req, res, next) {
    const { id } = req.params; // Lấy id của bản ghi gốc
    const { status } = req.body; // Trạng thái mới cần cập nhật

    try {
        // Tìm bản ghi gốc dựa trên _id
        const currentData = await modelsFriend.findById(id);
        if (!currentData) {
            return res.status(404).json({ message: 'Không tìm thấy bản ghi' });
        }
        // Cập nhật tất cả các bản ghi khớp với idAccount và owner
        const updatedData = await modelsFriend.updateMany(
            {
                $or: [
                    { owner: currentData.owner, idAccount: currentData.idAccount },
                    { owner: currentData.idAccount, idAccount: currentData.owner },
                ],
            },
            { status } // Trạng thái cần cập nhật
        );
        res.json({
            message: 'Cập nhật thành công',
            updatedCount: updatedData.modifiedCount,
        });
    } catch (error) {
        console.error('Lỗi server:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật', error });
    }
});
router.delete('/deleteFriend/:id', async function (req, res, next) {
  const { id } = req.params;

  try {
      // Tìm bản ghi gốc dựa vào id
      const curr = await modelsFriend.findById(id);

      if (!curr) {
          return res.status(404).json({ message: 'Không tìm thấy bản ghi cần xóa' });
      }

      // Xóa cả hai chiều (owner -> idAccount và idAccount -> owner)
      const deletedData = await modelsFriend.deleteMany({
          $or: [
              { owner: curr.owner, idAccount: curr.idAccount },
              { owner: curr.idAccount, idAccount: curr.owner },
          ],
      });

      res.json({
          message: 'Xóa thành công',
          deletedCount: deletedData.deletedCount,
      });
  } catch (error) {
      console.error('Lỗi khi xóa:', error);
      res.status(500).json({ message: 'Lỗi server khi xóa', error });
  }
});
router.get('/friendshipByAccountAndOwner', async function(req, res, next) {
  const { idAccount, owner } = req.query; // Lấy idAccount và owner từ query string
  try {
      // Tìm tất cả các bản ghi có owner và idAccount khớp
      const data = await modelsFriend.findOne({
          $or: [
              { owner: owner, idAccount: idAccount },
              { owner: idAccount, idAccount: owner }
          ]
      });
      res.status(200).json(data); // Trả về dữ liệu tìm được
  } catch (error) {
      console.error('Lỗi server:', error);
      res.status(500).json({ message: 'Lỗi khi lấy dữ liệu', error });
  }
});
router.get('/idaccountbyowner', async function(req, res, next) {
    const { idAccount, owner } = req.query; // Lấy idAccount và owner từ query string
    try {
        // Tìm tất cả các bản ghi có owner và idAccount khớp
        const data = await modelsFriend.findOne({
            $or: [
                { owner: idAccount, idAccount: owner }
            ]
        });
        res.status(200).json(data); // Trả về dữ liệu tìm được
    } catch (error) {
        console.error('Lỗi server:', error);
        res.status(500).json({ message: 'Lỗi khi lấy dữ liệu', error });
    }
  });
  router.get('/ownerbyidaccount', async function(req, res, next) {
    const { idAccount, owner } = req.query; // Lấy idAccount và owner từ query string
    try {
        // Tìm tất cả các bản ghi có owner và idAccount khớp
        const data = await modelsFriend.findOne({
            $or: [
                { owner: idAccount, idAccount: owner },
            ]
        });
        res.status(200).json(data); // Trả về dữ liệu tìm được
    } catch (error) {
        console.error('Lỗi server:', error);
        res.status(500).json({ message: 'Lỗi khi lấy dữ liệu', error });
    }
  });
module.exports = router;
