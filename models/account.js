const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
// Schema cho yêu cầu mở khóa tài khoản
const unlockRequestSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, auto: true },
  email: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  requestDate: { type: Date, default: Date.now },
  reason: { type: String, default: "" }, // Lý do
  imageUrl: { type: String, default: null }, // Đường dẫn ảnh minh chứng
  updatedAt: { type: Date }, // Ngày cập nhật trạng thái
  responseBy: { type: String, default: null }, // Người xử lý yêu cầu
  note: { type: String, default: null }, // Ghi chú xử lý
});
const account = new Schema({
  _id: { type: ObjectId },
  firstName: { type: String },
  lastName: { type: String },
  avata: { type: String, default: "../img/macdinh.jpg" },
  role: { type: String, default: "user" },
  birth: { type: String },
  gender: { type: String },
  lastTimeOnline: { type: String },
  phoneNumber: { type: Number },
  date: { type: String, default: currentDate() },
  email: { type: String },
  password: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  unlockRequests: [unlockRequestSchema], // Mảng chứa yêu cầu mở khóa
});
function currentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}-${month}-${year}`;
}
module.exports = mongoose.models.account || mongoose.model("account", account);