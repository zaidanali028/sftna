const mongoose = require("mongoose");
const announcement = new mongoose.Schema(
  {
    message: {
      type: String,
    },
    date:{
        type:Date,
        default:new Date
    },
    user: {
      type:mongoose.Schema.Types.ObjectId,
      ref:'users'
    }
  },
  { timestamps: true }
);
const announcementModel = mongoose.model("announcements", announcement);
module.exports = announcementModel;
