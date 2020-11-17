require("dotenv").config();
const User = require("../../models/User");
const Payment = require("../../models/Payment");
const { Router } = require("express");
const express = require("express");
const router = express.Router();
const sgMail = require("@sendgrid/mail");
const Announcements = require("../../models/Announce");
const Questionaire = require("../../models/Questionaire");
const {ensureAuthenticated}=require('../../config/auth')
const {adminAuth}=require('../../config/adminAuth')
const key =process.env.SENDGRID_KEY

  

router.get("/",ensureAuthenticated,adminAuth ,(req, res) => {
  const Data = [
    Payment.count({}).exec(),
    User.count({}).exec(),
    Announcements.count({}).exec(),
    Questionaire.count({}).exec(),
  ];
  Promise.all(Data).then(([payments, users, announcements, questions]) => {
    res.render("admin/index", { payments, users, announcements, questions });
  });
});

router.get("/payments",ensureAuthenticated,adminAuth, async (req, res) => {
  let payer = "";
  let date = "";
  let amount = "";
  let payerArray = [];
  let totalForMonth = 0;
  let totalForYear = 0;

  const currentMonth = new Date().getMonth() + 1; // Get current month
  const currentYear = new Date().getFullYear(); // Get current year
  //console.log(currentYear)

  // get all payments from the database
  const allPayments = await Payment.find({}).populate("userId");

  for (const singlePayment of allPayments) {
    let currentM = new Date(singlePayment.createdAt).getMonth() + 1;
    let currentY = new Date(singlePayment.createdAt).getFullYear();

    if (currentM === currentMonth && currentY === currentYear) {
      totalForMonth += parseFloat(singlePayment.amount);
      payer = singlePayment.userId.name;
      date = new Date(singlePayment.date).toDateString();
      amount = singlePayment.amount;
      payerArray.push({
        payerName: payer,
        paymentDate: date,
        paymentAmount: amount,
      });

      // console.log(payer)
    }
    //Getting yearly total
    if (currentY === currentYear) {
      totalForYear += parseInt(singlePayment.amount);
    }
  }

  await User.find({})
    .populate("payment")
    .then((users) => {
      Payment.find({}).then((allPAyments) => {
        let paymentArray = [];

        allPAyments.forEach((payment) => {
          paymentArray.push(payment.amount);
        });
        //initially,total will be 0 and amount will be the frst value in the array
        //then the second loop will have the first value in the array as total ,then
        //add the second value to the first on,till the length of the array exhausts
        const sum = paymentArray.reduce(function (total, amount) {
          return total + amount;
        });
        // console.log(sum)
        // console.log(paymentArray)

        res.render("admin/payment", {
          users,
          sum,
          totalForMonth,
          totalForYear,
          allPayments,
          payerArray,
        });
      });
    });
});

router.get("/print", ensureAuthenticated,adminAuth,(req, res) => {
  let payer = "";
  let date = "";
  let amount = "";
  let payerArray = [];
  let totalForMonth = 0;
  let totalForYear = 0;
  const currentMonth = new Date().getMonth() + 1; // Get current month
  const currentYear = new Date().getFullYear(); // Get current year
  //console.log(currentYear)

  // get all payments from the database
  Payment.find({}).populate("userId")
  .then((payment) => {
    payment.forEach((pay) => {
      // console.log(pay.amount);
      let currentM = new Date(pay.createdAt).getMonth() + 1;
      let currentY = new Date(pay.createdAt).getFullYear();

      if (currentM === currentMonth && currentY === currentYear) {
        totalForMonth += parseFloat(pay.amount);
        payer = pay.userId.name;
        console.log(payer)
        date = new Date(pay.date).toDateString();
        amount = pay.amount;
        payerArray.push({
          payerName: payer,
          paymentDate: date,
          paymentAmount: amount,
        });
      }

      //Getting yearly total
      if (currentY === currentYear) {
        totalForYear += parseInt(pay.amount);
      }
    });
  });

  User.find({})
    .populate("payment")
    .then((users) => {
      // console.log(users)
      Payment.find({}).then((allPAyments) => {
        let paymentArray = [];

        allPAyments.forEach((payment) => {
          paymentArray.push(payment.amount);
        });
        //initially,total will be 0 and amount will be the frst value in the array
        //then the second loop will have the first value in the array as total ,then
        //add the second value to the first on,till the length of the array exhausts
        const sum = paymentArray.reduce(function (total, amount) {
          return total + amount;
        });
        // console.log(sum)
        // console.log(paymentArray)

        res.render("admin/print", {
          users,
          sum,
          totalForMonth,
          totalForYear,
          payerArray,
        });
      });
    });
});

