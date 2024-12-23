const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: "conversation",
    required: true,
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: "account",
    required: true,
  },
  content: {
    type: String,
    required: true,
  }
}, {
  timestamps: true
});

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model("message", messageSchema);
