const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const reportSchema = new Schema({
  _id: { type: ObjectId },
  content: { type: String },
  dateReport: { type: String, default: currentDate() },
  idAccount: { type: Schema.Types.ObjectId, ref: "account" },
  owner: { type: Schema.Types.ObjectId, ref: "account" },
  idPost: { type: Schema.Types.ObjectId, ref: "post" },
  idReel: { type: Schema.Types.ObjectId, ref: "reel" },
  type: { type: String, enum: ['post', 'reel'] },
  request:{type:String,
    default:'Không'
  },
  statusReport:{type:String,
    default:'Chưa xác nhận'
  }
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
module.exports =
  mongoose.models.report || mongoose.model("report", reportSchema);