//making payment
router.get("/newpayment",ensureAuthenticated,adminAuth, (req, res) => {
  User.find({}).then((users) => {
    res.render("admin/newpayment", { users });
  });
});

router.post("/pateron/pay/",ensureAuthenticated,adminAuth, (req, res) => {
  // res.send('success')
  const id = req.body.members;
  const { amount } = req.body;
  // console.log(amount);
  User.findById(id).then((user) => {
    const newPay = new Payment({
      amount,
      userId: user._id,
    });
    user.payment.push(newPay);
    user.save().then((savedpayment) => {
      newPay.save().then((payment) => {
        req.flash("success_msg", "Payment Successful");
        res.redirect("/admin/payments");
      });
    });
  });
});

router.get("/edit/payment/:id",ensureAuthenticated,adminAuth, (req, res) => {
  const amountId = req.params.id;
  Payment.findOne({ _id: amountId }).then((payment) => {
    res.render("admin/editpayment", { payment });
  });
});
router.post("/edit/payment/:id",ensureAuthenticated,adminAuth, (req, res) => {
  const amountId = req.params.id;
  const newAmount = req.body.amount;
  console.log(newAmount);
  //     Payment.findOne({_id:amountId}).then(payment=>{
  //         payment.amount=newAmount
  //    res.redirect('/admin/payments')
  Payment.findByIdAndUpdate(
    { _id: amountId },
    {
      $set: {
        amount: newAmount,
      },
    }
  ).then((updatedPayment) => {
    req.flash("success_msg", "Succeded In Updating Payment Field");
    res.redirect("/admin/payments");
  });
});

//deleting payment route
router.delete("/deletepayment/:id", ensureAuthenticated,adminAuth,(req, res) => {
  // res.send('deleted')
  const { id } = req.params;
  Payment.findOneAndDelete({ _id: id }).then((payment) => {
    payment.remove();
    req.flash("error_msg", "Payment Was Deleted");
    res.redirect("/admin/payments");
  });
});

//Delete User
router.delete("/delete/user/:id", ensureAuthenticated,adminAuth,(req, res) => {
  const userId = req.params.id;
  User.findByIdAndDelete({ _id: userId }).then((user) => {
    user.remove();
    req.flash("error_msg", "User Deleted");
    res.redirect("/admin/payments");
  });
});

//Delete User with payments
router.delete("/delete/user/all/:id",ensureAuthenticated,adminAuth, (req, res) => {
  //res.send('wwwooow')
  const userId = req.params.id;
  User.findOne({ _id: userId })
    .populate("payment")
    .then((user) => {
      //  console.log(user.payment)

      for (payment of user.payment) {
        Payment.findByIdAndDelete(payment._id).then((payment) => {
          payment.remove();
        });
      }
      user.remove();
      req.flash("error_msg", "Deleted User With Payments!");
      res.redirect("/admin/payments");
    });
});

//Delete User's payments
router.delete("/clear/user/all/:id",ensureAuthenticated,adminAuth, (req, res) => {
  //res.send('wwwooow')
  const userId = req.params.id;
  User.findOne({ _id: userId })
    .populate("payment")
    .then((user) => {
      //  console.log(user.payment)

      for (payment of user.payment) {
        Payment.findByIdAndDelete(payment._id).then((payment) => {
          payment.remove();
        });
      }
      req.flash("error_msg", `All ${user.name} 's Payments Have Been Deleted `);
      res.redirect("/admin/payments");
    });
});
router.get("/interact",ensureAuthenticated,adminAuth, (req, res) => {
  User.find({}).then((users) => {
    res.render("admin/interact", { users });
  });
});

router.get("/user/email/:id",ensureAuthenticated,adminAuth, (req, res) => {
  const userId = req.params.id;
  User.find({}).then((users) => {
    User.findOne({ _id: userId })
      .then((aUser) => {
        res.render("admin/interact-form", { users, aUser });
      })
      .catch((err) => console.log(err));
  });
});

