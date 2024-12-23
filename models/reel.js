const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const reelSchema = new Schema({
  _id: { type: ObjectId, auto: true },
  video: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String },
  dateReel: { type: String, default: new Date().toISOString() },
  firstName: String,  // Thêm trường firstName
  lastName: String,   // Thêm trường lastName
  avata: String,      // Thêm trường avatar
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  idAccount: { 
    type: Schema.Types.ObjectId, 
    ref: "account", 
    required: true 
  },
  likedBy: [{
    type: Schema.Types.ObjectId,
    ref: "account"
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.models.reel || mongoose.model("reel", reelSchema);
