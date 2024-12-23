const mongoose = require('mongoose');

// Định nghĩa schema cho follower
const followerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // bắt buộc phải có tên
  },
  image: {
    type: String,
    required: true, // bắt buộc phải có link hình ảnh
  },
  followedAt: {
    type: Date,
    default: Date.now, // Thêm thời gian người dùng bắt đầu theo dõi
  },
});

// Tạo model từ schema
const Follower = mongoose.model('Follower', followerSchema);

module.exports = Follower;
