const express = require('express');
const router = express.Router();
const modelsReel = require('../models/reel');
const mongoose = require('mongoose');

const multer = require('multer');
// const { GridFSBucket } = require('mongodb');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dqso33xek',
  api_key: '954385393449193',
  api_secret: 'eiHm7HOvpXf-OgQBaigKhHNrbYo' // Thay bằng API secret của bạn
});

// let gfs;
// mongoose.connection.once('open', () => {
//     gfs = new GridFSBucket(mongoose.connection.db, {
//         bucketName: 'video'
//     });
// });

// // 2. Cấu hình storage
// const storage = new GridFsStorage({
//     url: 'mongodb://localhost:27017/mangxahoi',
//     file: (req, file) => {
//         return {
//             filename: `${Date.now()}-${file.originalname}`,
//             bucketName: 'video'
//         };
//     }
// });

// // 3. Cấu hình upload
// const upload = multer({ 
//     storage,
//     fileFilter: (req, file, cb) => {
//         if (file.mimetype.startsWith('video/')) {
//             cb(null, true);
//         } else {
//             cb(new Error('Chỉ chấp nhận file video!'), false);
//         }
//     },
//     limits: {
//         fileSize: 100 * 1024 * 1024 // 100MB
//     }
// });

// Thêm middleware parse JSON
router.use(express.json());

// GET tất cả reel với phân trang
router.get('/allReel', async function(req, res) {
  try {
    const reels = await modelsReel.find().sort({ dateReel: -1 });
    console.log("Sending reels:", reels);
    res.json(reels);
  } catch (error) {
    console.error("Error fetching reels:", error);
    res.status(500).json({ message: "Error fetching reels", error });
  }
});

// GET reel theo account ID
router.get('/reelByAccount/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = await modelsReel.find({ idAccount: id })
            .populate('idAccount', 'username avatar firstName lastName')
            .sort({ dateReel: -1 });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// GET chi tiết reel theo ID
router.get('/reelByID/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = await modelsReel.findById(id)
            .populate('idAccount', 'username avatar');
        
        if (!data) {
            return res.status(404).json({ message: 'Không tìm thấy reel' });
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// GET video stream
router.get('/video/:id', async (req, res) => {
    try {
        const reel = await modelsReel.findById(req.params.id);
        const videoId = new mongoose.Types.ObjectId(reel.video);
        const downloadStream = gfs.openDownloadStream(videoId);
        downloadStream.pipe(res);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi stream video', error: error.message });
    }
});

// POST thêm reel mới
router.post('/add', async (req, res) => {
    try {
        const { 
            title, 
            content, 
            idAccount, 
            video, 
            dateReel,
            firstName,  // Thêm các trường mới
            lastName,
            avata
        } = req.body;
        
        // Tạo ID mới cho reel
        const _id = new mongoose.Types.ObjectId();
        
        // Tạo reel mới với thông tin user
        const newReel = await modelsReel.create({
            _id,
            title,
            content,
            idAccount,
            video,
            dateReel,
            firstName,  // Lưu firstName
            lastName,   // Lưu lastName
            avata,      // Lưu avatar
            likes: 0,
            comments: 0,
            views: 0,
            likedBy: []
        });

        res.status(201).json({ 
            message: 'Reel đã được tạo thành công', 
            data: newReel 
        });

    } catch (error) {
        console.error('Lỗi khi thêm reel:', error);
        res.status(500).json({ 
            message: 'Đã xảy ra lỗi khi thêm reel',
            error: error.message 
        });
    }
});

// PUT cập nhật reel
router.put('/edit/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        
        const updatedReel = await modelsReel.findByIdAndUpdate(
            id,
            { title, content },
            { new: true } // Trả về document sau khi update
        );

        if (!updatedReel) {
            return res.status(404).json({ message: 'Không tìm thấy reel' });
        }

        res.json({ message: 'Cập nhật thành công', data: updatedReel });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// DELETE xóa reel
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const reel = await modelsReel.findById(id);
        
        if (!reel) {
            return res.status(404).json({ message: 'Không tìm thấy reel' });
        }

        // Xóa document từ MongoDB
        await modelsReel.findByIdAndDelete(id);
        
        res.json({ message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Route để like/unlike reel
router.post('/like', async (req, res) => {
  try {
    const { reelId, userId } = req.body;
    
    const reel = await modelsReel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ message: 'Không tìm thấy reel' });
    }

    const userLikedIndex = reel.likedBy.indexOf(userId);
    let isLiked;

    if (userLikedIndex === -1) {
      // User chưa like -> thêm like
      reel.likedBy.push(userId);
      reel.likes += 1;
      isLiked = true;
    } else {
      // User đã like -> bỏ like
      reel.likedBy.splice(userLikedIndex, 1);
      reel.likes -= 1;
      isLiked = false;
    }

    await reel.save();

    res.json({ 
      message: 'Cập nhật like thành công',
      isLiked: isLiked,
      totalLikes: reel.likes
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.get('/reelWithAccount', async (req, res) => {
  try {
    const reels = await modelsReel.find()
      .populate('idAccount', 'firstName lastName email') // Chỉ định các trường muốn lấy
      .sort({ dateReel: -1 });
    res.json(reels);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.get('/reelWithAccountDetails', async (req, res) => {
  try {
    const reels = await modelsReel.aggregate([
      {
        $lookup: {
          from: 'accounts',
          localField: 'idAccount',
          foreignField: '_id',
          as: 'accountDetails'
        }
      },
      {
        $unwind: '$accountDetails'
      },
      {
        $project: {
          video: 1,
          title: 1,
          content: 1,
          dateReel: 1,
          'accountDetails.firstName': 1,
          'accountDetails.lastName': 1,
          'accountDetails.email': 1
        }
      }
    ]);
    res.json(reels);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.get('/reelsByAccount/:id', async (req, res) => {
  const reels = await modelsReel.find()
    .populate('idAccount', 'firstName lastName avata')
    .exec();
  res.json(reels);
});

module.exports = router;
