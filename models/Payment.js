const mongoose=require('mongoose')
const payment=new mongoose.Schema({
    amount:{
        type:Number
    },
    date:{
        type:Date,
        default:new Date
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users'
    },
    
  
} ,{ timestamps: true })
const paymentModel=mongoose.model('payments',payment)
module.exports=paymentModel