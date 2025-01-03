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
  },
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: "message",
    default: null
  },
  replyData: {
    type: Object,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

messageSchema.index({ conversationId: 1, createdAt: 1 });

messageSchema.pre('save', async function(next) {
  if (this.replyTo) {
    const Message = this.model('message');
    const replyMessage = await Message.findById(this.replyTo)
      .populate('senderId', 'firstName lastName');
    if (replyMessage) {
      this.replyData = {
        content: replyMessage.content,
        senderId: replyMessage.senderId
      };
    }
  }
  next();
});

module.exports = mongoose.model("message", messageSchema);
