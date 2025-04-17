const Chatrooms = require('../models/chatroom')
const Members = require('../models/registration')
const cloudinary = require('cloudinary')
const { v4: uuidv4 } = require('uuid');

cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
    api_key:process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.COULDINARY_API_SECRET 
  });

exports.createChatroom = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const {senderID,getterID} = req.body
    const exitingChatroom = await Chatrooms.findOne({participants:{$all:[senderID,getterID]}})

    if(exitingChatroom){
        res.status(400).json({error:'This chatroom cannot be created, as it already exists.'})
    }
    else{

    await Chatrooms.create({
        participants:[senderID,getterID],
        messages:[]
    })
    .then(()=>{
        res.json('Success')
    })
    .catch((error)=>{
        console.log('Creating a chat room goes wrong due to :', error)
        res.status(400).json({error:"Error creating a chatroom because it doesn't meet the required conditions"})
        statusDisplay = 400
        errorMessage = "Error creating a chatroom because it doesn't meet the required conditions"
    })

    }
}
catch(error){
        console.log('Creating a chat room goes wrong due to :', error)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}
}

exports.readMessage = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const {senderID,getterID} = req.body
    await Chatrooms.findOneAndUpdate(
    {
        participants:{$all:[senderID,getterID]},
        'messages.isRead':false
    },
    {
        $set: { 'messages.$[unreadMessage].isRead': true } 
    },
    {
        arrayFilters: [{ 'unreadMessage.isRead': false , 'unreadMessage.senderID': { $ne: senderID } }],
        new:true,
        timestamps:false
    }
    ).exec()
    .then((data)=>{
        if(data){
        res.json({messages:data.messages,senderID:senderID})
        }
        else{
        res.json(null)
        }
    })
    .catch((error)=>{
        console.log('Reading the message erroneously due to :', error)
        res.status(404).json({error:'No data was found'})
        statusDisplay = 404
        errorMessage = 'No data was found'
    })
    }
    catch(error){
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
    }
}

exports.sendMessage = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
    try{
    const {senderID,getterID,message} = req.body
    let {image} = req.body
    let public_id = ''

    //Upload image to cloud storage
    if(image){
        await cloudinary.v2.uploader.upload(image,
            { public_id:`${uuidv4()}-${Date.now()}`,
              folder:'talkstogo/chat-images'
            })
            .then((result)=>{
                image=result
                public_id=result.public_id
            })
            .catch((err)=>{
                res.status(404).json({error:"Uploading image failed, please try again"})
                console.log(err)
                statusDisplay = 404
                errorMessage = 'Uploading image failed'
            })
    }


    await Chatrooms.findOneAndUpdate({participants:{$all:[senderID,getterID]}},{
        $push: {
            messages: { senderID:senderID, content:message, image:image }
             }
    },{
        new: true, // Return the modified document
        upsert: true // If the conversation doesn't exist, create it 
    })
    .exec()
    .then((data)=>{
        res.json(data.messages)
    })
    .catch((error)=>{
        console.log('Error sending messages due to :', error)
        res.status(404).json({error:'No data was found'})
        statusDisplay = 404
        errorMessage = 'No data was found'

          // Delete the image
          cloudinary.uploader.destroy(public_id)
          .then((result)=>console.log('Image deleted successfully:', result))
          .catch((error)=> console.error('Image deleted unsuccessful:', error))

    })
    }
    catch(error){
        console.log('Error sending messages due to :', error)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})

        // Delete the image
        cloudinary.uploader.destroy(public_id)
        .then((result)=>console.log('Image deleted successfully:', result))
        .catch((error)=> console.error('Image deleted unsuccessful:', error))
    }

}


exports.getMessage = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
    try{

    const {senderID,getterID} = req.body

    await Chatrooms.findOne({participants:{$all:[senderID,getterID]}}).exec()
    .then((data)=>{
        res.json(data)
    })
    .catch((error)=>{
        console.log('Message fetching error due to :', error)
        res.status(404).json({error:'No data was found'})
        statusDisplay = 404
        errorMessage = 'No data was found'
    })

    }
    catch(error){
        console.log('Message fetching error due to :', error)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
    }
}


exports.getAllMessages = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
    try{
    const {senderID} = req.params
    
    await Chatrooms.find({participants:{$all:[senderID]}}).exec()
    .then(async (data)=>{
        const messageAll = await data.filter((chatData)=>{
            return (chatData.messages.length !== 0)
        })
        res.json(messageAll)
    })
    .catch((error)=>{
          console.log('All message fetching error due to :', error)
          res.status(404).json({error:'No data was found'})
          statusDisplay = 404
          errorMessage = 'No data was found'
    })

    }
    catch(error){
        console.log('All message fetching error due to :', error)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
    }
}


exports.getAllMessageAndAccounts = async (req,res)=>{
try{
    const { allMessages,userID} = req.body
    const allMessagesAndAccounts = await Promise.all( allMessages.map(async (chatData)=>{
        const getterFiltered = await Promise.all(
         chatData.participants.filter(participantID=>participantID !== userID)
        )
        const getterInfo = await Promise.all(
        getterFiltered.map( async (participantID)=>{
                const getterInfo = await Members.findById(participantID).exec()
                return getterInfo
        })
       )
        
        return getterInfo[0]
    })
    )

    res.json(allMessagesAndAccounts)

}
catch(error){
    console.log('Fetching all chat accounts is error due to :', error)
    res.status(500).json({error:error.message})
}
 
}

exports.deleteChatmessegeRoom = async (req,res) => {
    let statusDisplay = ''
    let errorMessage = ''
try{
    const {senderID,getterID} = req.body
    await Chatrooms.findOne({participants:{$all:[senderID,getterID]}})
    .then((data)=>{
        const imageMsg = data.messages.filter((message)=>{
            return message.image
        })

        if(imageMsg && imageMsg.length > 0){
        const public_ids = imageMsg.map((message)=>{
            return message.image.public_id
        })

        // Delete the images in the chat box
        public_ids.forEach((public_id)=>{
        cloudinary.uploader.destroy(public_id)
        })
        }
    })

    await Chatrooms.findOneAndDelete({participants:{$all:[senderID,getterID]}})
    .then((data)=>{
        res.json(data)
    })
    .catch((error)=>{
        console.log('Deleting a chatroom erroneously due to :', error)
        res.status(404).json({error:'No data was found'})       
        statusDisplay = 404
        errorMessage = 'No data was found'
    })
    
}
catch(error){
    console.log('Deleting a chatroom erroneously due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}
}