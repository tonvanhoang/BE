const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const replyCommentSchema = new Schema({
  _id: { type: ObjectId, auto: true },
  idAccount: { type: Schema.Types.ObjectId, ref: "account" },
  text: { type: String, required: true },
  date: { type: String, default: currentDate() },
  likes: { type: Number, default: 0 },
  isLiked: { type: Boolean, default: false }
});

const commentSchema = new Schema({
  _id: { type: ObjectId, auto: true },
  comment: { type: String, required: true },
  dateComment: { type: String, default: currentDate() },
  likes: { type: Number, default: 0 },
  isLiked: { type: Boolean, default: false },
  idReel: { type: Schema.Types.ObjectId, ref: "reel" },
  idAccount: { type: Schema.Types.ObjectId, ref: "account", required: true },
  idPost: { type: String, ref: "post"},
  repComment: [replyCommentSchema]
});

function currentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

module.exports = mongoose.models.comment || mongoose.model("comment", commentSchema);