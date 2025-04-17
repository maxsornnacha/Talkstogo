const TalkingRooms = require('../models/talkingroom')
const cloudinary = require('cloudinary')
const { v4: uuidv4 } = require('uuid');
const Members = require('../models/registration');

cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
    api_key:process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.COULDINARY_API_SECRET 
  });

exports.createTalkingRoom = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const slug = uuidv4()
    const {roomName,roomDescription,userID} = req.body
    let public_id = ''
    let roomIcon = req.body.roomIcon


    console.log(roomName, '+' , roomDescription , '+' , userID)

    //Upload image to cloud storage
    if(roomIcon){
        await cloudinary.v2.uploader.upload(roomIcon,
            { public_id:`${uuidv4()}-${Date.now()}`,
              folder:'talkstogo/room-images/room-icons'
            })
            .then((result)=>{
                roomIcon=result
                public_id=result.public_id
            })
            .catch((err)=>{
                res.status(404).json({error:"Uploading failed, please try again."})
                console.log(err)
            })
    }

     //Basic data uploaded on Talkingroom document
     await TalkingRooms.create({
        slug,
        creator:[],
        admins:[],
        roomName,
        roomDescription,
        roomIcon,
        chatChannels:[],
        talkingChannels:[],
        participants:[]
    })
    .then((data) => {
        //add member admin
        data.creator.push({participant:userID, status:'offline'})
        //chat channels default
        data.chatChannels.push({ roomName: 'General' });
        data.chatChannels.push({ roomName: 'Game' });
        data.chatChannels.push({ roomName: 'Music' });

        //talking channels default
        data.talkingChannels.push({ roomName: 'General talk' });
    
        return data.save();
    })
    .then((data)=>{
        res.json(data)
    })
    .catch((error)=>{
        console.log('Creating a talkingroom is error due to :', error)
        res.status(400).json({error:'Creating a talkingroom is error because the conditions are not met'})
        statusDisplay = 400
        errorMessage = 'Creating a talkingroom is error because the conditions are not met'

         // Delete the image
        if(req.body.roomIcon){
         cloudinary.uploader.destroy(public_id)
         .then((result)=>console.log('Image deleted successfully :', result))
         .catch((error)=> console.error('Image deleted unsuccessfully :', error))
        }
    })
    
}
catch(error){
    console.log('Creating a talkingroom is error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})

    // Delete the image
    if(req.body.roomIcon){
        cloudinary.uploader.destroy(public_id)
        .then((result)=>console.log('Image deleted successfully :', result))
        .catch((error)=> console.error('Image deleted unsuccessfully :', error))
    }
}
   
}


