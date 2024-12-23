var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const modelsReport = require('../models/report');

// Lấy tất cả các bài viết đã yêu thích
router.get('/all', async function(req, res, next) {
    const data = await modelsReport.find().sort({_id:-1});
    res.json(data);
});

router.post('/add', async function(req, res, next) {
    try {
        const _id = new mongoose.Types.ObjectId();
        const { idAccount, idPost, content ,owner} = req.body;
        const data = await modelsReport.create({ _id, idAccount, idPost, content,owner });
        res.status(201).json({ message: 'thành công', data }); // Gộp message và data vào một đối tượng
    } catch (error) {
        res.status(500).json({ message: 'không thành công', error }); // Gộp message và error vào một đối tượng
    }
});
router.put('/editRequest/:id', async function (req, res, next) {
    const { id } = req.params
    const { request } = req.body
    try {
        const data = await modelsReport.findByIdAndUpdate(id,{ request },{ new: true }
        )
        res.json({ message: 'Cập nhật thành công', data })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Lỗi server khi cập nhật', error })
    }
})
router.put('/editStatus/:id', async function (req, res, next) {
    const { id } = req.params
    const { statusReport } = req.body
    try {
        const data = await modelsReport.findByIdAndUpdate(id,{ statusReport },{ new: true }
        )
        res.json({ message: 'Cập nhật thành công', data })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Lỗi server khi cập nhật', error })
    }
})
router.delete('/delete/:id', async function(req, res, next) {
    try {
        const {id} = req.params
        const data = await modelsReport.findByIdAndDelete({'_id':id});
        res.status(201).json({ message: 'thành công', data }); // Gộp message và data vào một đối tượng
    } catch (error) {
        res.status(500).json({ message: 'không thành công', error }); // Gộp message và error vào một đối tượng
    }
});

// Thêm routes mới cho reel
// 1. Tạo báo cáo reel mới
router.post('/reportReel/add', async (req, res) => {
  try {
    const { idAccount, idReel, owner, content, dateReport, request, statusReport } = req.body;
    const _id = new mongoose.Types.ObjectId();
    
    const report = await modelsReport.create({
      _id,
      idAccount,
      idReel,
      owner,
      content,
      dateReport,
      request,
      statusReport,
      type: 'reel' // Thêm trường type để phân biệt
    });
    
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo báo cáo reel', error });
  }
});

// 2. Lấy tất cả báo cáo reel
router.get('/reportReel/all', async (req, res) => {
  try {
    const reports = await modelsReport.find({ type: 'reel' })
      .populate({
        path: 'owner',
        select: 'firstName lastName avata'
      })
      .populate({
        path: 'idReel',
        select: 'video title content dateReel'
      })
      .sort({ dateReport: -1 });
      
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reel reports:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy danh sách báo cáo reel', 
      error: error.message 
    });
  }
});

// 3. Lấy báo cáo reel theo ID
router.get('/reportReel/:id', async (req, res) => {
  try {
    const report = await modelsReport.findById(req.params.id)
      .populate('idAccount', 'firstName lastName avata')
      .populate('owner', 'firstName lastName avata')
      .populate('idReel');
    if (!report) {
      return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy báo cáo reel', error });
  }
});

// 4. Cập nhật trạng thái báo cáo reel
router.put('/reportReel/updateStatus/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { statusReport } = req.body;
    
    const report = await modelsReport.findByIdAndUpdate(
      id,
      { statusReport: "Đã xác nhận" },  // Hardcode giá trị "Đã xác nhận"
      { new: true }  // Trả về document đã được cập nhật
    );
    
    if (!report) {
      return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
    }
    
    res.json({
      message: 'Cập nhật trạng thái thành công',
      data: report
    });

  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái:', error);
    res.status(500).json({ 
      message: 'Lỗi khi cập nhật trạng thái báo cáo', 
      error: error.message 
    });
  }
});

// 5. Xóa báo cáo reel
router.delete('/reportReel/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const report = await modelsReport.findByIdAndDelete(id);
    
    if (!report) {
      return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
    }
    
    res.json({ message: 'Xóa báo cáo reel thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa báo cáo reel', error });
  }
});

// 6. Lấy tất cả báo cáo reel của một người dùng
router.get('/reportReel/user/:userId', async (req, res) => {
  try {
    const reports = await modelsReport.find({
      idAccount: req.params.userId,
      type: 'reel'
    })
      .populate('idAccount', 'firstName lastName avata')
      .populate('owner', 'firstName lastName avata')
      .populate('idReel');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách báo cáo reel của người dùng', error });
  }
});

module.exports = router;
