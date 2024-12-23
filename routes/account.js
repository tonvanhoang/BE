var express = require("express");
var router = express.Router();
const modelsAccount = require("../models/account");
const modelsFriendship = require("../models/friendship");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const multer = require('multer');
const fs = require('fs')
router.get('/allAccount', async function(req, res, next) {
  const data = await modelsAccount.find();
  res.json(data)
});
router.get('/friendsAccount/:idAccount', async function(req, res, next) {
  try {
      const { idAccount } = req.params;
      // Tìm kiếm các mối quan hệ bạn bè với trạng thái 'accepted' nơi idAccount là người dùng đăng nhập
      const friendships = await modelsFriendship.find({
          $or: [
              { owner: idAccount, status: 'accepted' },
              { idAccount: idAccount, status: 'accepted' }
          ]
      }).populate('owner idAccount', '_id');
      const ownerIds = friendships.map(friend => {
          return friend.owner._id.toString() === idAccount.toString() ? friend.idAccount._id : friend.owner._id;
      });
      console.log("Owner IDs:", ownerIds);
      // Lấy thông tin tài khoản của các owner
      const accounts = await modelsAccount.find({
          _id: { $in: ownerIds }
      }).sort({ date: -1 });
      res.status(200).json(accounts);
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách tài khoản owner', error });
  }
});
router.get('/accountByID/:id', async function(req, res, next) {
  const {id} = req.params;
  const data = await modelsAccount.findOne({'_id':id});
  res.json(data)
});
router.get('/accountByIDS/:id', async function(req, res, next) {
  const {id} = req.params;
  const data = await modelsAccount.find({'_id':id});
  res.json(data)
});
// đăng kí
router.post("/register", async function (req, res, next) {
try {
  const { _id } = new mongoose.Types.ObjectId();
  const {
    firstName,
    lastName,
    password,
    email,
    avata,
    phoneNumber,
    birth,
    lastTimeOnline,
  } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const data = await modelsAccount.create({
    _id,
    firstName,
    lastName,
    password: hashedPassword,
    email,
    avata,
    phoneNumber,
    birth,
    lastTimeOnline,
  });
  res.status(200).json({ message: "thêm thành công", data });
} catch (err) {
  console.error("lỗi", err);
  res.status(500).json({ err: "đã lỗi" });
}
});
router.put("/editName/:id", async function (req, res, next) {
const { id } = req.params;
const { firstName, lastName } = req.body;
try {
  const data = await modelsAccount.findByIdAndUpdate(
    id,
    { firstName, lastName },
    { new: true }
  );
  res.json({ message: "Cập nhật thành công", data });
} catch (error) {
  console.error(error);
  res.status(500).json({ message: "Lỗi server khi cập nhật", error });
}
});
// 
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = '../RenetFrontend/public/img/';

    // Kiểm tra và tạo thư mục nếu không tồn tại
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Tạo tên file duy nhất bằng cách thêm timestamp
    const fileName = `${Date.now()}_${file.originalname}`;
    cb(null, fileName);
  }
});

const upload = multer({ storage: storage });

router.put('/editAvata/:id', upload.single('avatar'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    // Kiểm tra nếu không có file được tải lên
    if (!file) {
      return res.status(400).json({ message: 'Không có tệp ảnh nào được tải lên' });
    }

    // Lấy tên file duy nhất
    const imgFile = file.filename;

    // Cập nhật avatar trong cơ sở dữ liệu
    const updatedAccount = await modelsAccount.findByIdAndUpdate(
      id,
      { avata: imgFile },
      { new: true }
    );

    if (!updatedAccount) {
      return res.status(404).json({ message: 'Tài khoản không tồn tại' });
    }

    res.status(200).json({ message: 'Cập nhật avatar thành công', data: updatedAccount });
  } catch (error) {
    console.error('Lỗi khi cập nhật avatar:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật avatar', error });
  }
});


