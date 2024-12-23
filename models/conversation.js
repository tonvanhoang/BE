const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const conversationSchema = new Schema(
  {
    _id: {
      type: ObjectId,
      auto: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "account",
        required: true,
      },
    ],
    lastMessage: {
      type: String, // Store the last message content for quick access
      default: "",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically handle createdAt and updatedAt fields
  }
);

// Add compound indexes for faster queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model("conversation", conversationSchema);
