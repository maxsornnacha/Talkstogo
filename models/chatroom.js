const mongoose = require('mongoose')


//Schema for chat room form 
const chatroomSchema = new mongoose.Schema({
    participants:[{
        type:String,
        require:true,
    }],
    messages:[{
        senderID: { type:String, required: true },
        content: { type: String, default:''},
        image: { type: Object , default:null},
        timestamp: { type: Date, default: Date.now },
        isRead:{type: Boolean, default:false}
    }]

    
},{timestamps:true})

module.exports = mongoose.model("Chatrooms",chatroomSchema)