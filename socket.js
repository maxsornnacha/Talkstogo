const  express = require('express')
const app = express()
const {createServer} = require('http')

require('dotenv').config()
//import socket.io
//Doc here https://socket.io/docs/v4/server-initialization/
const {Server} = require('socket.io')
const httpServer  = createServer(app)
//Config socket to cross and connect with front-end client
const io = new Server(httpServer,{
      origin: [process.env.CLIENT_URL, process.env.CLIENT_URL_1],
      methods: ['GET', 'POST'],
      credentials: true,
});


//Socket connection
io.on('connection', (socket) => {

    //Creating post realtime
    socket.on('create-post',({post})=>{
        io.emit('create-post',{post})
    });

    //Deleting post realtime
    socket.on('delete-post',({postID})=>{
      io.emit('delete-post',{postID})
    });

    //Editing post realtime
    socket.on('edited-post',({post})=>{
      io.emit('edited-post',{post})
    });
 
    //Like updating realtime
    socket.on('like-update',({post , senderID})=>{
      io.emit('like-update',{post , senderID})
    });

    //Uploading Comment realtime
    socket.on('commentData',({commentData,postID})=>{
      io.emit('commentData',{commentData,postID})
 });

  //Uploading Reply realtime
  socket.on('replyData',({postUpdated})=>{
    io.emit('replyData',{postUpdated})
});

  //FriendShip request realtime
  socket.on('requestFriendship',async ({roomIDGet,requester,recipient,status})=>{
    io.emit('requestFriendship',{roomIDGet,requester,recipient,status})
  });

  //FriendShip accept realtime
  socket.on('friendRequestList',({data,getterID})=>{
    io.emit('friendRequestList',{data,getterID})
  });

    // Function to create a consistent room ID
    function createRoomID(userID1, userID2) {
      const sortedIDs = [userID1, userID2].sort();
      return `${sortedIDs[0]}-${sortedIDs[1]}`;
       }

  //Starting to create a room for sender and recipient by sorting data for making chat room
  socket.on('joinRoom',async ({senderID, getterID}) =>{
    const roomID = createRoomID(senderID, getterID);
    await socket.join(roomID);
    socket.emit('joinRoom',{roomID})
  });


  //Sending message for specific 2 people realtime
  socket.on('sendMsg', ({ roomIDGet, message }) => {
    io.to(roomIDGet).emit('message',{roomIDGet,message});
  });

  //Updating chat for reading message realtime  read/unread
  socket.on('updateMsg',({roomIDGet,messagesAll})=>{
    io.to(roomIDGet).emit('updateMsg',{messagesAll})
  });

  //Updating request for joining a talkingroom realtime (requester side)
    socket.on('roomRequest-requester-side',({id, requestStatus})=>{
      io.emit('roomRequest-requester-side',{id,requestStatus})
    });

   //Updating request for joining a talkingroom realtime (admin side)
   socket.on('roomRequest-admin-side',({admins})=>{
    io.emit('roomRequest-admin-side',{admins})
  });

  //Updating request for joining a talkingroom realtime (creator side)
  socket.on('roomRequest-creator-side',({creator})=>{
    io.emit('roomRequest-creator-side',{creator})
  });

    //Updating request for joining a talkingroom realtime both sides
   socket.on('roomRequest-from-admin-requester-side',({id, requestStatus})=>{
    io.emit('roomRequest-from-admin-requester-side',{id,requestStatus})
  });


  //Talkingroom updating when having new member joining
  socket.on('room-update-after-accepted',({roomID, roomData})=>{
    io.emit('room-update-after-accepted',{roomID,roomData})
  });

  //Updating for sending messages realtime
    socket.on('allMessages',({data , userID , newUnreadMessages})=>{
      io.emit('allMessages',{data,userID,newUnreadMessages})
    });
  
  //updating when there are something changed in chat channels and talking channels like message sending , or channel creation
  socket.on('new-talkingroom-or-chatroom-created',({roomUpdated})=>{
    io.emit('new-talkingroom-or-chatroom-created',{roomUpdated})
  });

    //Updating when ender to a talking channel realtime
    socket.on('enter-to-the-room',({roomUpdated , senderID})=>{
      io.emit('enter-to-the-room',{roomUpdated , senderID})
    });

   //Updating when leave from a talking channel realtime
   socket.on('leave-out-of-the-roomChannel',({roomUpdated , senderID})=>{
    io.emit('leave-out-of-the-roomChannel',{roomUpdated , senderID})
  });

  //Updating when being in a talking channel and change to a new one without leaving realtime
  socket.on('leave-out-of-the-roomChannel-to-enter-the-new-channel',({roomUpdated, channelUpdated , senderID})=>{
    io.emit('leave-out-of-the-roomChannel-to-enter-the-new-channel',{roomUpdated, channelUpdated , senderID})
  });

  //Updating when a member got removed from the talkingroom (member updated)
  socket.on('selected-participant-deleting',({participantSelected})=>{
    io.emit('selected-participant-deleting',{participantSelected})
  });

  //Updating Room On Main for the member that got removed out of the talkingroom by deleting the room in Room On Main also
  socket.on('room-deleted-on-roomOnMain-for-userKickedOut',({roomDeleted , userKickedOut})=>{
    io.emit('room-deleted-on-roomOnMain-for-userKickedOut',{roomDeleted , userKickedOut})
  });

  //Updating Room On Main when a room was removed from the system
  socket.on('room-deleting',({roomDeleted})=>{
    io.emit('room-deleting',{roomDeleted})
  });

  //จะทำการเพิ่มห้องพูดคุยให้ทั้งใน room on main และ slug talkingroom ของ requester
  socket.on('room-update-after-accepted-from-requester-side',({ requesterID, roomData })=>{
    io.emit('room-update-after-accepted-from-requester-side',{ requesterID, roomData })
  });


  //Handle all audio calling process of WebRTC server
  //*****
  //******** 
  //*********** 
  //>>>>>>>>>>>>>


  //These ons were used in Testing only | used for 2 people calling or phone calling test
  //Sending SDP offer with Ice candidates from an initiator to all non initiators or recipient
  socket.on('initiator-offer',({signal, from, room})=>{
      io.emit('receive-initiator-offer',{signal, from , room})
  });

  //Sending SDP answer with Ice candidates from a non initiator to an initiator or starter
  socket.on('receiver-answer',({signal, from , room})=>{
      io.emit('accept-answer-from-receiver',{signal, from , room})
  });

  //Ending call 
  socket.on('end-call',({me})=>{
      io.emit('end-call',{me})
  });

  //******** 
  //*********** 
  //>>>>>>>>>>>>>
  //These ons were used in the Talkingroom coding to handle realtime group communication
  //Talking channel updating when it's about audio call group processing
  socket.on('roomAmIInUpdated', ({roomUpdated , data})=>{
     io.emit('roomAmIInUpdated',{roomUpdated , data})
  });

  //Sending SDP offer with Ice candidates from an initiator to all non initiators or recipient
  socket.on('offer-got-send',({offers , NO , roomEntering , roomUpdated}) =>{
    io.emit('nonInitpeer-get-offer-create-answer',{offers , NO , roomEntering , roomUpdated})
  });

  //If offer not sent
  socket.on('offer-not-got-send',({roomUpdated , senderID}) =>{
    io.emit('offer-not-got-send',{roomUpdated , senderID})
  })

  //Sending SDP answer with Ice candidates from a non initiator to an initiator or starter
  socket.on('answer-got-send', ({initNO , answer, from, userNO,  to, roomEntering , roomUpdated})=>{
    io.emit('initpeer-accept-answer',{initNO , answer, from, userNO,  to, roomEntering , roomUpdated})
 });

 socket.on('non-init-peer-stream-to-init',({initNO , senderID, to})=>{
    io.emit('non-init-peer-stream-to-init',{initNO , senderID, to})
 })

 //Optional: in case there is voice detection to know when if users are speaking
 socket.on('voice-detected', ({userNO , room})=>{
  io.emit('voice-detected',{userNO , room})
});

//Optional: in case there is voice detection to know when if users are not speaking
socket.on('no-voice-detected', ({userNO , room})=>{
  io.emit('no-voice-detected',{userNO , room})
});


//Updating when user is online or offline
socket.on('room-status-update-after-online-offline',({roomID, roomData})=>{
    io.emit('room-status-update-after-online-offline',{roomID, roomData})
});

//Disconnect from the peers that were signaled or connected
socket.on('init-non-init-peers-connected-to-me-disconnect',({senderID , channelID , senderNO}) =>{
  io.emit('init-non-init-peers-connected-to-me-disconnect',{senderID  ,channelID , senderNO})
});


//Notify Navbar
socket.on('notify-navbar',({getterID , type})=>{
  io.emit('notify-navbar',{getterID , type})
})

});

const PORT = process.env.PORT || 8080;

httpServer.listen(PORT,()=>{
    console.log(`port of socket running on ${PORT}`);
    console.log(`Client url : ${process.env.CLIENT_URL}`);
    console.log(`Client url 1 : ${process.env.CLIENT_URL_1}`);
});

