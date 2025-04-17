const mongoose = require('mongoose')


//Schema for friend relationship form of member
const friendshipSchema = new mongoose.Schema({
    requester:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        require:true,
    },
    recipient:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        require:true,
    },
    status:{
        type:String,
        enum:['pending','accepted'],
        default:'pending'
    }

    
},{timestamps:true})

module.exports = mongoose.model("FriendShip",friendshipSchema)