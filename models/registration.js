const mongoose = require('mongoose')


//Schema Registration form of member
const registrationSchema = new mongoose.Schema({
    id:{
        type:String,
        required:true,
        unique:true
    },
    username:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:Object,
        required:true
    },
    firstname:{
        type:String,
        required:true
    },
    lastname:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    accountImage:{
        type:Object,
        required:true
    },
    verified:{
        type:Boolean,
        required:true
    }
    

    
},{timestamps:true})

module.exports = mongoose.model("Members",registrationSchema)