const LocalStrategy=require("passport-local").Strategy
const mongoose=require('mongoose')
const bcrypt=require('bcryptjs')


//User model
const User=require('../models/User')

//passport will be defined in the app.js
module.exports=(passport)=>{
    passport.use(
        new LocalStrategy({usernameField:'email'},(email,password,done)=>{
            //({usernameField:'email'}=>means we will be using email to look for the user who 
            //wants to login and=>(email,password,done) email=user email gotten from req.body.email
            //password too same as email and the done is a function
            User.findOne({email:email})
            .then(user=>{
                if(!user){
                    
                    // null=error
                    // user=false
                    // options
                    //the done here takes the above 3 options
                    //the message object is an error message so it will be displayed in <%=error%> from flashes.ejs
                    return done(null,false,{message:'That email you entered aint registered'})
                }
                //console.log(user.password)
                //MAtch password
                bcrypt.compare(password,user.password,(err,isMatch)=>{
                        if(err){
                            console.log(err)
                        } 

                        if (isMatch){
                            return done(null,user)
                        }
                        else{
                            return done(null,false,{message:'Password is incorrect'})
                        }
                })
            })
            .catch(err=>console.log(err))
        }
        )
    )
//serializing and deserializing credentials(in a form of sessions here)
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });


}