router.post("/user/email/:id", ensureAuthenticated,adminAuth,(req, res) => {
  // console.log(req.body)
  let errors = [];
  const userId = req.params.id;
  const { subject } = req.body;
  const { message } = req.body;

  if (!subject || !message) {
    errors.push({ msg: "Please fill in All Fields" });
  }
  if (errors.length > 0) {
    User.find({}).then((users) => {
      User.findById(userId).then((aUser) => {
        return res.render("admin/interact-form", {
          errors,
          subject,
          message,
          users,
          aUser,
        });
      });
    });
  }
  User.findById(userId).then((user) => {
    sgMail.setApiKey(key);
    const msg = {
      to: user.email, // Change to your recipient
      from: "developersavenue@gmail.com", // Change to your verified sender
      subject: subject,
      text: message, // html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    };
    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
        req.flash("success_msg", `Successfully sent an email to  ${user.name}`);
        res.redirect("/admin/interact");
      })
      .catch((error) => {
        console.error(error);
      });
    //res.send("mail")

    // console.log(user)
  });
});

router.get("/users/email", ensureAuthenticated,adminAuth,(req, res) => {
  User.find({}).then((users) => {
    User.count({}).then((userCount) => {
      res.render("admin/mailall", { users, userCount });
    });
  });
});

router.post("/users/email",ensureAuthenticated,adminAuth, (req, res) => {
  const { subject, message } = req.body;
  let errors = [];
  const userId = req.params.id;

  if (!subject || !message) {
    errors.push({ msg: "Please fill in All Fields" });
  }
  if (errors.length > 0) {
    User.find({}).then((users) => {
      User.count({}).then((userCount) => {
        return res.render("admin/mailall", {
          errors,
          subject,
          message,
          users,
          userCount,
        });
      });
    });
  }
  User.find({}).then((allUsers) => {
    allUsers.forEach((user) => {
      sgMail.setApiKey(key);
      const msg = {
        to: user.email, // Change to your recipient
        from: "developersavenue@gmail.com", // Change to your verified sender
        subject: subject,
        text: message, // html: '<strong>and easy to do anywhere, even with Node.js</strong>',
      };
      sgMail
        .send(msg)
        .then(() => {
          console.log("Email sent to all members");

          req.flash("success_msg", `Successfully Sent All-Emails`);
          res.redirect("/admin/interact");
        })
        .catch((error) => {
          console.error(error);
        });
    });
  });
  //console.log(subject,message)
});

router.get("/users/announce/",ensureAuthenticated,adminAuth, (req, res) => {
  User.find({}).then((users) => {
    Announcements.find({}).populate('user')
    .then((allAnnouncements) => {
      res.render("admin/announce", { users, allAnnouncements });
    });
  });
});
//validation stage
router.post("/users/announce/",ensureAuthenticated,adminAuth, (req, res) => {
  let errors = [];
  const { message } = req.body;
  if (!message) {
    errors.push({ msg: "Please Fill This Form Field" });
  }
  if (message.length >= 150) {
    errors.push({
      msg: "Announcemet Message must be exactly 50 characters or less",
    });
    // req.flash("error_msg", "Announcemet Message must be exactly 50 words or less");
  }
  //console.log(errors)

  if (errors.length > 0) {
    User.find({}).then((users) => {
      Announcements.find({}).then((allAnnouncements) => {
        return res.render("admin/announce", {
          users,
          allAnnouncements,
          message,
          errors,
        });
      });
    });
  } else {
    const Announce = new Announcements({
      message,
      user:req.user._id
      
    });
    Announce.save().then((newAnnouncement) => {
      req.flash(
        "success_msg",
        "New Announcement Has Been Posted To The Homepage "
      );
      res.redirect("/admin/users/announce");
    });
  }
});
router.get("/edit/announcement/:id",ensureAuthenticated,adminAuth, (req, res) => {
  User.find({}).then((users) => {
    Announcements.find({}).then((allAnnouncements) => {
      Announcements.findById(req.params.id).then((foundAnnouncement) => {
        res.render("admin/edit-announce", {
          users,
          allAnnouncements,
          foundAnnouncement,
        });
      });
    });
  });
});

