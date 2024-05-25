import Link from "next/link"
import { useState, useEffect } from "react"
import CreatingRoom from "./CreatingRoom"
import axios from "axios"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPerson, faPlus} from "@fortawesome/free-solid-svg-icons"
import { io } from "socket.io-client"
const socket = io(process.env.API_SOCKET_URL)
import { Tooltip } from "react-tooltip"
import 'react-tooltip/dist/react-tooltip.css'

export default function RoomsOnMain({userData,roomYouAreIn,RoomsOnMainLoadingStatus}){
    const [creatingRoomToggle,setCreatingRoomToggle] = useState(false)
    const [talkingrooms,setTalkingrooms] = useState([])

    useEffect(()=>{

        const fetchTalkingRooms =()=>{
            axios.post(`${process.env.API_URL}/all-talkingrooms`,{userID:userData.accountData._id},{
                headers:{
                    Authorization: `Bearer ${userData.token_key}`
                }
            })
            .then((response)=>{
                setTalkingrooms(response.data)
            })
            .catch((error)=>{
                console.log(error.response.data)
            })
            .finally(()=>{
                RoomsOnMainLoadingStatus(false);
            })
        }
        
        fetchTalkingRooms()
        
    },[])

    const handleCreatingRoomClose=(status)=>{
        setCreatingRoomToggle(status)
    }

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


      //เมื่อห้องถูกลบแล้ว ห้องพูดคุยที่ถูกลบจะทำการถูกกรองออกไป
      useEffect(()=>{
        const handleRoomDeleted = ({roomDeleted}) =>{
            setTalkingrooms((prev)=>{
                return prev.filter((room)=>{
                    return room._id!== roomDeleted._id
                })
            })
        }
        socket.on('room-deleting',handleRoomDeleted)

        return ()=>{
          socket.off('room-deleting',handleRoomDeleted)
        }  
      },[talkingrooms])


      //คนที่ถูกไล่ออกจากห้องพูดคุย จะลบห้องพูดคุยในนี้ไปด้วย
      useEffect(()=>{
        const handleRoomDeletedForUserKickedOut = ({roomDeleted , userKickedOut}) =>{
            if(userKickedOut === userData.accountData._id){
                setTalkingrooms((prev)=>{
                    return prev.filter((room)=>{
                        return room._id !== roomDeleted._id
                    })
                })
            }

        }
        socket.on('room-deleted-on-roomOnMain-for-userKickedOut',handleRoomDeletedForUserKickedOut)

        return ()=>{
            socket.off('room-deleted-on-roomOnMain-for-userKickedOut',handleRoomDeletedForUserKickedOut)
        }

      },[talkingrooms , userData])


          //คนที่ถูกยอมรับเข้าห้องพูดคุย จะเพิ่มพูดคุยในนี้ให้
          useEffect(()=>{
            const handleRoomAddAcceptedRoomForRequester = ({ requesterID, roomData }) =>{
                if(requesterID === userData.accountData._id){
                    setTalkingrooms((prev)=>{
                        return [roomData, ...prev];
                    })
                }
    
            }
            socket.on('room-update-after-accepted-from-requester-side',handleRoomAddAcceptedRoomForRequester)
    
            return ()=>{
                socket.off('room-update-after-accepted-from-requester-side',handleRoomAddAcceptedRoomForRequester)
            }
    
          },[talkingrooms , userData])


          const handleMouseEnter =(id)=>{
                const decID = document.getElementById(id);
                decID.classList.add('h-8','bottom-2')
                decID.classList.remove('h-3','bottom-5')

          }

          const handleMouseLeave =(id,roomID)=>{
            if(roomYouAreIn && roomID === roomYouAreIn._id){
                const decID = document.getElementById(id);
                decID.classList.add('h-8','bottom-2')
                decID.classList.remove('h-3','bottom-5')
            }else{
                const decID = document.getElementById(id);
                decID.classList.add('h-3','bottom-5')
                decID.classList.remove('h-8','bottom-2')
            }
      }

   
    return(
    <div className={`h-screen w-full bg-[#050111] relative overflow-y-scroll scrollbar-hide pb-2  ${creatingRoomToggle?'scrollbar-hide':''}`}>
    
    <div className="w-full flex flex-col items-center">
           
            {/* Logo Displaying */}
            <Link className="pt-2 pb-2" href={'/'}>
                <FontAwesomeIcon icon={faPerson} alt="logo" className="hover:bg-purple-800 cursor-pointer h-8 w-8 p-2 rounded-full bg-purple-500 text-white"/>
            </Link>


            {/* Creating Talking rooms */}
            <button id="create-talking-room" onClick={()=>{setCreatingRoomToggle(creatingRoomToggle?false:true);}} 
            className="flex px-2  items-center gap-2 rounded-full"
            >
            <FontAwesomeIcon icon={faPlus} className={`hover:text-white p-3  hover:rounded-xl h-6 w-6 hover:bg-purple-900 shadow-md ${creatingRoomToggle?'rounded-xl text-white bg-purple-900':'bg-[#383739]  text-purple-500 rounded-full'}`} src={'/add.png'} alt="Room picture"/>
            </button>
            <Tooltip 
            anchorSelect='#create-talking-room' place='right' className="hidden md:block" style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
            >
            Create a Talkingroom
            </Tooltip>


            {creatingRoomToggle &&
            <div className="overlay">
            <CreatingRoom handleCreatingRoomClose={handleCreatingRoomClose} userData={userData}/>
            </div>
             }

             
             {/* The user Talking rooms Displaying  */}
            {talkingrooms.length > 0 &&
            talkingrooms.map((room,index)=>{
            return (
            <div key={index} >
            <Tooltip 
            anchorSelect={`#roomname-${index}`} place='right' className="hidden md:block" style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
            >
            {room.roomName}
            </Tooltip>
             <div className="flex relative">
                <div id={`dec-${index}`} className={`bg-white my-1 text-[3px] rounded-full absolute left-[-28px] rotate-45 w-8  ${roomYouAreIn && room._id === roomYouAreIn._id?'h-8 bottom-2':'h-3 bottom-5'}`}>&nbsp;</div>
                {room.roomIcon ?
                 <Link id={`roomname-${index}`} passHref={true} className={`flex px-2 items-center gap-2 rounded-full pt-2`} href={`/rooms/talking-room/${room.slug}`}>
                    <img
                    className={`hover:rounded-xl h-12 w-12 hover:bg-gray-500 shadow-md ${roomYouAreIn && room._id === roomYouAreIn._id?'rounded-xl':'rounded-full'}`}
                    src={room.roomIcon.secure_url}
                    alt="Room Image" 
                    onMouseEnter={()=>handleMouseEnter(`dec-${index}`,room._id)}
                    onMouseLeave={()=>handleMouseLeave(`dec-${index}`,room._id)}
                    />
                 </Link>
                 :
                 <Link id={`roomname-${index}`} passHref={true} className={`flex px-2 items-center gap-2 pt-2 rounded-full`} href={`/rooms/talking-room/${room.slug}`}
                 onMouseEnter={()=>handleMouseEnter(`dec-${index}`,room._id)}
                 onMouseLeave={()=>handleMouseLeave(`dec-${index}`,room._id)}
                 >
                    <div className={`hover:rounded-xl bg-[#383739] text-[#383739] h-12 w-12 rounded-full ${roomYouAreIn && room._id === roomYouAreIn._id?'rounded-xl shadow-sm':'rounded-full'}`}
                    >&nbsp;&nbsp;&nbsp;</div>
                 </Link>
                }
            </div>
            </div>
            )})
            }

    </div>
    </div>
    )
}