exports.getTalkingRooms = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{

    const {userID} = req.body
    TalkingRooms.find({
        $or: [
            { "creator.participant": userID },
            { "admins.participant": userID },
            { "participants.participant": userID }
        ]
    })
    .then((data)=>{
        if(data){
            res.json(data)
        }
        else{
            //You are not joining with any rooms
            console.log('Fetching all talkingrooms is error due to : NO data was found because you have not joined any rooms yet')
            res.status(404).json({error:'NO data was found because you have not joined any rooms yet'})
            statusDisplay = 404
            errorMessage = 'NO data was found because you have not joined any rooms yet'
        }
    })
    .catch((error)=>{
        console.log('Fetching all talkingrooms are error due to :', error)
        res.status(404).json({error:'NO data was found'})
        statusDisplay = 404
        errorMessage = 'NO data was found'
    })

}
catch(error){
    console.log('Fetching all talkingrooms are error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}

}

exports.getSingleTalkingRoom = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const {slug} = req.body

    TalkingRooms.findOne({slug})
    .then((data)=>{
        if(data){
            res.json(data)
        }
        else{
            //You have not joined this room yet
            res.status(404).json({error:'No data was found because you have not joined this room yet'})
            console.log('Fetching a talkingrooms is error due to : No data was found because you have not joined this room yet')
            statusDisplay = 404
            errorMessage = 'No data was found because you have not joined this room yet'
        }
    })
    .catch((error)=>{
        console.log('Fetching a talkingrooms is error due to :', error)
        res.status(404).json({error:'No data was found'})
        statusDisplay = 404
        errorMessage = 'No data was found'
    })

}
catch(error){
    console.log('Fetching a talkingrooms is error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}

}


exports.getAllMembers = async (req,res)=>{
    try{
        const {members} = req.body

        const memberPromises = members.map((member)=>{
            return Members.findById(member.participant)
        })

        const memberAccounts = await Promise.all(memberPromises)
        
        res.json(memberAccounts)
    }
    catch(error){
        console.log("Fatching the talkingroom's room member data is error due to :", error)
        res.status(500).json({error:'An error occurred with the server.'})
    }




}


exports.requestToTheRoom = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
    
    try{
        const {accountID,roomID} = req.body
        const isAlreadyRequested = await TalkingRooms.findOne({requests:accountID})

    if(!isAlreadyRequested){
    TalkingRooms.findByIdAndUpdate(roomID,{
        $push: {
            requests: [ accountID ]
        }
    },{
        new:true
    })
    .then((data)=>{
        res.json(data)
    })
    .catch((error)=>{
        console.log('The request to enter the room is error due to :', error)
        res.status(404).json({error:'No data was found'})
        statusDisplay = 404
        errorMessage = 'No data was found'
    })
    }else{
        console.log('The request to enter the room is error due to : You have previously submitted a room join request')
        res.status(400).json({error:'You have previously submitted a room join request'})
        statusDisplay = 404
        errorMessage = 'You have previously submitted a room join request'
    }
    }
    catch(error){
        console.log('The request to enter the room is error due to :', error)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
    }

}


exports.getRoomRequest = async (req,res)=>{   
try{
    const {accountID} = req.params

    const isAlreadyRequested = await TalkingRooms.findOne({requests:accountID})

    if(isAlreadyRequested){
        //You have already sent a room join request
        res.json(true)
    }
    else{
        //You have not sent a room join request
        res.json(false)
    }

}
catch{
        console.log('Fetching of talkingroom requests error due to :', error)
        res.status(500).json({error:'An error occurred with the server.'})
}

}


exports.deleteRoomRequest = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
        const {accountID,roomID} = req.body
        const isAlreadyRequested = await TalkingRooms.findOne({requests:accountID})

        if(isAlreadyRequested){
        TalkingRooms.findByIdAndUpdate(roomID,{
            $pull: {
                requests: accountID
            }
        },{
            new:true
        })
        .then((data)=>{
            res.json(data)
        })
        .catch((error)=>{
            console.log('Deleting a talkingroom request error due to :', error)
            res.status(404).json({error:'No data was found'})
            statusDisplay = 404
            errorMessage = 'No data was found'
        })
        }else{
            console.log('Deleting a talkingroom request error due to : You have not sent the room request yet')
            res.status(400).json({error:'You have not sent the room request yet'})
            statusDisplay = 400
            errorMessage = 'You have not sent the room request yet'
        }
        }
 catch(error){
        console.log('Deleting a talkingroom request error due to :', error)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}
    
}

