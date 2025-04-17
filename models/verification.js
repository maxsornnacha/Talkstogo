const mongoose = require('mongoose')


//Schema Registration form of member
const verificationSchema = new mongoose.Schema({
    userID:{
        type:String,
        required:true,
        unique:true
    },
    OTP:{
        type:String,
        required:true
    }
    
},{timestamps:true})

module.exports = mongoose.model("Verifications",verificationSchema)