//phone
router.put("/editPhone/:id", async function (req, res, next) {
const { id } = req.params;
const { phoneNumber } = req.body;
try {
  const data = await modelsAccount.findByIdAndUpdate(
    id,
    { phoneNumber },
    { new: true }
  );
  res.json({ message: "Cập nhật thành công", data });
} catch (error) {
  console.error(error);
  res.status(500).json({ message: "Lỗi server khi cập nhật", error });
}
});
// email
router.put("/editEmail/:id", async function (req, res, next) {
const { id } = req.params;
const { email } = req.body;
try {
  const data = await modelsAccount.findByIdAndUpdate(
    id,
    { email },
    { new: true }
  );
  res.json({ message: "Cập nhật thành công", data });
} catch (error) {
  console.error(error);
  res.status(500).json({ message: "Lỗi server khi cập nhật", error });
}
});
// email
router.put("/editPassword/:id", async function (req, res, next) {
const { id } = req.params;
const { password } = req.body;
try {
  const hashpw = await bcrypt.hash(password, 10);
  const data = await modelsAccount.findByIdAndUpdate(
    id,
    { password: hashpw },
    { new: true }
  );
  res.json({ message: "Cập nhật thành công", data });
} catch (error) {
  console.error(error);
  res.status(500).json({ message: "Lỗi server khi cập nhật", error });
}
});
// gender
router.put("/editGender/:id", async function (req, res, next) {
const { id } = req.params;
const { gender } = req.body;
try {
  const data = await modelsAccount.findByIdAndUpdate(
    id,
    { gender },
    { new: true }
  );
  res.json({ message: "Cập nhật thành công", data });
} catch (error) {
  console.error(error);
  res.status(500).json({ message: "Lỗi server khi cập nhật", error });
}
});
// birthday
router.put("/editBirthday/:id", async function (req, res, next) {
  const { id } = req.params;
  const { birth } = req.body;
  try {
    const data = await modelsAccount.findByIdAndUpdate(
      id,
      { birth },
      { new: true }
    );
    res.json({ message: "Cập nhật thành công", data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server khi cập nhật", error });
  }
  });
// Đăng nhập
router.post("/login", async function (req, res, next) {
try {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email và mật khẩu là bắt buộc" });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Định dạng email không hợp lệ" });
  }
  const user = await modelsAccount.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "Người dùng không tồn tại" });
  }
  if (user.status === "inactive") {
    return res.status(403).json({
      message:
        "Tài khoản của bạn hiện đang bị khóa. Vui lòng liên hệ admin qua trợ giúp.",
    });
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Mật khẩu không đúng" });
  }
  res.status(200).json({
    message: "Đăng nhập thành công",
    user: {
      avata: user.avata,
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  });
} catch (err) {
  console.error("Lỗi", err);
  res.status(500).json({ err: "Đã có lỗi xảy ra" });
}
});
router.delete("/delete/:id", async function (req, res, next) {
try {
  const { id } = req.params;
  await modelsAccount.findByIdAndDelete(id);
  res.status(201).json("xóa thành công");
} catch (error) {
  res.status(500).json("xóa không thành công");
}
});
// Cập nhật quyền của người dùng
router.put("/editRole/:id", async function (req, res, next) {
const { id } = req.params; 
const { role } = req.body; 
// Kiểm tra nếu role có phải là một trong các giá trị hợp lệ không
const validRoles = ["admin", "user"]; // Các quyền hợp lệ
if (!validRoles.includes(role)) {
  return res
    .status(400)
    .json({ message: "Quyền không hợp lệ. Các quyền hợp lệ: admin, user." });
}

try {
  const data = await modelsAccount.findByIdAndUpdate(
    id,
    { role },
    { new: true }
  );

  if (!data) {
    return res.status(404).json({ message: "Người dùng không tồn tại" });
  }
  res.json({ message: "Cập nhật quyền thành công", data });
} catch (error) {
  console.error(error);
  res.status(500).json({ message: "Lỗi server khi cập nhật quyền", error });
}
});
router.put("/updateBirth/:id", async function (req, res) {
const { id } = req.params;
const { birth } = req.body;
try {
  const user = await modelsAccount.findByIdAndUpdate(
    id,
    { birth },
    { new: true }
  );
  res.status(200).json({ message: "Cập nhật ngày sinh thành công", user });
} catch (error) {
  console.error("Lỗi cập nhật ngày sinh:", error);
  res.status(500).json({ message: "Cập nhật ngày sinh thất bại" });
}
});
// 1. Gửi yêu cầu mở khóa tài khoản http://localhost:4000/account/requestUnlock
router.post("/requestUnlock", async (req, res) => {
try {
  const { email, reason, imageUrl } = req.body;

  // Tìm tài khoản theo email
  const user = await modelsAccount.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "Tài khoản không tồn tại." });
  }

  if (user.status === "active") {
    return res.status(400).json({ message: "Tài khoản đã hoạt động." });
  }

  // Tạo yêu cầu mở khóa
  const unlockRequest = {
    _id: new mongoose.Types.ObjectId(),
    email: user.email,
    status: "pending",
    reason: reason || "",
    imageUrl: imageUrl || null,
  };

  // Thêm yêu cầu vào mảng `unlockRequests`
  user.unlockRequests.push(unlockRequest);
  await user.save();

  res.status(200).json({
    message: "Yêu cầu mở khóa đã được gửi thành công.",
    requestId: unlockRequest._id,
  });
} catch (error) {
  console.error("Lỗi khi gửi yêu cầu mở khóa:", error);
  res.status(500).json({ message: "Đã xảy ra lỗi khi gửi yêu cầu.", error });
}
});
// 2. Lấy danh sách yêu cầu mở khóa
router.get("/getUnlockRequests", async function (req, res,next) {
try {
  const unlockRequests = await modelsAccount.aggregate([
    { $unwind: "$unlockRequests" }, // Tách mảng yêu cầu
    { $match: { "unlockRequests.status": "pending" } }, // Lọc theo trạng thái 'pending'
    {
      $project: {
        email: "$unlockRequests.email",
        status: "$unlockRequests.status",
        requestDate: "$unlockRequests.requestDate",
        reason: "$unlockRequests.reason",
        imageUrl: "$unlockRequests.imageUrl",
        userId: "$_id",
      },
    },
  ]);

  res.status(200).json({
    message: "Lấy danh sách yêu cầu thành công",
    unlockRequests,
  });
} catch (error) {
  console.error("Lỗi khi lấy yêu cầu mở khóa:", error);
  res
    .status(500)
    .json({ message: "Đã xảy ra lỗi khi lấy yêu cầu mở khóa", error });
}
});
// Phê duyệt yêu cầu mở khóa tài khoản
router.put("/acceptUnlockRequest/:userId/:requestId", async (req, res) => {
const { userId, requestId } = req.params;
try {
  // Cập nhật trạng thái yêu cầu mở khóa thành "approved"
  const request = await modelsAccount.findByIdAndUpdate(requestId, {
    status: "approved",
  });

  if (!request) {
    return res.status(404).json({ message: "Yêu cầu không tồn tại." });
  }

  // Cập nhật trạng thái tài khoản thành "active"
  const account = await modelsAccount.findByIdAndUpdate(userId, {
    status: "active",
    $pull: { unlockRequests: { _id: requestId } }, // Loại bỏ yêu cầu khỏi tài khoản
    hasHelpRequest: false, // Xóa dấu chấm đỏ trợ giúp
  });

  if (!account) {
    return res.status(404).json({ message: "Tài khoản không tồn tại." });
  }

  res.json({ message: "Yêu cầu đã được phê duyệt và tài khoản đã được kích hoạt." });
} catch (error) {
  console.error(error);
  res.status(500).json({ message: "Có lỗi xảy ra khi phê duyệt yêu cầu." });
}
});
router.put("/updateStatus/:accountId", async (req, res) => {
const { accountId } = req.params;
const { status } = req.body; // Trạng thái mới (active hoặc inactive)

try {
  // Kiểm tra xem trạng thái có phải là "active" hoặc "inactive" hay không
  if (status !== "active" && status !== "inactive") {
    return res.status(400).json({
      message:
        "Trạng thái không hợp lệ. Chỉ có thể là 'active' hoặc 'inactive'.",
    });
  }
  const updatedAccount = await modelsAccount.findByIdAndUpdate(
    accountId,
    { status },
    { new: true }
  );
  if (!updatedAccount) {
    return res.status(404).json({ message: "Tài khoản không tìm thấy." });
  }

  res.status(200).json({
    message: "Tài khoản đã được cập nhật trạng thái thành công.",
    account: updatedAccount,
  });
} catch (error) {
  console.error(error);
  res.status(500).json({
    message: "Đã xảy ra lỗi trong quá trình cập nhật trạng thái tài khoản.",
  });
}
})
router.get('/accountInfo/:id', async function(req, res, next) {
    try {
        const { id } = req.params;
        const account = await modelsAccount.findById(id);
        if (!account) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
        }
        res.json({
            firstName: account.firstName,
            lastName: account.lastName,
            avatar: account.avatar,
            username: account.username
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Lấy thông tin cơ bản của user (tên và ảnh)
router.get('/userInfo/:id', async function(req, res) {
  try {
    const { id } = req.params;
    const user = await modelsAccount.findById(id).select('firstName lastName avatar username');
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Lấy thông tin nhiều users cùng lúc
router.post('/multipleUsers', async function(req, res) {
  try {
    const { userIds } = req.body;
    const users = await modelsAccount.find({
      '_id': { $in: userIds }
    }).select('firstName lastName avatar username');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});


module.exports = router;