router.post("/edit/announcement/:id",ensureAuthenticated,adminAuth, (req, res) => {
  const announcementId = req.params.id;
  let errors = [];
  const { message } = req.body;
  if (!message) {
    errors.push({ msg: "Please Fill This Form Field" });
  }
  if (message.length >= 50) {
    errors.push({
      msg: "Announcemet Message must be exactly 50 words or less",
    });
    // req.flash("error_msg", "Announcemet Message must be exactly 50 words or less");
  }
  if (errors.length > 0) {
    User.find({}).then((users) => {
      Announcements.findById(announcementId).then((foundAnnouncement) => {
        Announcements.find({}).then((allAnnouncements) => {
          return res.render("admin/edit-announce", {
            users,
            foundAnnouncement,
            allAnnouncements,
            message,
            errors,
          });
        });
      });
    });
  }
  const msgUpdate = req.body.message;
  Announcements.findOneAndUpdate(
    { _id: announcementId },
    {
      $set: {
        message: msgUpdate,
      },
    }
  ).then((updatedMsg) => {
    req.flash("success_msg", "Updated Announcement Successfully");
    res.redirect("/admin/users/announce");
  });
});

router.delete("/delete/announcement/:id",ensureAuthenticated,adminAuth, (req, res) => {
  const announcementId = req.params.id;
  // res.send('delete announcement')
  Announcements.findByIdAndDelete({ _id: announcementId }).then(
    (announcement) => {
      announcement.remove();
      res.redirect("/admin/users/announce");
    }
  );
});

router.get("/users/questionaire/",ensureAuthenticated,adminAuth, (req, res) => {
  User.find({}).then((users) => {
    Questionaire.find({}).then((allQuestions) => {
      res.render("admin/questionaire", { users, allQuestions });
    });
  });
});

router.post("/users/questionaire/", ensureAuthenticated,adminAuth,(req, res) => {
  const { question, answer } = req.body;
  let errors = [];

  if (!question || !answer) {
    errors.push({ msg: "Please Define Both A Question And A Answer" });
  }
  if (question.length >= 30) {
    errors.push({
      msg:
        "Please Your Question Phrase Must Be In A Range Of 10 Words Or Less ",
    });
    // req.flash("error_msg", "Announcemet Message must be exactly 50 words or less");
  }
  if (errors.length > 0) {
    User.find({}).then((users) => {
      Questionaire.find({}).then((allQuestions) => {
        return res.render("admin/questionaire", {
          users,
          allQuestions,
          errors,
          question,
        });
      });
    });
  }
  // console.log(question,answer)
  const questAns = new Questionaire({
    question,
    answer,
  });
  questAns.save().then((questAnsSaved) => {
    req.flash("success_msg", "Added A Question And An Answer Successfully");
    res.redirect("/admin/users/questionaire");
  });
});
router.get("/edit/questionaire/:id",ensureAuthenticated,adminAuth, (req, res) => {
  const questionId = req.params.id;
  User.find({}).then((users) => {
    Questionaire.findById(questionId).then((questionAndAns) => {
      Questionaire.find({}).then((allQuestions) => {
        res.render("admin/edit-questionaire", {
          questionAndAns,
          users,
          allQuestions,
        });
      });
    });
  });
});

//Update Questionaire
router.post("/users/questionaire/:id", ensureAuthenticated,adminAuth,(req, res) => {
  const questionId = req.params.id;
  const { question, answer } = req.body;
  let errors = [];

  if (!question || !answer) {
    errors.push({ msg: "Please Define Both A Question And A Answer" });
  }
  if (question.length >= 30) {
    errors.push({
      msg:
        "Please Your Question Phrase Must Be In A Range Of 10 Words Or Less ",
    });
    // req.flash("error_msg", "Announcemet Message must be exactly 50 words or less");
  }
  if (errors.length > 0) {
    User.find({}).then((users) => {
      Questionaire.findById(questionId).then((questionAndAns) => {
        Questionaire.find({}).then((allQuestions) => {
          return res.render("admin/edit-questionaire", {
            questionAndAns,
            users,
            allQuestions,
            errors,
          });
        });
      });
    });
  }

  Questionaire.findByIdAndUpdate(
    { _id: questionId },
    {
      $set: {
        question,
        answer,
      },
    }
  ).then((updatedQA) => {
    req.flash("success_msg", "Updated Question And Answer Successfully");
    res.redirect("/admin/users/questionaire");
  });
  // res.send('workoingfwefrig')
});

