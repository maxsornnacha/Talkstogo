import { useState,useEffect } from "react";
import Messenger from "./Messenger";
import Search from "./Search";
import Profile from "./Profile";
import FriendRequest from "./FriendRequest";
import Chatroom from "../Chats/Chats";
import TalkingRoom from "./TalkingRoom";
import axios from "axios";
import { useToggle } from "../Chats/ToggleChatContext";
import { io } from "socket.io-client"
const socket = io(process.env.API_SOCKET_URL)
import { Tooltip } from "react-tooltip"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faComments,faMagnifyingGlass,faUserPlus, faPeopleGroup, faChevronDown} from "@fortawesome/free-solid-svg-icons"
import { playSound3 , playSound4 } from "@/modules/modules";
import MenuBarOnNavbar from "../Menus/MenuBarOnNavbar";
import Swal from "sweetalert2";

export default function Navbar(props){
    const [messengerToggle,setMessengerToggle] = useState(false)
    const [searchToggle,setSearchToggle] = useState(false)
    const [profileToggle,setProfileToggle] = useState(false)
    const [friendRequestToggle,setFriendRequestToggle] = useState(false)
    const [friendRequestAmount,setFriendRequestAmount] = useState(0)
    const [allMessages,setAllMessages] = useState(null)
    const [newMessagesAmount,setNewMessageAmount] = useState(0)
    const [chatroomToggle,setChatroomToggle] = useState(false)
    const [TalkingRoomToggle,setTalkingRoomToggle] = useState(false)
    const [newTalkingRoomAmount,setNewTalkingRoomAmount] = useState(0)
    //const [msgNumber,setMsgNumber] = useState(null)
    const [getterData,setGetterData] = useState(null)
    const {isToggled1, setToggle1} = useToggle()
    const [menuToggle , setMenuToggle] = useState(false)
  

    //ทำงานในกล้อง search account จะปิด search  เมื่อทำการ click ที่รายชื่อ account นั้นๆ
    const handleClick=(status)=>{
        setSearchToggle(status)
    }

    //Notifications fro data updated
    useEffect(()=>{
        const handleNotify = ({getterID , type}) => {
            if(getterID === props.userData.accountData._id){
                
                if(type === 'message'){
                    playSound3();
                }
                if(type === 'friend-request'){
                    playSound4();
                    Swal.fire({
                        text:'new friend request',
                        showConfirmButton: false,
                        timer: 1500,
                        position: "top",
                    })
                }

            }
        };

        socket.on('notify-navbar',handleNotify);


        return ()=>{
            socket.off('notify-navbar',handleNotify);
        }


    },[])
    

    //ดึงข้อมูล friend reuest
    const fetching = ()=>{
        axios.get(`${process.env.API_URL}/all-friendRequest/${props.userData.accountData._id}`,{
            headers:{
                Authorization: `Bearer ${props.userData.token_key}`
              }
        })
        .then((response)=>{
            socket.emit('friendRequestList',{data:response.data.data,getterID:response.data.getterID})
        })
        .catch((error)=>{
            console.log(error)
        })
    }

    //ดึงข้อมูล friend request
    useEffect(()=>{
        if(props.userData){
            fetching()
        } 
    },[props,friendRequestToggle])

    //ดึงข้อมูล friend request
    useEffect(()=>{
        const handleFrinedRequestList = ({data,getterID})=>{
            if(getterID === props.userData.accountData._id){
            setFriendRequestAmount(data.length)
            }
        }
        socket.on('friendRequestList',handleFrinedRequestList)

        return ()=>{
            socket.off('friendRequestList',handleFrinedRequestList)
        }
    },[props])

    //ปิด messenger เมื่อเปิด chat
    const closeMessanger=(closeMessangerStatus,getterData)=>{
        setMessengerToggle(closeMessangerStatus)
        setGetterData(getterData)
    }

    //ปิด Chat เมื่อเปิด messenger
    const handleChatroomToggle=(data,index)=>{
        setChatroomToggle(data)
        //setMsgNumber(index)
        setToggle1()
       }


    //ปิด Chat เมื่อกิดปิด X
     const handleCloseChat=(data)=>{
       setChatroomToggle(data)
     }


     //จัดการเกี่ยวการ Messenger โดยจะดึงข้อมูล messeges ทั้งหมด
     useEffect(()=>{
        const fetchingAllMessages = ()=>{
            axios.get(`${process.env.API_URL}/all-messages/${props.userData.accountData._id}`,{
                headers:{
                    Authorization: `Bearer ${props.userData.token_key}`
                }
            })
        .then((response)=>{

            //สามารถเขียน Logic ตรงนี้เพื่อกรองหาแชทที่ไม่ได้อ่าน
            if(response.data && props.userData){
                const  filteredIsnotRead = (response.data).filter((chatBox,index)=>{

                    const filter = chatBox.messages.filter((message) => {
                        return message.senderID !== props.userData.accountData._id && message.isRead === false
                    });

                    return (filter.length > 0)
                })
                setAllMessages(response.data)
                setNewMessageAmount(filteredIsnotRead.length)
                socket.emit('allMessages',{data:response.data, newUnreadMessages:filteredIsnotRead.length, userID:props.userData.accountData._id})
                
            }

        })
        .catch((error)=>{
            console.log(error)
        })
        }

        fetchingAllMessages()
    },[props.userData])


    //จะทำการอัพเดต messages ทั้งหมดเมื่อมีข้อความส่งมา หรือว่าเราเข้าไปที่ chat นั้นๆเพื่ออ่านข้อความ
    //จะไป update ที่ทั้ง messenger และ new Message Amount อีกด้วย
    useEffect(()=>{
        socket.on('allMessages',({data,userID,newUnreadMessages}) =>{
           if(userID === props.userData.accountData._id){
            setAllMessages(data)
            setNewMessageAmount(newUnreadMessages)
           } 
        })
    },[])


    //จัดการเกี่ยวการ TalkingRoom โดยจะดึงข้อมูล room Requests ทั้งหมด
    useEffect(()=>{
        const fetchingRoomRequest=()=>{
            axios.get(`${process.env.API_URL}/all-room-requested/${props.userData.accountData._id}`,{
                headers:{
                    Authorization: `Bearer ${props.userData.token_key}`
                  }
            })
            .then((response)=>{
                setNewTalkingRoomAmount(response.data.length)
            })
            .catch(()=>{
                setNewTalkingRoomAmount(0)
            })
        }

        fetchingRoomRequest()

    },[props.userData])



     //กรณีมีคนส่งคำขอมาหรือยกเลิกมาแล้ว เราเป็น admin จะอัพเดตคำขอ อัตโนมัติ
     useEffect(()=>{
        const handleUpdateRoomRequest = async ({admins}) =>{
            const isAdmin = await admins.filter((admin)=>{
                return (admin.participant === props.userData.accountData._id)
            })

            if(isAdmin.length !== 0){
                const fetchingRoomRequest=()=>{
                    axios.get(`${process.env.API_URL}/all-room-requested/${props.userData.accountData._id}`,{
                        headers:{
                            Authorization: `Bearer ${props.userData.token_key}`
                        }
                    })
                    .then((response)=>{
                        setNewTalkingRoomAmount(response.data.length)
                        playSound4();
                        Swal.fire({
                        text:'new room request',
                        showConfirmButton: false,
                        timer: 1500,
                        position: "top",
                        })
                        
                    })
                    .catch(()=>{
                        setNewTalkingRoomAmount(0)
                    })
                }

                fetchingRoomRequest()
            }
            
        }

        socket.on('roomRequest-admin-side',handleUpdateRoomRequest)
        
        return ()=>{
            socket.off('roomRequest-admin-side',handleUpdateRoomRequest)
        }
    },[])


    
     //กรณีมีคนส่งคำขอมาหรือยกเลิกมาแล้ว เราเป็น admin จะอัพเดตคำขอ อัตโนมัติ
     useEffect(()=>{
        const handleUpdateRoomRequest = async ({creator}) =>{
            const isCreator = await creator.filter((creator)=>{
                return (creator.participant === props.userData.accountData._id)
            })

            if(isCreator.length !== 0){
                const fetchingRoomRequest=()=>{
                    axios.get(`${process.env.API_URL}/all-room-requested/${props.userData.accountData._id}`,{
                        headers:{
                            Authorization: `Bearer ${props.userData.token_key}`
                          }
                    })
                    .then((response)=>{
                        setNewTalkingRoomAmount(response.data.length)
                        playSound4();
                        Swal.fire({
                        text:'new room request',
                        showConfirmButton: false,
                        timer: 1500,
                        position: "top",
                        })
                    })
                    .catch((error)=>{
                        setNewTalkingRoomAmount(0)
                    })
                }

                fetchingRoomRequest()
            }
            
        }

        socket.on('roomRequest-creator-side',handleUpdateRoomRequest)
        
        return ()=>{
            socket.off('roomRequest-creator-side',handleUpdateRoomRequest)
        }
    },[])

    useEffect(()=>{
        
    })

    //handle closing menu Toggle for mobile
    const handleCloseMenuToggle = ()=>{
        setMenuToggle(false);
    }

    return(
    <nav className="py-1 px-1 flex h-[48px] bg-stone-900 text-gray-100 w-full">
 
        <div className="flex flex-1">
            <ul className="flex">
                <li><FontAwesomeIcon icon={faChevronDown} onClick={()=>{menuToggle?setMenuToggle(false):setMenuToggle(true); setSearchToggle(false); setMessengerToggle(false); setProfileToggle(false); setFriendRequestToggle(false); setTalkingRoomToggle(false)}} alt="menu" className={menuToggle?"cursor-pointer  p-1 h-7 w-5  me-1 md:hidden lg:hidden text-purple-500":"cursor-pointer  p-1 h-7 w-5  pe-1 md:hidden lg:hidden hover:text-purple-500"}/></li>
            </ul>
        </div>

        <div className="flex gap-1  justify-end pe-2">
    
        <div><FontAwesomeIcon id="talkingroom-requests" icon={faPeopleGroup} onClick={()=>{setMenuToggle(false); setTalkingRoomToggle(TalkingRoomToggle?false:true); setFriendRequestToggle(false); setSearchToggle(false); setMessengerToggle(false); setProfileToggle(false)}}  alt="search" className={TalkingRoomToggle?"outline-none h-4 w-4 p-2 cursor-pointer bg-purple-700 border-2 border-purple-700 rounded-full text-white":"outline-none h-4 w-4 p-2 cursor-pointer bg-white border-2  rounded-full text-purple-700 hover:bg-purple-700 hover:border-purple-700 hover:text-white"}/></div>
        {newTalkingRoomAmount > 0 &&
        <div className="bg-red-500 text-center w-4 h-4 text-[0.7rem] font-normal rounded-full absolute right-[167px] md:right-[168px] lg:right-[168px] top-[0px] ">{newTalkingRoomAmount}</div>
        }
        <Tooltip 
        anchorSelect={`#talkingroom-requests`} place='bottom-end' className="hidden md:block" style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
        >
        Talkingrom requests
        </Tooltip>
     
        <div><FontAwesomeIcon id="friend-requests" icon={faUserPlus} onClick={()=>{setMenuToggle(false); setFriendRequestToggle(friendRequestToggle?false:true); setTalkingRoomToggle(false); setSearchToggle(false); setMessengerToggle(false); setProfileToggle(false)}}  alt="search" className={friendRequestToggle?"outline-none h-4 w-4 p-2 cursor-pointer bg-purple-700 border-2 border-purple-700 rounded-full text-white":"outline-none h-4 w-4 p-2 cursor-pointer bg-white border-2  rounded-full text-purple-700 hover:bg-purple-700 hover:border-purple-700 hover:text-white"}/></div>
        {friendRequestAmount > 0 &&
        <div className="bg-red-500 text-center w-4 h-4 text-[0.7rem] rounded-full absolute right-[128px] md:right-[128px] lg:right-[128px] top-[0px] ">{friendRequestAmount}</div>
        }
         <Tooltip 
        anchorSelect={`#friend-requests`} place='bottom-end' className="hidden md:block"  style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
        >
        Friend requests
        </Tooltip>
        

        <div><FontAwesomeIcon id="messenger" icon={faComments} onClick={()=>{setMenuToggle(false); setMessengerToggle(messengerToggle?false:true); setTalkingRoomToggle(false); setSearchToggle(false); setProfileToggle(false); setFriendRequestToggle(false); setChatroomToggle(false)}}   alt="messenger" className={messengerToggle?"outline-none h-4 w-4 p-2 cursor-pointer  border-2 border-purple-700 rounded-full text-white bg-purple-700":"outline-none h-4 w-4 p-2 cursor-pointer  bg-white border-2 rounded-full text-purple-700 hover:bg-purple-700 hover:border-purple-700 hover:text-white"} /></div>
        {newMessagesAmount > 0 &&
        <div className="bg-red-500 text-center w-4 h-4 text-[0.7rem] rounded-full absolute right-[88px] md:right-[88px] lg:right-[88px] top-[0px] ">{newMessagesAmount}</div>
        }
        <Tooltip 
        anchorSelect={`#messenger`} place='bottom-end' className="hidden md:block"  style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
        >
        Messenger
        </Tooltip>

        <div><FontAwesomeIcon id="search" icon={faMagnifyingGlass} onClick={()=>{setMenuToggle(false); setSearchToggle(searchToggle?false:true); setTalkingRoomToggle(false); setMessengerToggle(false); setProfileToggle(false); setFriendRequestToggle(false)}} alt="search" className={searchToggle?"outline-none h-4 w-4 p-2  cursor-pointer bg-purple-700  border-2 border-purple-700 rounded-full text-white ":"outline-none h-4 w-4 p-2  cursor-pointer bg-white border-2  rounded-full text-purple-700 hover:bg-purple-700 hover:border-purple-700 hover:text-white"}/></div>
        <Tooltip 
        anchorSelect={`#search`} place='bottom-start' className="hidden md:block"  style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
        >
        Account search
        </Tooltip>

        {props.userData &&
        <div className="flex gap-1 items-center cursor-pointer ">
            <img id="profile" onClick={()=>{setMenuToggle(false); setProfileToggle(profileToggle?false:true); setMessengerToggle(false); setTalkingRoomToggle(false); setSearchToggle(false); setFriendRequestToggle(false)}} className={`outline-none rounded-full h-9 w-9 cursor-pointer active:border-2 active:border-purple-700`}  src={props.userData?props.userData.accountData.accountImage.secure_url:'/defaultProfile.png'} alt="Profile picture"/>
        </div> 
        }
        <Tooltip 
        anchorSelect={`#profile`} place='bottom-start' className="hidden md:block"  style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
        >
        Profile
        </Tooltip>

        </div>

        {friendRequestToggle &&
        <div className="navbar-card max-h-5/6 overflow-auto ">
            <FriendRequest userData={props.userData}/>
        </div>
        }

        {messengerToggle && 
        <div className="navbar-card max-h-5/6 overflow-auto ">
            <Messenger messages={allMessages} userData={props.userData} senderData={props.userData} closeMessanger={closeMessanger} handleChatroomToggle={handleChatroomToggle}/>
        </div>
        }

        
        {searchToggle &&
        <div className="navbar-card max-h-5/6 overflow-auto">
            <Search userData={props.userData} handleClick={handleClick}/>
        </div>
        }

        {chatroomToggle && isToggled1 &&  
        <div>
            <Chatroom userData={props.userData} handleCloseChat={handleCloseChat} senderData={props.userData} getterData={getterData}/>
        </div>
        }

        {profileToggle &&
        <div className="navbar-card-profile max-h-5/6 overflow-auto">
            <Profile isInRoom={props.isInRoom} room={props.room} userData={props.userData}/>
        </div>
        }

        {TalkingRoomToggle &&
        <div className="navbar-card max-h-5/6 overflow-auto">
            <TalkingRoom userData={props.userData}/>
        </div>
        }

        

        <div className={`md:hidden w-full z-50  overflow-y-auto bg-[#161617] fixed top-0 left-[70px]`}>
                <MenuBarOnNavbar menuToggle={menuToggle} userData={props.userData} handleCloseMenuToggle={handleCloseMenuToggle}/>
        </div>

    </nav>
    )
}