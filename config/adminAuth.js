module.exports={
          adminAuth: function(req,res,next){
        if(req.user.isAdmin===1){
            return next()
        }
        
    
    else if(req.user.isAdmin===0){
        req.flash('error_msg','Sorry,A Pateron Cannot Access That Portal,Unless You Are An Admin')
        res.redirect('/admin/user')
    }
    }
}