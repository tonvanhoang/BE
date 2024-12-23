const mongoose = require("mongoose");
const { type } = require("os");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const postSchema = new Schema({
    _id: {
        type: ObjectId,
    },
    post: [{ type: String }],
    statusPost:{type:String,default:"on"},
    title: { type: String },
    datePost: { type: String, default: currentDate },
    idAccount: { type: String, ref: "account" },
});

// Hàm trả về ngày hiện tại với định dạng dd-MM-yyyy
function currentDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
}

module.exports = mongoose.models.post || mongoose.model("post", postSchema);
