import axios from "axios"
import { useEffect,useState } from "react"
import Swal from "sweetalert2"
import { io } from "socket.io-client"
const socket = io(process.env.API_SOCKET_URL)
import { createRoomID } from "@/modules/modules"

export default function AddFriends({accountData,senderID,getterID,handleChatroomToggle,index,userData}){
    const [requester,setRequester ] = useState(null)
    const [recipient,setRecipient] = useState(null)
    const [status,setStatus] = useState(null)
    const [addFriendLoading, setAddFriendLoading] = useState(true)
     // สร่าง roomID
     const roomID = createRoomID(senderID, getterID);

    useEffect(()=>{
        socket.on('requestFriendship', ({roomIDGet,requester,recipient,status}) => {
            if(roomID === roomIDGet){
            setRequester(requester);
            setRecipient(recipient);
            setStatus(status);
            }
         })
    },[])
  
    //ส่งตำขอเป็นเพื่อน
    const handleSendingRequest= async (event)=>{
        event.preventDefault()

       await axios.post(`${process.env.API_URL}/making-request`,{
            senderID,getterID
        },{
            headers:{
                Authorization: `Bearer ${userData.token_key}`
            }
        })
        .then((response)=>{
            socket.emit('requestFriendship',{
                requester:senderID,
                recipient:getterID,
                status:response.data.status,
                roomIDGet:roomID
            })
            socket.emit('notify-navbar',{getterID:getterID , type:'friend-request'})
      
            //ทำการอัพเดตไปที่ จำนวนการส่งคำขอ ณ Navbar Other
             axios.get(`${process.env.API_URL}/all-friendRequest/${accountData._id}`,{
                headers:{
                    Authorization: `Bearer ${userData.token_key}`
                  }
             })
             .then((response)=>{
                  socket.emit('friendRequestList',{data:response.data.data,getterID:response.data.getterID})
             })
             .catch((error)=>{
                 console.log(error)
             })


        })
        .catch((error)=>{
            console.log(error)
        })
    }

    //ลบคำขอเป็นเพื่อน
    const handleRemoveRequest = async (event)=>{
        event.preventDefault()
        await axios.delete(`${process.env.API_URL}/remove-request`,{
            data:{senderID,getterID},
            headers:{
                Authorization: `Bearer ${userData.token_key}`
              }
        })
        .then((response)=>{
            
            socket.emit('requestFriendship',{
                requester:senderID,
                recipient:getterID,
                status:null,
                roomIDGet:roomID
            })
  
            //ทำการอัพเดตไปที่ จำนวนการส่งคำขอ ณ Navbar Other
            axios.get(`${process.env.API_URL}/all-friendRequest/${accountData._id}`,{
                headers:{
                    Authorization: `Bearer ${userData.token_key}`
                  }
            })
                .then((response)=>{
                      socket.emit('friendRequestList',{data:response.data.data,getterID:response.data.getterID})
                 })
                 .catch((error)=>{
                     console.log(error)
                 })
       

        })
        .catch((error)=>{
            console.log(error)
        })

    }

    //ยอมรับเป็นเพื่อน
    const handleAcceptRequest= async (event)=>{
        event.preventDefault()
         //เปลี่ยนสถานะเป็นเพื่อนใน DฺB
        await axios.put(`${process.env.API_URL}/accept-request`,{
            senderID,getterID
        },{
            headers:{
                Authorization: `Bearer ${userData.token_key}`
              }
        })
        .then(async (response)=>{
            await socket.emit('requestFriendship',{
                requester:senderID,
                recipient:getterID,
                status:response.data.status,
                roomIDGet:roomID
            })

            //ทำการอัพเดตไปที่ จำนวนการส่งคำขอ ณ Navbar Other
            await axios.get(`${process.env.API_URL}/all-friendRequest/${accountData._id}`,{
                headers:{
                    Authorization: `Bearer ${userData.token_key}`
                }
            })
             .then((response)=>{
                  socket.emit('friendRequestList',{data:response.data.data,getterID:response.data.getterID})
             })
             .catch((error)=>{
                 console.log(error)
             })

            //สร้างห้องสนทนาระหว่างเพื่อน กับเรา หลังจากเป็นเพื่อนแล้ว
             axios.post(`${process.env.API_URL}/create-chatmessege-room`,{
                    senderID,getterID
             },{
                headers:{
                    Authorization: `Bearer ${userData.token_key}`
                  }
             })
            .then((data)=>{
                console.log(data);
            })
            .catch((error)=>{
                console.log(error);
            })
        })
        .catch((error)=>{
            console.log(error)
        })

    }

    //ลบสถานะการเป็นเพื่อนออก
    const handleRemoveFriendship= (event)=>{
        event.preventDefault()
        Swal.fire({
            icon:'warning',
            text:`Are you sure you want to unfriend ?`,
            confirmButtonText:'Yest, I am sure !',
            showCancelButton:true
        }).then(async (status)=>{
            if(status.isConfirmed){
                await axios.delete(`${process.env.API_URL}/remove-request`,{
                    data:{senderID,getterID},
                    headers:{
                        Authorization: `Bearer ${userData.token_key}`
                    }
                })
                .then(async (response)=>{

                    
                    await socket.emit('requestFriendship',{
    
                        requester:senderID,
                        recipient:getterID,
                        status:null,
                        roomIDGet:roomID
                    })

                    //ทำการอัพเดตไปที่ จำนวนการส่งคำขอ ณ Navbar Other
                     await axios.get(`${process.env.API_URL}/all-friendRequest/${accountData._id}`,{
                        headers:{
                            Authorization: `Bearer ${userData.token_key}`
                        }
                     })
                    .then((response)=>{
                        socket.emit('friendRequestList',{data:response.data.data,getterID:response.data.getterID})
                     })
                    .catch((error)=>{
                        console.log('เกิดข้อผิดพลาดกับ server')
                     })

                    //ลบห้องสนทนาระหว่างเพื่อน กับเรา หลังจากเป็นเพื่อนแล้ว
                    axios.delete(`${process.env.API_URL}/delete-chatmessege-room`,{
                        data:{senderID,getterID},
                        headers:{
                            Authorization: `Bearer ${userData.token_key}`
                        }
                    })
                    .then((data)=>{
                        console.log(data);
                    })
                    .catch((error)=>{
                         console.log(error);
                    })

                      
                })
                .catch((error)=>{
                    console.log(error);
                })
        
            }
        })

    }

    //ถึงตรงนี้
    //เรียกดูสถานะความเป็นเพื่อน
    useEffect(()=>{
        axios.post(`${process.env.API_URL}/checking-request`,{
            senderID,getterID
        },{
            headers:{
                Authorization: `Bearer ${userData.token_key}`
            }
        })
        .then((response)=>{
                setRequester(response.data.requester)
                setRecipient(response.data.recipient)
                setStatus(response.data.status)
        })
        .catch((error)=>{
            console.log(error)
        })
        .finally(()=>{
                setAddFriendLoading(false);
        })
        
    },[getterID])


    if(addFriendLoading){
    return(
    <div className="w-full flex justify-center pt-2">
        <div className="loader-event-dot"></div>
    </div>
    )
    }
    else if(!addFriendLoading){
    return(
    <div className="text-[0.9rem] w-full">
    {!status &&  
    <button onClick={handleSendingRequest}  className={'text-[0.75rem] py-2 px-2 shadow-md rounded-md bg-green-600 text-white w-full hover:bg-green-700 active:bg-green-700'}>
                  Add friend
    </button>
    }
 {status === 'pending' && requester === senderID && recipient === getterID && 
    <button onClick={handleRemoveRequest}  className={'text-[0.75rem] py-2 px-2 shadow-md rounded-md bg-blue-600 text-white w-full hover:bg-blue-700 active:bg-blue-700'}>
                  Requesting
    </button>
    }
          {status === 'pending' && recipient === senderID &&  requester === getterID && 
    <div className="flex gap-2 w-full">
    <button onClick={handleAcceptRequest} className={'text-[0.75rem] flex-1 py-2 w-full rounded-md shadow-md bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-700'}>
                  Accept
    </button>
    <button onClick={handleRemoveRequest}   className={'text-[0.75rem] flex-1 py-2 w-full rounded-md  shadow-md bg-stone-900 text-white hover:bg-stone-700 active:bg-stone-700'}>
                  Reject
    </button>
    </div>
    }
     { status === 'accepted' && (recipient === senderID || recipient === getterID) && (requester === getterID || requester === senderID)?
    <div className="flex gap-2 w-full">
    <button onClick={handleRemoveFriendship}   className={'text-[0.75rem] flex-1 py-2 w-full rounded-md shadow-md bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-700'}>
                Already friend              
    </button>
    
    <button onClick={()=>handleChatroomToggle(true,index>=0?index:null)} className={'text-[0.75rem] flex-1 py-2 w-full rounded-md shadow-md bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-600'}>
                  Send messages
    </button>
    </div>
    :
    <div>
    </div>
    }

    </div>

    )
    }
}