exports.allRoomRequested = async (req,res)=>{
   try{
    const { adminID } = req.params;

    //หาห้องที่เป็น admin
    const data = await TalkingRooms.find({ 
        $or: [
            {"admins.participant": adminID},
            {"creator.participant": adminID}
        ]
    });

    //กรอกว่าห้องนั้นมี request เข้ามารึป่าว
    const dataRequested = data.filter(room => room.requests.length !== 0);

    //ถ้ามี request เข้ามา
    if (dataRequested.length > 0) {
        const dataRequestedandRequesterInfo = await Promise.all(dataRequested.map(async (dataRequestedRoom) => {
            //ทำการหา account ที่ส่ง request มาในแต่ละห้อง
            const requestsWithInfo = await Promise.all(dataRequestedRoom.requests.map(async (requesterID) => {
                try {
                    //ถ้าหาเจอ ทำการรวม Requester Info + Room Requested Info เข้าด้วยกันในรูปแบบ object
                    const requesterInfo = await Members.findById(requesterID).exec();
                    return { roomRequested: dataRequestedRoom, requesterInfo: requesterInfo };
                } catch (error) {
                    //ถ้าไม่เจอ จะส่งค่า null ออกไปแทน
                    console.log('Requesters fetching errors due to:', error);
                    return null;
                }
            }));

            //กรองเอาเฉพาะค่าที่ไม่ใช่ค่า null
            return requestsWithInfo.filter(info => info !== null);
        }));
        
        //Option: ใช้ flat เนื่องจากมีการซ้อนกันหลายชั้น เพื่อนทำให้มั้นใจว่าจะไม่มี nested Array เกิดขึ้น
        res.json(dataRequestedandRequesterInfo.flat());
    }
    //ถ้าไม่มี request เข้ามา
    else{
        res.json(null)
    }    
   }
   catch(error){
    console.log('Fetching all requests error due to :', error)
    res.status(500).json({error:'An error occurred with the server.'})
   }
}


exports.acceptRoomRequested = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const {roomRequestedID,requesterID} = req.body
    await TalkingRooms.findByIdAndUpdate(roomRequestedID,{
        $push:{participants:{participant:requesterID , status:'offline'}}
    },{
        new:true
    })
    .then(async()=>{
            await TalkingRooms.findByIdAndUpdate(roomRequestedID,{
                $pull:{requests:requesterID}
            },{
                new:true
            })
            .then((data)=>{
                res.json(data)
            })
            .catch((error)=>{
                console.log('The request acceptance to let him/her enter the Talkingroom error due to :', error)
                res.status(404).json({error:'No data was found'})
                statusDisplay = 404
                errorMessage = 'No data was found'
            }) 
    })
    .catch((error)=>{
        console.log('The request acceptance to let him/her enter the Talkingroom error due to :', error)
        res.status(404).json({error:'No data was found'})
        statusDisplay = 404
        errorMessage = 'No data was found'
    })
}
catch(error){
    console.log('The request acceptance to let him/her enter the Talkingroom error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}
}


exports.rejectRoomRequested = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const {roomRequestedID,requesterID} = req.body
    await TalkingRooms.findByIdAndUpdate(roomRequestedID,{
        $pull:{requests:requesterID}
    },{
        new:true
    })
    .then((data)=>{
        res.json(data)
    })
    .catch((error)=>{
        console.log('Rejecting of the request to enter the talkingroom error due to :', error)
        res.status(404).json({error:'No data was found'})
        statusDisplay = 404
        errorMessage = 'No data was found'
    }) 
}
catch(error){
    console.log('Rejecting of the request to enter the talkingroom error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}
}

exports.createChatroomInTalkingroom = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const {roomchatname , roomID} = req.body
    
    await TalkingRooms.findByIdAndUpdate(roomID , {
        $push:{chatChannels:{roomName:roomchatname}}
    },{
        new:true
    })
    .then((data)=>{
        res.json(data)
    })
    .catch((error)=>{
        console.log('Creating a chat channel error due to :', error)
        res.status(404).json({error:'No data of the Talkingroom was found'})
        statusDisplay = 404
        errorMessage = 'No data of the Talkingroom was found'
    }) 

}
catch(error){
    console.log('Creating a chat channel error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}

}

exports.createTalkingroomInTalkingroom = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
    try{
        const {roomtalkingname , roomID} = req.body
        
        await TalkingRooms.findByIdAndUpdate(roomID , {
            $push:{talkingChannels:{roomName:roomtalkingname}}
        },{
            new:true
        })
        .then((data)=>{
            res.json(data)
        })
        .catch((error)=>{
            console.log('Creating a talking channel in the Talkingroom error due to :', error)
            res.status(404).json({error:'No data of the Talkingroom was found'})
            statusDisplay = 404
            errorMessage = 'No data of the Talkingroom was found'
        }) 
    
    }
    catch(error){
        console.log('Creating a talking channel in the Talkingroom error due to :', error)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
    }
    
    }


