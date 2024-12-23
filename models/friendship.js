const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const friendship = new Schema({
  _id: { type: ObjectId },
  status: { type: String },
  dateAdd: { type: String },
  idAccount: { type: String, ref: "account" },
  owner: { type: String, ref: "account" },
});
module.exports =
  mongoose.models.friendship || mongoose.model("friendship", friendship);
