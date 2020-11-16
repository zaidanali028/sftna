



const toastr=require('toastr')
const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const port =process.env.PORT||5050;
const flash = require("connect-flash");
const session = require("express-session");
const ejs = require("ejs");
const mongoose = require("mongoose");
const uploader = require("express-fileupload");
const favicon = require('serve-favicon')
const cookieParser = require('cookie-parser');
const async = require('async');
const crypto = require('crypto')

const db = require("./config/keys");
const dbUrI = db.dbUrl;

const passport=require('passport')
require("./config/passport")(passport);



//db connection
mongoose
  .connect(dbUrI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((connected) => {
    console.log("db connected");
  })
  .catch((err) => {
    console.log(err);
  });

//express-fileupload middleware
app.use(uploader());
//body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
//static files
app.use(express.static(path.join(__dirname, "./public")));
// favicon

app.use(favicon(__dirname + '/public/img/favicon.ico'));

//method override to be used for sending put requests
app.use(methodOverride("_method"));

//cookieParser() should always come before session!
app.use(cookieParser())

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
    //cookie: { secure: true }
  })
);


//This should alwayse between session and flash
app.use(passport.initialize());
app.use(passport.session());


//view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.set(express.static(path.join(__dirname, "public")));

//flash message
app.use(flash());


//declaring local variables for displaying FLASH messages
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.user = req.user || null;

  next();
});
// //routes
const homeRoutes=require('./routes/home/index')
const adminRoutes=require('./routes/admin/index')
const userRoute=require('./routes/user/index')
const { dbUrl } = require("./config/keys");

 //route usages
app.use('/',homeRoutes)
app.use('/admin',adminRoutes)
app.use('/admin/user',userRoute)

app.get('*',(req,res,next)=>{
  res.render('admin/page404')
})
app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