exports.chatroomDataUpdated = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const {chatroom , nameInput} = req.body
   
    await TalkingRooms.findOneAndUpdate(
        {'chatChannels._id':chatroom._id},
        {$set : {'chatChannels.$.roomName' : nameInput}},
        { new : true}
        )
        .then((data)=>{
            res.json(data)
        })
        .catch((error)=>{
            console.log('Chat channel editing error due to :', error)
            res.status(404).json({error:'No data of the chat channel was found'})
            statusDisplay = 404
            errorMessage = 'No data of the chat channel was found'
        })
}
catch(error){
    console.log('Chat channel editing error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}
    
}


exports.chatroomDataDeleted = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const {chatroom , roomData} = req.body

    if(roomData.chatChannels.length > 1){
    await TalkingRooms.findOne({'chatChannels._id':chatroom._id})
    .then((roomData)=>{
        const targetedChatChannel = roomData.chatChannels.filter((chatChannel) => 
        {  
            return (chatChannel._id).toString() === (chatroom._id).toString()      
        });
        if(targetedChatChannel && targetedChatChannel.length > 0){
            const messageHavingImages = targetedChatChannel[0].messages.filter(message => message.images || message.images.length > 0);
            const images = messageHavingImages.map(message => message.images);
            const flattenedImages = images.flat();
            flattenedImages.forEach((image)=>{
                cloudinary.uploader.destroy(image.public_id)
            })
        }
       
    })
    
    await TalkingRooms.findOneAndUpdate(
    {'chatChannels._id':chatroom._id},
    {$pull: {chatChannels :{_id : chatroom._id}}},
    {new : true}
    )
    .then((data)=>{
        res.json(data)
    })
    .catch((error)=>{
        errorMessage = 'No data of the chat channel was found'
        statusDisplay = 404
        console.log('Deleting chat channel error due to :', error)
        res.status(404).json({error:'No data of the chat channel was found'})
    })
    }else{
        errorMessage = 'It cannot be deleted because there is only 1 chat channel left.'
        statusDisplay = 400
        console.log('Deleting chat channel error due to : It cannot be deleted because there is only 1 chat channel left.')
        res.status(400).json({error:'It cannot be deleted because there is only 1 chat channel left.'})
    }
}
catch(error){
    console.log('Deleting chat channel error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}
}

exports.changeRoomInfo = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const {roomName , roomDescription , roomID} = req.body
    let public_id = ''
    let prevRoomIcon = req.body.prevRoomIcon;
    let roomIcon = req.body.roomIcon;
    console.log(prevRoomIcon);
    console.log(roomIcon);
      //Upload image to cloud storage
      if(roomIcon && roomIcon.length > 100){
        await cloudinary.v2.uploader.upload(roomIcon,
            { public_id:`${uuidv4()}-${Date.now()}`,
              folder:'talkstogo/room-images/room-icons'
            })
            .then((result)=>{
            // Delete the previous image
            if(req.body.prevRoomIcon){
            cloudinary.uploader.destroy(prevRoomIcon.public_id)
             }

                roomIcon=result
                public_id=result.public_id
            })
            .catch((err)=>{
                res.status(404).json({error:"Uploading failed, please try again."})
                console.log(err)
            })
    }

    await TalkingRooms.findByIdAndUpdate(
        roomID,
        {$set : {'roomName' : roomName, 'roomDescription' : roomDescription, 'roomIcon' : roomIcon}},
        { new : true}
        )
        .then((data)=>{
            res.json(data)
        })
        .catch((error)=>{
            console.log('Editing talkingroom error due to :', error)
            res.status(404).json({error:'No data of the talkingroom was found'})
            statusDisplay = 404
            errorMessage = 'No data of the talkingroom was found'

            // Delete the image
        if(req.body.roomIcon){
            cloudinary.uploader.destroy(public_id)
            .then((result)=>console.log('Image deleted successfully :', result))
            .catch((error)=> console.error('Image deleted unsuccessfully :', error))
           }
        })
}
catch(error){
    console.log('Editing talkingroom error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})

       // Delete the image
       if(req.body.roomIcon){
        cloudinary.uploader.destroy(public_id)
        .then((result)=>console.log('Image deleted successfully :', result))
        .catch((error)=> console.error('Image deleted unsuccessfully :', error))
       }
}

}

