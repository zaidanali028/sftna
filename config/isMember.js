module.exports={
    isMember: function(req,res,next){
  if(req.user.status===true){
      return next()
  }
  

else if(req.user.status===false){
  req.flash('error_msg','Sorry,Your Account Is Under Review,Kindly wait A few Hours/Days Before Verification.We will send you an email after review and get back to you')
  res.redirect('/login')
}
}
}