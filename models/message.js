const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  conversationId: {
    type: String,
    required: true,
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: "account",
    required: true,
  },
  content: {
    type: String,
    default: "",
  },
  imageUrl: {
    type: String,
    default: null,
  },
  videoUrl: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: "message",
    default: null
  }
}, {
  timestamps: true
});

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model("message", messageSchema);