//Remove a normal member out of the room
exports.getOutOfTheRoom = async (req,res) => {
    let statusDisplay = ''
    let errorMessage = ''
try{
    const {userID , roomID} = req.body
    await TalkingRooms.findByIdAndUpdate(
        roomID, 
        {$pull: {"participants" : {participant:userID}}},
        {new : true}
        )
        .then((data)=>{
            res.json({roomData:data , participantSelected:userID})
        })
        .catch((error)=>{
            console.log('Removing general member error due to :', error)
            res.status(404).json({error:'No data of the general member was found'})
            statusDisplay = 404
            errorMessage = 'No data of the general member was found'
        })
}
catch(error){
    console.log('Removing general member error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}

}

//Remove an admin member out of the room
exports.getOutOfTheRoomAdmin = async (req,res) => {
    let statusDisplay = ''
    let errorMessage = ''
    try{
        const {userID , roomID} = req.body
        await TalkingRooms.findByIdAndUpdate(
            roomID, 
            {$pull: {"admins" : {participant:userID}}},
            {new : true}
            )
            .then((data)=>{
                res.json({roomData:data , participantSelected:userID})
            })
            .catch((error)=>{
                console.log('Removing admin member error due to :', error)
                res.status(404).json({error:'No data of admin was found'})
                statusDisplay = 404
                errorMessage = 'No data of admin was found'
            })
    }
    catch(error){
        console.log('Removing admin member error due to :', error)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
    }
    
    }

exports.roomDeleting = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const {roomID , roomIcon , allImagesID} = req.body;
    console.log(allImagesID);

    await TalkingRooms.findByIdAndDelete(roomID)
    .then((data)=>{
        //Delete room icon
        if(roomIcon){
            cloudinary.uploader.destroy(roomIcon.public_id)
        }

        if(allImagesID){
            allImagesID.forEach((public_id)=>{
                cloudinary.uploader.destroy(public_id)
            })
        }

        res.json(data)
    })
    .catch((error)=>{
        console.log('Deleting Talkingroom error due to :', error)
        res.status(404).json({error:'No data of the Talkingroom was found'})
        statusDisplay = 404
        errorMessage = 'No data of the Talkingroom was found'
    })
}
catch(error){
    console.log('Deleting Talkingroom error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}
}

exports.levelUpToAdmin = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const {userID , roomID} = req.body
    if(userID && roomID){
    const OutOfParticiapnts = await TalkingRooms.findByIdAndUpdate(
        roomID, 
        {$pull: {"participants" : {participant:userID}}},
        {new : true}
        ).exec()

    if(OutOfParticiapnts){
    await TalkingRooms.findByIdAndUpdate(
        roomID, 
        {$push: {"admins" : {participant:userID}}},
        {new : true}
        )
        .then((data)=>{
            res.json(data)
        })
        .catch(()=>{
            statusDisplay = 404
            errorMessage = 'No data was found'
            res.status(404).json({error:'No data was found'})
        })
    }else{
        statusDisplay = 404
        errorMessage = 'This member is not a general member'
        res.status(404).json({error:'This member is not a general member'})
    }
    }else{
        statusDisplay = 400
        errorMessage = 'Please select a general member to be promoted'
        res.status(400).json({error:'Please select a general member to be promoted'})
    }
}
catch(error){
    console.log('Promoting to be admin member error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}
        
}


exports.levelDownToParticipant = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const {userID , roomID} = req.body
    if(userID && roomID){
    const OutOfParticiapnts = await TalkingRooms.findByIdAndUpdate(
        roomID, 
        {$pull: {"admins" : {participant:userID}}},
        {new : true}
        ).exec()

    if(OutOfParticiapnts){
    await TalkingRooms.findByIdAndUpdate(
        roomID, 
        {$push: {"participants" : {participant:userID}}},
        {new : true}
        )
        .then((data)=>{
            res.json(data)
        })
        .catch(()=>{
            statusDisplay = 404
            errorMessage = 'No data was found'
            res.status(404).json({error:'No data was found'})
        })
    }else{
        statusDisplay = 404
        errorMessage = 'This member is not a general member'
        res.status(404).json({error:'This member is not a general member'})
    }
    }else{
        statusDisplay = 400
        errorMessage = 'Please select an admin member to be demoted'
        res.status(400).json({error:'Please select an admin member to be demoted'})
    }
}
catch(error){
    console.log('Demoting to be a general member error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}
}


exports.messagesFromChatroomInRoom = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const {chatroomID , senderData , content} = req.body
    let images = req.body.images
    let video = req.body.video
    let file = req.body.file

        if(!video){
            video = null;
        }

        if(!file){
            file = null;
        }
 
         //Upload image to cloud storage
         if(images && images.length > 0){

            images = await Promise.all(images.map(async (image)=>{
                const result = await cloudinary.v2.uploader.upload(image, { 
                    public_id:`${uuidv4()}-${Date.now()}`,
                    folder:'talkstogo/room-images/chat-channel-images'
                });
                return { image: result, public_id: result.public_id };
            }))
            .catch(error =>{
                console.log('Uploading failed due to :', error)
                res.status(500).json({error:error})
            })
        }

        TalkingRooms.findOneAndUpdate(
            {'chatChannels._id' : chatroomID},
            { $push : {"chatChannels.$.messages" : {senderData , content , images , video, file}}},
            { new : true}
        )
        .then((data)=>{
            res.json(data)
        })
        .catch((error)=>{
            console.log(`Sending messages in chat channel error due to :`, error)
            res.status(404).json({error:'No chat channel was found'})
            statusDisplay = 404
            errorMessage = 'No chat channel was found'

            // Delete the image
            if(images.length > 0){
            images.map((image)=>{
                cloudinary.uploader.destroy(image.public_id)
                .then((result)=>console.log('Image deleted successfully :', result))
                .catch((error)=> console.error('Image deleted unsuccessfully :', error))
            })
            }
        })
}
catch(error){
    console.log(`Sending messages in chat channel error due to :`, error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})

    // Delete the image
    if(images.length > 0){
        images.map((image)=>{
            cloudinary.uploader.destroy(image.public_id)
            .then((result)=>console.log('Image deleted successfully :', result))
            .catch((error)=> console.error('Image deleted unsuccessfully :', error))
        })
    }
}

 
}


