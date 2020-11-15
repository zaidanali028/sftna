const mongoose = require("mongoose");
const User = new mongoose.Schema(
  {
    payment: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "payments",
      },
    ],
    name: {
      type: String,
    },
    date: {
      type: Date,
      default:new Date
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    uploader:{
      type:String,
     
  },

    sex: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },

    location: {
      type: String,
    },
    reason: {
      type: String,
    },
    isAdmin:{
        type:Number,
        default:0
    },
    role:{
      type:String,
      default:"Student"
      
    },
    status:{
      type:Boolean,
      default:false
    },
    resetPasswordToken: {
      type:String,
    },
  resetPasswordExpires: {
    type:Date
  }

  },
  { timestamps: true }
);
const Usermodel = mongoose.model("users", User);
module.exports = Usermodel;
