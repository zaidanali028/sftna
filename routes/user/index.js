const express = require("express");
const User = require("../../models/User");
const Payments = require("../../models/Payment");
const router = express.Router();
const { ensureAuthenticated } = require("../../config/auth");
const {isMember}=require('../../config/isMember')

router.get("/", ensureAuthenticated,isMember, (req, res) => {
  let userTotal = 0;
  let userPays = [];
  const id = req.user._id;
  //console.log(id)
  User.findById(id)
    .populate("payment")
    .then((user) => {
      user.payment.forEach((pay) => {
        userPays.push(pay.amount);
      });
     // console.log(userPays);
     userPays.forEach(amount=>{
         userTotal+=amount
     })
    // console.log(userTotal)
    User.findById(id)
    .populate('payment')
    .then(loggedUser=>{
        res.render(`user/index`, {
            user: req.user,
            userTotal:userTotal,
            loggedUser:loggedUser
          });
    

    })
    

    });

   
});

module.exports = router;