exports.memberGetInTalkingroom = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const {talkingroomID , userData} = req.body

    //If you have already joined the talking channel
    //The system will leave you out of the channel and then get in the new room
    //And after that , you will get in the new room
    await TalkingRooms.findOneAndUpdate(
        {'talkingChannels.participants._id': userData._id},
        {$pull : {'talkingChannels.$.participants': { _id: userData._id }}},
        { new : true})
        .then(async()=>{
            //เข้าร่วมใหม่อีกรอบ
            await TalkingRooms.findOneAndUpdate(
                {'talkingChannels._id' : talkingroomID},
                { $push : {"talkingChannels.$.participants" : userData}},
                { new : true}
            )
            .then((data)=>{
                res.json(data)
             })
            .catch((error)=>{
                console.log(`Getting in the talking channel error due to :`, error)
                res.status(404).json({error:'No targeted talking channel was found'})
                statusDisplay = 404
                errorMessage = 'No targeted talking channel was found'
                
             })
        })
        .catch((error)=>{
            console.log(`Leaving out of the talking channel error due to :`, error)
            res.status(404).json({error:'Not found you in any channels'})
            statusDisplay = 404
            errorMessage = 'Not found you in any channels'
        })

}
catch(error){
    console.log(`Getting in the talking channel error due to :`, error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}
}


