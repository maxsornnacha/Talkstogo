import Link from "next/link"
import { useState, useEffect } from "react"
import axios from "axios"
import { io } from "socket.io-client"
const socket = io(process.env.API_SOCKET_URL)


export default function Rooms({userData , CurrentTalkingRoomLoading}){
    const [talkingrooms,setTalkingrooms] = useState(null)
    const [loading , setLoading] = useState(true);

    useEffect(()=>{

        const fetchTalkingRooms =()=>{
            axios.post(`${process.env.API_URL}/all-talkingrooms`,{userID:userData.accountData._id},{
                headers:{
                    Authorization: `Bearer ${userData.token_key}`
                }
            })
            .then((response)=>{
                // Filter to check my timestamp
                const getMyTimestamp = response.data.map(room => {
                   const CreatorGet =  room.creator.filter((object)=>object.participant === userData.accountData._id)
                   const AdminGet =  room.admins.filter((object)=>object.participant === userData.accountData._id)
                   const ParticipantGet =  room.participants.filter((object)=>object.participant === userData.accountData._id)
                    
                   if(CreatorGet.length > 0 ){
                        return {timestamp:CreatorGet[0].timestamp, room:room}
                   }
                   else if(AdminGet.length > 0){
                        return {timestamp:AdminGet[0].timestamp, room:room}
                   }
                   else if(ParticipantGet.length > 0){
                        return {timestamp:ParticipantGet[0].timestamp, room:room}
                   }
                });
                //Sorting my timestamp
                const sortedRooms = getMyTimestamp.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                //Making 2 props to has be only one room object prop, and  get rid of timestamp prop
                const allRoomsGet = sortedRooms.map((object)=>{
                    return object.room
                })
                
                setTalkingrooms(allRoomsGet?allRoomsGet:response.data);
            })
            .catch((error)=>{
                console.log(error.response.data)
            })
            .finally(()=>{
                CurrentTalkingRoomLoading(false);
                setLoading(false);
            })
        }
        
        fetchTalkingRooms()
        
    },[userData])

    //เมื่อมีการแก้ไขข้อมูลห้องพูดคุย
    useEffect(()=>{
            const handleUpdateRoomAfterCreatingChatroomOrTalkingroom = ({roomUpdated}) =>{
                setTalkingrooms((prev)=>{
                    return prev.map((room)=>{
                        if(room._id === roomUpdated._id){
                            return roomUpdated
                        }
                        return room
                    })
                })
            }
    
            socket.on('new-talkingroom-or-chatroom-created',handleUpdateRoomAfterCreatingChatroomOrTalkingroom)
    
            return ()=>{
              socket.off('new-talkingroom-or-chatroom-created',handleUpdateRoomAfterCreatingChatroomOrTalkingroom)
            }
    
        },[talkingrooms])

        
    if(loading){
    return(
        <div className="h-20 w-full flex justify-start ps-10 items-center">
            <div className="loader-event-dot"></div>
        </div>
    )
    }   
    else{
    return (
    <div className="h-96 w-full">
    {talkingrooms &&
    talkingrooms.slice(0,10).map((room,index)=>{
    return (
            <div className="w-full flex flex-col items-start" key={index}>
                    <Link className="flex px-2  items-center gap-2  w-full py-1  hover:bg-gray-700 rounded-md hover:text-white" href={`/rooms/talking-room/${room.slug}`}>
                        {room.roomIcon ?
                        <img className=" h-8 w-8 rounded-full" src={room.roomIcon} alt="Room picture"/>
                        :
                        <div className="bg-[#383739] text-[#383739] h-8 w-8 rounded-full">...</div>
                        }
                        <div>
                        <p className="text-[0.75rem] font-normal">{room.roomName.length >15?room.roomName.slice(0,15)+'...':room.roomName}</p>
                        <p className="text-[0.6rem] font-normal">{room.roomDescription!==''?(room.roomDescription.length >20?room.roomDescription.slice(0,20)+'...':room.roomDescription):'No description'}</p>
                        </div>
                    </Link>
        
            </div>
    )
    })
    }

    {talkingrooms && talkingrooms.length === 0 &&
    <div className="text-[0.8rem] px-2">
        <div className="text-gray-400">No talkingroom yet</div>
    </div>
    }
    </div>
    )
    }
}