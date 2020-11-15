const mongoose = require("mongoose");
const questionaire = new mongoose.Schema(
  {
    question:{
      type: String,


    },
    answer: {
      type: String,
    },
    date:{
        type:Date,
        default:new Date
    }
  },
  { timestamps: true }
);
const questionairetModel = mongoose.model("questionaaire", questionaire);
module.exports = questionairetModel;