//When a user leaves the room, they automatically exit the chat box that is still there.
exports.memberGetOutOfTalkingroom = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const { userData }= req.body

    //Check if the member is already in any talking channels
    const isParticipantAlready = await TalkingRooms.findOne({
        'talkingChannels.participants._id': userData._id
    })
    //if already in a talking channel
    if(isParticipantAlready){
       await TalkingRooms.findOneAndUpdate(
        { 'talkingChannels.participants._id': userData._id },
        { $pull: { 'talkingChannels.$.participants': { _id: userData._id } } },
        { new: true }
       )
            .then((data)=>{
                res.json(data)
            })
            .catch((error)=>{
                console.log(`Leaving out of the talking channel error due to :`, error)
                res.status(404).json({error:'No member data was found in any channels'})
                statusDisplay = 404
                errorMessage = 'No member data was found in any channels'
            })
    }
}
catch (error) {
    console.log(`Leaving out of the talking channel error due to :`, error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}
}

exports.onlineToTheRoomAdmin = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
    try{
        const {roomID , userID} = req.body
                await TalkingRooms.findByIdAndUpdate(
                    roomID, 
                    {$set: {"admins.$[elem].status" : 'online' , 
                            "admins.$[elem].timestamp": Date.now()
                           }
                    },
                    {
                        arrayFilters: [{ "elem.participant": userID }],
                        new : true
                    }
                    )
                    .then((data)=>{
                        res.json(data)
                    })
                    .catch((error)=>{
                        console.log(`Changing status to online error due to :`, error)
                        res.status(404).json({error:'Not found the member in The talkingroom'})
                        statusDisplay = 404
                        errorMessage = 'Not found the member in The talkingroom'
                    })
    }
    catch(error){
        console.log(`Changing status to online error due to :`, error)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
    }
}


exports.onlineToTheRoomParticipant = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const {roomID , userID} = req.body
            await TalkingRooms.findByIdAndUpdate(
                roomID, 
                {$set: {"participants.$[elem].status" : 'online',
                        "participants.$[elem].timestamp": Date.now()
                        }
                },
                {
                    arrayFilters: [{ "elem.participant": userID }],
                    new : true
                }
                )
                .then((data)=>{
                    res.json(data)
                })
                .catch((error)=>{
                    console.log(`Changing status to online error due to :`, error)
                    res.status(404).json({error:'Not found the member in The talkingroom'})
                    statusDisplay = 404
                    errorMessage = 'Not found the member in The talkingroom'
                })
}
catch(error){
    console.log(`Changing status to online error due to :`, error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}
}

exports.onlineToTheRoomCreator = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
    try{
        const {roomID , userID} = req.body
                await TalkingRooms.findByIdAndUpdate(
                    roomID, 
                    {$set: {"creator.$[elem].status" : 'online',
                            "creator.$[elem].timestamp": Date.now()
                           }
                    },
                    {
                        arrayFilters: [{ "elem.participant": userID }],
                        new : true
                    }
                    )
                    .then((data)=>{
                        res.json(data)
                    })
                    .catch((error)=>{
                        console.log(`Changing status to online error due to :`, error)
                        res.status(404).json({error:'Not found the member in The talkingroom'})
                        statusDisplay = 404
                        errorMessage = 'Not found the member in The talkingroom'
                    })
    }
    catch(error){
        console.log(`Changing status to online error due to :`, error)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
    }
    }

exports.offlineFromTheRoomAdmin = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
    try{
        const {roomID , userID} = req.body
                await TalkingRooms.findByIdAndUpdate(
                    roomID, 
                    {$set: {"admins.$[elem].status" : 'offline',
                            "admins.$[elem].timestamp": Date.now()
                            }
                    },
                    {
                        arrayFilters: [{ "elem.participant": userID }],
                        new : true
                    }
                    )
                    .then((data)=>{
                        res.json(data)
                    })
                    .catch((error)=>{
                        console.log(`Changing status to offline error due to :`, error)
                        res.status(404).json({error:'Not found the member in The talkingroom'})
                        statusDisplay = 404
                        errorMessage = 'Not found the member in The talkingroom'
                    })
    }
    catch(error){
        console.log(`Changing status to offline error due to :`, error)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
    }
}