router.delete("/delete/questionaire/:id",ensureAuthenticated,adminAuth, (req, res) => {
  questionId = req.params.id;
  Questionaire.findByIdAndDelete({ _id: questionId }).then((question) => {
    question.remove();
    req.flash('success_msg','Successfully Deleted Announcement')
    res.redirect("/admin/users/questionaire");
  });
});
router.get("/edituser/:id",ensureAuthenticated,adminAuth, (req, res) => {
  const userId = req.params.id;
  User.findOne({ _id: userId }).then((user) => {
    res.render("admin/edituser", { user });
  });
});
router.post("/edituser/:id",ensureAuthenticated,adminAuth, (req, res) => {
  const { name, email, sex, location, reason } = req.body;
  let { phoneNumber } = req.body;
  let userId = req.params.id;
  let errors = [];

  if (!name || !email || !sex || !location || !reason || !phoneNumber) {
    errors.push({ msg: "Please Fill All Input Fields " });
  }

  if (errors.length > 0) {
    User.findOne({ _id: userId }).then((user) => {
      return res.render("admin/edituser", {
        errors,
        user,
        name,
        email,
        sex,
        location,
        reason,
      });
    });
  }

  function isNotEmpty(object) {
    //am  checking if there is a key(uploader) in the object ,and if there is ,we will return true or false otherwise
    for (let key in object) {
      // console.log(key)
      if (object.hasOwnProperty(key)) {
        return true;
      }
    }
    return false;
  }
  let fileName = "";
  //console.log(req.files)
  if (isNotEmpty(req.files)) {
    const fileObject = req.files.uploader;
    console.log(fileObject);
    fileName = new Date().getSeconds() + "-" + fileObject.name;
    //the new Date().getSeconds+'-'+ is there to prevent duplicate picturename
    fileObject.mv("./public/uploads/" + fileName, (err) => {
      if (err) console.log(err);
      console.log("has something");
    });
  } else {
    console.log("has nothing");
  }

  User.findByIdAndUpdate(
    { _id: userId },
    {
      $set: {
        name,
        email,
        sex,
        location,
        reason,
        phoneNumber,
        uploader: fileName,
      },
    }
  ).then((userUpdate) => {
    req.flash(
      "success_msg",
      `Successfully Updated ${userUpdate.name}'s Profile`
    );
    res.redirect("/admin/payments");
  });
});
router.get('/logout',(req,res)=>{
  req.logOut()
  req.flash('success_msg','You Have Successfully Logged Out')
  res.redirect('/login')
})

// router.get("/pending", ensureAuthenticated,adminAuth,(req, res) => {
router.get("/pending",ensureAuthenticated,adminAuth,(req, res) => {

  const PendinUserArray=[]
  User.find({})
  .then(users=>{
    users.forEach(pateron=>{
      // console.log(pateron.name)
      if(pateron.status===false){
        PendinUserArray.push({
          pateronName:pateron.name,
          pateronId:pateron._id,
          pateronReason:pateron.reason,
          pateronPicture:pateron.uploader,
          pateronSince:new Date(pateron.createdAt).toDateString(),
        })
        

      }
    })
    //  console.log(PendinUsergArray)
    res.render('admin/pending',{
      PendinUserArray,
      users:users

})
  })
  //res.send('working')

})
router.put('/accept/pending/:id',(req,res)=>{
  const userId=req.params.id
  User.findByIdAndUpdate({_id:userId},{$set:{
      status:true
  }})
  .then(acceptedUser=>{
    sgMail.setApiKey(key);
    const msg = {
      to: acceptedUser.email, // Change to your recipient
      from: "developersavenue@gmail.com", // Change to your verified sender
      subject: 'SFTNA ACCOUNT ACTIVATION E-MAIL',
      text: `
      After reviewing your account,we saw the need to accept you as one of our paterons.As a 
      pateron of this noble foundation,you have a great role to play,not Just financial support,It counts 
      but looking at the bigger picture,we will love to have you present anytime we are having a meeting, 
      doing a volunteer work or anything withing the layers of humanity.You can now log into your account,
      click on this link https://${req.headers.host}/login 
      We thank you once again for accepting to help the  needy.
      From Your Admin,
      ${req.user.name}

      

      `, // html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    };
     sgMail
       .send(msg)
      .then(() => {
        let sex=''
        if(acceptedUser.sex==='Male'){
          sex='him'
        }else{
          sex='her'
        }
    req.flash('success_msg',`Woow,${acceptedUser.name} is now a member of SmileForTheNeedaid,You just sent an e-mail to ${sex}!`)
    res.redirect('/admin/pending')
  })
  })
  
})

router.delete('/delete/pending/:id',(req,res)=>{
  User.findByIdAndDelete({_id:req.params.id})
  .then(user=>{
    user.remove()
    req.flash('success_msg','Declined User Successfully!')
    res.redirect('/admin/pending')
  })
})

module.exports = router;
