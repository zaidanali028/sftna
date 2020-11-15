//This is required to prevent others from
//Accessing the dashoboard route without
//logging in
module.exports={
    ensureAuthenticated: function(req,res,next){
        if(req.isAuthenticated()){
            return next()
        }
      
    
        req.flash('error_msg','Please login to view portal')
        res.redirect('/login')
    }
}