
const express = require('express');
const Follower = require('../models/Follower'); // Import model Follower

const router = express.Router();

// API để lấy danh sách người theo dõi http://localhost:4000/followers
router.get('/', async (req, res) => {
  try {
    const followers = await Follower.find(); // Lấy tất cả người theo dõi từ MongoDB
    res.json(followers);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving followers' });
  }
});

// API để thêm một người theo dõi mới
router.post('/add', async (req, res) => {
  const { name, image } = req.body;

  // Tạo người theo dõi mới
  const newFollower = new Follower({
    name,
    image,
  });

  try {
    const savedFollower = await newFollower.save(); // Lưu vào MongoDB
    res.json(savedFollower);
  } catch (error) {
    res.status(500).json({ message: 'Error saving follower' });
  }
});

// API để hủy bỏ một người theo dõi
router.delete('/:id', async (req, res) => {
  const { id } = req.params; // Lấy ID từ params

  try {
    const deletedFollower = await Follower.findByIdAndDelete(id); // Xóa người theo dõi
    if (!deletedFollower) {
      return res.status(404).json({ message: 'Follower not found' });
    }
    res.json({ message: 'Follower deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting follower' });
  }
});

// Export router
module.exports = router;
