const mongoose = require('mongoose')

// Define the schema for chatting rooms
const chatChannelSchema = new mongoose.Schema({
    roomName: {
        type: String,
        required: true
    },
    messages: [{
        senderData: { type: Object, required: true },
        content: { type: String , default:''},
        images: { type: Array, default:null},
        video:{ type: Object, default:null},
        file:{type: Object, default:null},
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Define the schema for talking rooms
const talkingChannelSchema = new mongoose.Schema({
    roomName: {
        type: String,
        required: true
    },
    participants: [{
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                default: mongoose.Types.ObjectId,
                require:true
            },
            id: {
                type: String,
                require:true
            },
            username: String,
            password: String,
            firstname: String,
            lastname: String,
            email: String,
            accountImage: Object,
            createdAt: {
                type: Date,
                default: Date.now
            },
            updatedAt: {
                type: Date,
                default: Date.now
            },
        }
    ]
}, { timestamps: true });

//Schema mainTalkingroomSchema form 
const mainTalkingroomSchema = new mongoose.Schema({
    slug:{
        type:String,
        require:true,
        unique:true
    },
    creator:[{
        participant:{type:String, require:true} , 
        status:{type:String, require:true , enum:['online','offline'] , default:'offline'},
        timestamp:{type:Date, require:true , default:Date.now}
    }],
    admins:[{
        participant:{type:String, require:true} , 
        status:{type:String, require:true , enum:['online','offline'] , default:'offline'},
        timestamp:{type:Date, require:true , default:Date.now}
    }],
    roomName:{ 
        type:String,
        require:true
    },
    roomDescription:{
        type:String,
        require:true
    },
    roomIcon:{
        type:Object,
        require:true
    },
    participants:[{
         participant:{type:String, require:true} ,
         status:{type:String, require:true , enum:['online','offline'] , default:'offline'},
         timestamp:{type:Date, require:true , default:Date.now}
    }],
    requests:[{
        type:String,
        require:true
    }],
    chatChannels: [chatChannelSchema], // Array of chatting rooms
    talkingChannels: [talkingChannelSchema] // Array of talking rooms
    
},{timestamps:true})

module.exports = mongoose.model("Talkingrooms",mainTalkingroomSchema)