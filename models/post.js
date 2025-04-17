const mongoose = require('mongoose')


//Schema post form
const postSchema = new mongoose.Schema({
    account_id:{
        type:String,
        required:true,
    },
    accountID:{
        type:String,
        required:true,
    },
    postID:{
        type:String,
        required:true,
        unique:true
    },
    firstname:{
        type:String,
        required:true,
    },
    lastname:{
        type:String,
        required:true,
    },
    accountImage:{
        type:Object,
        required:true
    },
    content:{
        type:String, 
        default:''
    },
    image:{
        type:Object,
        default:null
    },
    video:{
        type:Object,
        default:null
    },
    currentDate:{
        type:String,
        required:true,
    },
    currentTime:{
        type:String,
        required:true
    },
    comments:{
        type:Array,
        required:true
    },
    likes:{
        type:Array,
        required:true,
    }

    
},{timestamps:true})

module.exports = mongoose.model("Posts",postSchema)