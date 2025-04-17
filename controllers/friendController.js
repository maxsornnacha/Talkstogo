const Members = require('../models/registration')
const FriendShips = require('../models/friendship')
const mongoose = require('mongoose')

exports.makingRequest = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const {senderID , getterID} = req.body

    const sender = await Members.findById(senderID)
    const getter = await Members.findById(getterID)

   if(!sender || !getter){
    //Not found request sender and receiver
   }else{
    //found both of them , let's continue
    //Next , check if the request was made already?
    const existingFriendship = await FriendShips.findOne({
        $or:[
            {requester:senderID , recipient:getterID},
            {requester:getterID , recipient:senderID}
        ]
    })
    // Check if both are already being friends ?
    if(existingFriendship){
        res.json({
            requester:existingFriendship.requester,
            recipient:existingFriendship.recipient,
            status:existingFriendship.status
        })
    }else{
        const newFriendship = new FriendShips({
            requester:senderID,
            recipient:getterID,
            status:'pending'
        })

        await newFriendship.save()
        .then(()=>{
            res.json({ requester:senderID,recipient:getterID,status:'pending'})
        })
        .catch((error)=>{
            console.log('Error sending friend request due to :', error)
            res.status(400).json({error:'The request was unsuccessful because the conditions were not met'})
            statusDisplay = 400
            errorMessage = 'The request was unsuccessful because the conditions were not met'
        })
    }

   }

}catch{
    console.log('Error sending friend request due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}
  
}


exports.requestCheck = async (req,res)=>{
try{
    const {senderID , getterID} = req.body

     //Check if both of them have the request already or being friends?
     const existingFriendship = await FriendShips.findOne({
        $or:[
            {requester:senderID , recipient:getterID},
            {requester:getterID , recipient:senderID}
        ]
    })

    if(!existingFriendship){
        //Not found their request
        res.json({
            requester:null,
            recipient:null,
            status:null
        })
    }else{
        //There is already the request
        res.json({
            requester:existingFriendship.requester,
            recipient:existingFriendship.recipient,
            status:existingFriendship.status
        })
    }

}catch{
    //Not found their request
    res.json({
        requester:null,
        recipient:null,
        status:null
    })
}
}




exports.removeRequest = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''

    try{
    const {senderID , getterID} = req.body

     await FriendShips.findOneAndDelete({
        $or:[
            {requester:senderID , recipient:getterID},
            {requester:getterID , recipient:senderID}
        ]
    })
    .then((data)=>{
        res.json({
            requester:null,
            recipient:null,
            status:null
        })
    })
    .catch((error)=>{
        console.log('Deletion of the request is erroneous due to :', error)
        res.status(404).json({error:'No data was found'})
        statusDisplay = 404
        errorMessage = 'No data was found'
    })

    }
    catch(error){
        console.log('Deletion of the request is erroneous due to :', error)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
    }

}


exports.acceptRequest = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
    try{
    const {senderID , getterID} = req.body
    console.log('senderID',senderID)
    console.log('getterID',getterID)

    await FriendShips.findOneAndUpdate({
        $or:[
            {requester:senderID , recipient:getterID},
            {requester:getterID , recipient:senderID}
        ]
    },{$set:{
       status:'accepted'
    }})
    .then((data)=>{
        res.json({ requester:getterID,recipient:senderID,status:'accepted'})
    })
    .catch((error)=>{
        console.log('The acceptance request is erroneous due to :', error)
        res.status(404).json({error:'No data was found'})
        statusDisplay = 404
        errorMessage = 'No data was found'
    })

    }
    catch(error){
        console.log('The acceptance request is erroneous due to :', error)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
    }
}


exports.fetchFriendRequest = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
    try{
    const {accountID} = req.params

        const data = await FriendShips.find({
            recipient:accountID , status:"pending"
        }).exec()
        
        const requesterArray = data.map(friendship=>{
         return friendship.requester
        })

        Members.find({_id:{$in:requesterArray}}).exec()
        .then((data)=>{
            res.json({data:data,getterID:accountID});
        })
        .catch((error)=>{
            console.log('All-requests fetching is error due to :', error)
            res.status(404).json({error:'No data was found'})
            statusDisplay = 404
            errorMessage = 'No data was found'
        })

    }
    catch(error){
        console.log('All-requests fetching is error due to :', error)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
    }


}

exports.fetchFriendlist = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
    try{
    
    const {accountID} = req.params

    const data = await FriendShips.find({
        $or:[
            {requester:accountID , status:"accepted"},
            {recipient:accountID , status:"accepted"}
        ]
    }).exec()
   
    const FriendShipsArray = data.map((friendshipData)=>{   
        const id = new mongoose.Types.ObjectId(`${accountID}`);
        if(!friendshipData.requester.equals(id)){
            return friendshipData.requester
        }else if(!friendshipData.recipient.equals(id)){
            return friendshipData.recipient
        }
    })

    Members.find({_id:{$in:FriendShipsArray}}).exec()
    .then((data)=>{
        res.json(data);
    })
    .catch((error)=>{
        console.log('Fetching the accounts who are being my friends is error due to :', error)
        res.status(404).json({error:'No data was found'})
        statusDisplay = 404
        errorMessage = 'No data was found'
    })

    }
    catch(error){
        console.log('Fetching the accounts who are being my friends is error due to :', error)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
    }
   
}