var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const modelsPost = require('../models/post');
const modelsFriendship = require('../models/friendship');
const multer = require('multer');
const fs = require('fs');

// Cấu hình multer để tải ảnh lên
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = '../RenetFrontend/public/img/';
    
    // Kiểm tra và tạo thư mục nếu không tồn tại
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Sử dụng tên file gốc
    const fileName = file.originalname;
    cb(null, fileName);
  }
});
const upload = multer({ storage: storage });

// Route để thêm bài viết với mảng ảnh
router.post('/add', upload.array('post', 10), async (req, res) => {
  try {
    const { title, idAccount } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'Không có tệp ảnh nào được tải lên' });
    }

    const imgArray = files.map(file => file.filename);
    const _id = new mongoose.Types.ObjectId();

    const newPost = await modelsPost.create({
      _id,
      post: imgArray,
      title,
      idAccount,
    });

    res.status(201).json({ message: 'Bài viết đã được tạo thành công', data: newPost });
  } catch (error) {
    console.error('Lỗi khi thêm bài viết:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi thêm bài viết', error });
  }
});
// gender
router.put('/editStatus/:id', async function (req, res, next) {
  const { id } = req.params
  const { statusPost } = req.body
  try {
      const data = await modelsPost.findByIdAndUpdate(id,{ statusPost },{ new: true }
      )
      res.json({ message: 'Cập nhật thành công', data })
  } catch (error) {
      console.error(error)
      res.status(500).json({ message: 'Lỗi server khi cập nhật', error })
  }
})
// API hiển thị bài viết theo quan hệ bạn bè
// API hiển thị bài viết theo quan hệ bạn bè
router.get('/friendsPosts/:idAccount', async function(req, res, next) {
  try {
    const { idAccount } = req.params;

    // Tìm danh sách bạn bè với trạng thái 'accepted'
    const friendships = await modelsFriendship.find({
      $or: [
        { owner: idAccount, status: 'accepted' },
        { idAccount: idAccount, status: 'accepted' }
      ]
    }).populate('owner idAccount', '_id'); // Lấy _id của owner và idAccount

    // Tạo danh sách ID bao gồm cả idAccount và owner từ các mối quan hệ
    const relatedIds = friendships.reduce((acc, friend) => {
      // Kiểm tra nếu chủ sở hữu là tài khoản hiện tại, thêm bạn bè của họ
      if (friend.owner.toString() === idAccount.toString()) {
        acc.push(friend.idAccount._id); // Thêm idAccount của bạn
      } else {
        acc.push(friend.owner._id); // Thêm id của chủ sở hữu (owner)
      }
      return acc;
    }, [idAccount]); // Thêm idAccount của tài khoản đang đăng nhập vào danh sách

    // Truy vấn các bài viết từ tất cả các tài khoản trong danh sách liên quan
    const posts = await modelsPost.find({
      idAccount: { $in: relatedIds }, // Lọc bài viết bởi danh sách idAccount
      statusPost: 'on' // Chỉ lấy bài viết có trạng thái 'on'
    }).populate('idAccount', 'firstName') // Lấy thông tin tài khoản người đăng bài
      .sort({ _id: -1 }); // Sắp xếp bài viết từ mới đến cũ

    // Trả về danh sách bài viết
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy bài viết của bạn bè', error });
  }
});


// Lấy tất cả bài viết
router.get('/allPost', async function(req, res, next) {
  try {
    const data = await modelsPost.find();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy tất cả bài viết', error });
  }
});

// Lấy bài viết theo id tài khoản
router.get('/postByAccount/:id', async function(req, res, next) {
  try {
    const { id } = req.params;
    const data = await modelsPost.find({ 'idAccount': id ,statusPost:'on'});
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy bài viết theo tài khoản', error });
  }
});

// Lấy bài viết theo ID
router.get('/postByID/:id', async function(req, res, next) {
  try {
    const { id } = req.params;
    const data = await modelsPost.findOne({ '_id': id });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy bài viết theo ID', error });
  }
});

// Sửa bài viết
router.put('/edit/:id', async function(req, res, next) {
  try {
    const { id } = req.params;
    const { post, title } = req.body;
    await modelsPost.findByIdAndUpdate(id, { post, title });
    res.status(200).json({ message: 'Sửa thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Không thành công', error });
  }
});

// Xóa bài viết
router.delete('/delete/:id', async function(req, res, next) {
  try {
    const { id } = req.params;
    await modelsPost.findByIdAndDelete(id);
    res.status(200).json({ message: 'Xóa thành công' });
  } catch (error) {
    console.error('Lỗi', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa bài viết', error });
  }
});

// Thêm route upload ảnh đơn lẻ
router.post('/upload', upload.single('avatar'), async (req, res, next) => {
  try {
      const { file } = req;
      if (!file) {
          return res.status(400).json({ status: 0, message: 'Không có tệp ảnh được tải lên' });
      } else {
          const url = `http://192.168.1.13:3000/img/${file.filename}`;
          return res.status(200).json({ status: 1, url: url });
      }
  } catch (error) {
      console.error('Lỗi khi tải ảnh lên:', error);
      return res.status(500).json({ status: 0, message: 'Đã xảy ra lỗi khi tải ảnh lên' });
  }
});

module.exports = router;