exports.offlineFromTheRoomParticipant = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
    try{
        const {roomID , userID} = req.body
                await TalkingRooms.findByIdAndUpdate(
                    roomID, 
                    {$set: {"participants.$[elem].status" : 'offline',
                            "participants.$[elem].timestamp": Date.now()
                            }
                    },
                    {
                        arrayFilters: [{ "elem.participant": userID }],
                        new : true
                    }
                    )
                    .then((data)=>{
                        res.json(data)
                    })
                    .catch((error)=>{
                        console.log(`Changing status to offline error due to :`, error)
                        res.status(404).json({error:'Not found the member in The talkingroom'})
                        statusDisplay = 404
                        errorMessage = 'Not found the member in The talkingroom'
                    })
    }
    catch(error){
        console.log(`Changing status to offline error due to :`, error)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
    }
}


exports.offlineFromTheRoomCreator = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
    try{
        const {roomID , userID} = req.body
                await TalkingRooms.findByIdAndUpdate(
                    roomID, 
                    {$set: {"creator.$[elem].status" : 'offline',
                            "creator.$[elem].timestamp": Date.now()
                            }
                    },
                    {
                        arrayFilters: [{ "elem.participant": userID }],
                        new : true
                    }
                    )
                    .then((data)=>{
                        res.json(data)
                    })
                    .catch((error)=>{
                        console.log(`Changing status to offline error due to :`, error)
                        res.status(404).json({error:'Not found the member in The talkingroom'})
                        statusDisplay = 404
                        errorMessage = 'Not found the member in The talkingroom'
                    })
    }
    catch(error){
        console.log(`Changing status to offline error due to :`, error)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
    }
}


exports.talkingChannelDataUpdated = async (req,res) =>{
    let errorMessage = ''
    let statusDisplay = ''
try{
    const {talkingChannelID , talkingChannelName } = req.body
    if(talkingChannelName !== ''){
    await TalkingRooms.findOneAndUpdate(
        {'talkingChannels._id':talkingChannelID},
        {$set : {'talkingChannels.$.roomName' : talkingChannelName}},
        { new : true}
        )
        .then((data)=>{
            res.json(data)
        })
        .catch((error)=>{
            statusDisplay = 404
            errorMessage = 'No data was found'
            console.log('Editing talking channel error due to :', error)
            res.status(404).json({error:'No data was found'})
        })
    }else{
        statusDisplay = 400
        errorMessage = 'Please write a channel name before editing'
        console.log('Editing talking channel error due to : Please write a channel name before editing')
        res.status(400).json({error:'Please write a channel name before editing'})
    }
}
catch(error){
    console.log('Editing talking channel error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}

}



exports.talkingChannelDataDeleted = async (req,res)=>{
    let errorMessage = ''
    let statusDisplay = ''
    try{
        const {talkingChannelID , roomData} = req.body

        if(roomData.talkingChannels.length > 1){
        await TalkingRooms.findOneAndUpdate(
        {'talkingChannels._id':talkingChannelID},
        {$pull: {talkingChannels :{_id : talkingChannelID}}},
        {new : true}
        )
        .then((data)=>{
            res.json(data)
        })
        .catch((error)=>{
            errorMessage = 'No data was found'
            statusDisplay = 404
            console.log('Deleting talking channel error due to :', error)
            res.status(404).json({error:'No data was found'})
        })
        }else{
            errorMessage = 'It cannot be deleted because there is only 1 talking channel left'
            statusDisplay = 400
            console.log('Deleting talking channel error due to : It cannot be deleted because there is only 1 talking channel left')
            res.status(400).json({error:'It cannot be deleted because there is only 1 talking channel left'})
        }
    }
    catch(error){
        console.log('Deleting talking channel error due to :', error)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
    }
    }