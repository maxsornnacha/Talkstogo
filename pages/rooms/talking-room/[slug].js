import { useState,useEffect,useRef } from "react"
import { useRouter } from "next/router"
import UserDataFetching from '@/services/UserDataFetching'
import RoomsOnMain from "@/components/TalkingRooms/RoomsOnMain"
import axios from "axios"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faVolumeLow , faVolumeXmark, faMicrophone, faMicrophoneSlash,  faPlus, faCircle, faArrowLeft, faUser, faGear, faGears, faPhone, faCircleDown} from "@fortawesome/free-solid-svg-icons"
import Link from "next/link"
import Requests from "@/components/TalkingRooms/Requests"
import Notfound from "@/components/404"
import { io } from "socket.io-client"
const socket = io(process.env.API_SOCKET_URL)
import FriendInvite from "@/components/TalkingRooms/FriendInvite"
import CreateChatroomCard from "@/components/TalkingRooms/CreateChatroom"
import CreateTalkingroomCard from "@/components/TalkingRooms/CreateTalkingRoom"
import MemberCard from "@/components/TalkingRooms/MemberCard"
import ChatroomMenu from "@/components/TalkingRooms/ChatroomMenu"
import RoomSetting from "@/components/TalkingRooms/RoomSetting"
import Swal from 'sweetalert2'
import Messages from "@/components/TalkingRooms/Messages"
import {getEmbeddableUrl , isURL , convertTime, playSound , playSound2} from "@/modules/modules"
import { debounce} from 'lodash';
import Peer from 'simple-peer'
import LoaderBeforeFetching from "@/components/loader/LoaderBeforeFethcing"
import { Tooltip } from "react-tooltip"
import 'react-tooltip/dist/react-tooltip.css'
import AWS from 'aws-sdk';
import Head from "next/head"
import LoaderPage from "@/components/loader/LoaderPage"


export default function talkingroom(){
    const [userData,setUserData] = useState(null)
    const [room,setRoom] = useState(null)

    const [participants,setParticipants] = useState(null)
    const [admins,setAdmins] = useState(null)
    const [creator,setCreator] = useState(null)

    const [creatorStatus,setCreatorStatus] = useState(null)
    const [adminStatuses,setAdminStatuses] = useState(null)
    const [participantStatuses,setParticipantStatuses] = useState(null)
    const [roomPermission,setRoomPermission] = useState(false)
    const [micOnOff,setMicOnOff] = useState(true)
    const [speakerOnOff, setSpeakerOnOff] = useState(true)
    const [invite,setInvite] = useState(false)
    const [memberCardToggle,setMemberCardToggle] = useState(false)
   
    const router = useRouter()
    const {slug} = router.query

    const [chatroomFocused,setChatroomFocused] = useState(null)
    const [talkingroomFocused,setTalkingroomFocus] = useState(null)
    const [talkingroomFocusedMobile, setTalkingroomFocusMobile] = useState(null)


    const [mobileMenuToggle,setMobileMenuToggle] = useState(true)
    const [mobileChatboxToggle,setMobileChatboxToggle] = useState(false)

    const [createChatroomCardToggle,setCreateChatroomCardToggle] = useState(false)
    const [createTalkingroomCardToggle,setCreateTalkingroomCardToggle] = useState(false)

    const [chatroomMenuToggle,setChatroomMenuToggle] = useState(false)
    const [chatroomMenuIndex, setChatroomMenuIndex] = useState(null)


    const [roomSettingToggle,setRoomSettingToggle] = useState(false)

    const [isInRoom, setIsInRoom] = useState(false)
    const [whichTalkingRoomAmIIn,setWhichTalkingRoomAmIIn] = useState(null)

    const [isAdmin, setIsAdmin] = useState(null)
    const [isCreator , setIsCreator] = useState(null)

    //Room loading
    const [roomOnMainLoading , setRoomOnMainLoading] = useState(true);

    const [roomLoading, setRoomLoading] = useState(true);
    const [adminLoading , setAdminLoading] = useState(true);
    const [participantLoading, setParticipantLoading]= useState(true);
    const [creatorLoading , setCreaterLoading] = useState(true);

    //จัดการ scrollbar always recently message
     //update chat to current scrolling part
     const chatRef = useRef(null);
     const chatRefMobile = useRef(null);
    
      // Function to scroll to the bottom of the chat
      const scrollToBottom = () => {
        if (chatRef.current && room) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
      };
      //For mobile
      const scrollToBottomMobile = () => {
        if (chatRefMobile.current && room) {
          chatRefMobile.current.scrollTop = chatRefMobile.current.scrollHeight;
        }
      };
      
      // กรณีที่ห้องถูก render ครั้งแรก และเมื่อส่ง message
      useEffect(() => {
        if(chatRefMobile.current && chatRef.current && room){
          let count = 0
          setInterval(()=>{
            count++
            if(count === 2){
              scrollToBottom()
              scrollToBottomMobile()
              clearInterval();
            }
          },1500)
        }
      }, [chatRefMobile.current , chatRef.current , roomLoading]);

      //กรณีที่มีการ toggle เปลี่ยนไปช่องแชทอื่นๆ
      useEffect(() => {
        scrollToBottom();
        scrollToBottomMobile();
      }, [chatroomFocused]);

      const updateToBottom = ()=>{
        scrollToBottom();
        scrollToBottomMobile();
      }


    useEffect(()=>{
      setChatroomFocused(0)
      setTalkingroomFocus(null)
      setIsInRoom(false)
      setWhichTalkingRoomAmIIn(null)
      setRoomOnMainLoading(true);

      setRoomLoading(true);
      setAdminLoading(true);
      setParticipantLoading(true);
      setCreaterLoading(true);
    },[slug])

    //fetching my account Data
    useEffect(() => {
        const fetchData = async () => {
          setUserData(await UserDataFetching());   

        if(!(await UserDataFetching())){
            router.push('/')
          }
        };
        fetchData();
      }, []);

    //fetching signle Talkingroom
    useEffect(()=>{
      if(slug && userData){
        const fetchData = ()=>{
          axios.post(`${process.env.API_URL}/get-single-talkingroom`,{slug},{
            headers:{
              Authorization: `Bearer ${userData.token_key}`
            }
          })
          .then((response)=>{
             setRoom(response.data);
             setRoomPermission(response.data.admins.some(admin =>admin.participant === userData.accountData._id) || response.data.participants.some(admin =>admin.participant === userData.accountData._id) || response.data.creator.some(creator =>creator.participant === userData.accountData._id) );
             setIsAdmin(response.data.admins.some((admin)=>admin.participant === userData.accountData._id));
             setIsCreator(response.data.creator.some((creator)=>creator.participant === userData.accountData._id))
            })
          .catch((error)=>{
            console.error('Error fetching single Talkingroom:', error);
            setRoom('notfound')
          })
          .finally(()=>{
            setRoomLoading(false);
          })
          }
         
          const source = axios.CancelToken.source();
          fetchData(source.token)

          return ()=>{
            source.cancel('การดึงข้อมูลถูกยกเลิกกลางคัน')
          }
  
      }
       

    },[slug, userData]);

    //fetching admins and participant
    useEffect(()=>{
      if(room && userData){
        const fetchData = ()=>{
          axios.post(`${process.env.API_URL}/get-all-members`,{members:room.admins},{
            headers:{
              Authorization: `Bearer ${userData.token_key}`
            }
          })
          .then((response)=>{
             setAdmins(response.data)
          })
          .catch((error)=>{
              console.log(error.response.data)
          })
          .finally(()=>{
            setAdminLoading(false);
          })

          axios.post(`${process.env.API_URL}/get-all-members`,{members:room.participants},{
            headers:{
              Authorization: `Bearer ${userData.token_key}`
            }
          })
          .then((response)=>{
             setParticipants(response.data)
          })
          .catch((error)=>{
              console.log(error.response.data)
          })
          .finally(()=>{
            setParticipantLoading(false);
         })

          axios.post(`${process.env.API_URL}/get-all-members`,{members:room.creator},{
            headers:{
              Authorization: `Bearer ${userData.token_key}`
            }
          })
          .then((response)=>{
             setCreator(response.data)
          })
          .catch((error)=>{
              console.log(error.response.data)
          })
          .finally(()=>{
            setCreaterLoading(false);
          })

          }
      
        fetchData()
      }
       
    },[room , userData])


    //เซ็ตสถานะ online | offline
    useEffect(()=>{
      if(room && room !== 'notfound' && userData){
              const isAdmin = room.admins.filter((admin)=>{
                return admin.participant === userData.accountData._id
              })

              const isParticipant = room.participants.filter((admin)=>{
                return admin.participant === userData.accountData._id
              })

              const isCreator = room.creator.filter((creator)=>{
                return creator.participant === userData.accountData._id
              })

    
              if(isAdmin.length > 0){
                axios.put(`${process.env.API_URL}/online-to-the-room-admin`,{roomID:room._id , userID:userData.accountData._id},{
                  headers:{
                    Authorization: `Bearer ${userData.token_key}`
                  }
                })
                .then((response)=>{
                   socket.emit('room-status-update-after-online-offline',{roomID:room._id, roomData:response.data})
                })
                .catch((error)=>{
                    console.log(error.response.data)
                })
              }
              else if(isParticipant.length > 0){
                axios.put(`${process.env.API_URL}/online-to-the-room-participant`,{roomID:room._id , userID:userData.accountData._id},{
                  headers:{
                    Authorization: `Bearer ${userData.token_key}`
                  }
                })
                .then((response)=>{
                  socket.emit('room-status-update-after-online-offline',{roomID:room._id, roomData:response.data})
                })
                .catch((error)=>{
                    console.log(error.response.data)
                })
              }
              else if(isCreator.length > 0){
                axios.put(`${process.env.API_URL}/online-to-the-room-creator`,{roomID:room._id , userID:userData.accountData._id},{
                  headers:{
                    Authorization: `Bearer ${userData.token_key}`
                  }
                })
                .then((response)=>{
                  socket.emit('room-status-update-after-online-offline',{roomID:room._id, roomData:response.data})
                })
                .catch((error)=>{
                    console.log(error.response.data)
                })
              }
              
      }
    },[room, userData])

    //อัพเดต สมาชิคห้อง หลังจากรับ สมาชิคเข้าห้อง แบบ Real-time
    useEffect(()=>{
      const handleUpdateSatusesAfterOnline = ({roomID,roomData}) =>{
      if(room){
         if(roomID === room._id){
            
          setAdminStatuses(()=>{
            const statuses = roomData.admins.map((admin)=>{
                return admin.status
            })
            return statuses
         })

         setParticipantStatuses(()=>{
          const statuses = roomData.participants.map((participant)=>{
              return participant.status
          })
          return statuses
          })

          setCreatorStatus(()=>{
            const statuses = roomData.creator.map((creator)=>{
                return creator.status
          })
          return statuses
          })

         }
      }
         
      }

      socket.on('room-status-update-after-online-offline',handleUpdateSatusesAfterOnline)

      return ()=>{
        socket.off('room-status-update-after-online-offline',handleUpdateSatusesAfterOnline)
      }

  },[room])


    //อัพเดต สมาชิคห้อง หลังจากรับ สมาชิคเข้าห้อง แบบ Real-time
    useEffect(()=>{
        const handleUpdateRoomAfterNewMemberJoining = ({roomID,roomData}) =>{

           if(roomID === room._id){
              setRoom(roomData)
           }
           
        }

        socket.on('room-update-after-accepted',handleUpdateRoomAfterNewMemberJoining)

        return ()=>{
          socket.off('room-update-after-accepted',handleUpdateRoomAfterNewMemberJoining)
        }

    },[room])

    //จะ refresh webpage เมื่อคุณถูกไล้ออกจากห้อง
    useEffect(()=>{
      const handleKickOutOfTheRoom = ({participantSelected}) =>{
          if(participantSelected === userData.accountData._id){
            Swal.fire({
              text: "You got kicked out of this room",
              showConfirmButton: false,
              timer: 1500
            }).then(()=>{
              window.location.reload()
            })
          }
      }

      socket.on('selected-participant-deleting',handleKickOutOfTheRoom)

      return ()=>{
        socket.off('selected-participant-deleting',handleKickOutOfTheRoom)
      }

    },[userData])


    //จัดการการปิด Invitation card
    const handleCloseInviteCard = (status)=>{
      setInvite(status)
    }

    //mobile Drag handling // ยังใช้งานไม่ได้

      const draggableRef = useRef(null);
    
      const handleDragEnd = (event) => {
        const distance = event.pageX - event.screenX;
        // Assuming you want to trigger the action when dragged to the left by at least 100 pixels
        console.log(distance)
        if (distance > 100) {
          // Perform your action here
          alert('You dragged to the left!');
        }
      }

      //จัดการปิด chatroom creating card
      const handleCloseCreateChatroomCard = (status)=>[

        setCreateChatroomCardToggle(status)
      ]

      
      //จัดการปิด talkingroom creating card
      const handleCloseCreateTalkingroomCard = (status)=>[

        setCreateTalkingroomCardToggle(status)
      ]

      
      //จัดการปิด member card
      const handleCloseMemberCard = (status) =>{
        setMemberCardToggle(status)
      }


      //เมื่อสร้างช่องแชทใหม่ หรือ ช่องสำหรับพูดคุยใหม่ จะทำการอัพเดตห้องพูดคุย แบบ real-time
      useEffect(()=>{
        const handleUpdateRoomAfterCreatingChatroomOrTalkingroom = ({roomUpdated}) =>{
          if(room._id === roomUpdated._id){
            setRoom(roomUpdated)
          }
        }

        socket.on('new-talkingroom-or-chatroom-created',handleUpdateRoomAfterCreatingChatroomOrTalkingroom)

        return ()=>{
          socket.off('new-talkingroom-or-chatroom-created',handleUpdateRoomAfterCreatingChatroomOrTalkingroom)
        }

      },[room])


        //เมื่อออกจากจากช่องพูดคุยนัั้นๆ จะทำการอัพเดตห้องพูดคุย แบบ real-time
        useEffect(()=>{
          const handleLeaveOutOfTheRoomchannel = async ({roomUpdated , senderID}) =>{
    
            if(room._id === roomUpdated._id && userData){
              if(senderID === userData.accountData._id){
                setIsInRoom(false);
                setWhichTalkingRoomAmIIn(null);
              }
              setRoom(roomUpdated)

    
          
               //เช็คว่าตอนออกจากห้องมี คนอยู่ในห้องมั้ย ถ้ามี คนที่อยู่ในห้องนั้นๆก็จะได้ยินเสียงด้วยเหมือนกัน
              const roomQuitting = await room.talkingChannels.filter((talkingroom) => {
                return talkingroom.participants.some((participant) => {
                    return participant._id === senderID; 
                });
             })

                if(roomQuitting.length > 0 && senderID !== userData.accountData._id){
                  const isSameRoom = await roomQuitting.filter((room)=>{
                    return room.participants.some((participant)=>{
                      return participant._id === userData.accountData._id
                    })
                  })
                  //The others in the talking channel
                  if(isSameRoom.length > 0){
                    playSound2()
                    if(whichTalkingRoomAmIIn && roomUpdated){
                      const talkingChannelUpdated = await roomUpdated.talkingChannels.filter((talkingroom) => {
                        return talkingroom.participants.some((participant) => {
                            return participant._id === userData.accountData._id; 
                        });
                     })
                    setWhichTalkingRoomAmIIn(talkingChannelUpdated)
                    }
                  }
                }
            }
          }
  
          socket.on('leave-out-of-the-roomChannel',handleLeaveOutOfTheRoomchannel)
  
          return ()=>{
            socket.off('leave-out-of-the-roomChannel',handleLeaveOutOfTheRoomchannel)
          }
  
        },[room , userData])

            //เมื่อออกจากจากช่องพูดคุยแล้วย้ายไปยังช่องใหม้ จะทำการอัพเดตห้องพูดคุย แบบ real-time
            useEffect(()=>{
              const handleLeaveOutOfTheRoomchannelToEnterToTheNewChannel = async ({roomUpdated, channelUpdated , senderID}) =>{
        
                if(room._id === roomUpdated._id && userData){
                  setRoom(roomUpdated)
    
                      //The others in the talking channel
                      if(whichTalkingRoomAmIIn && channelUpdated[0]._id === whichTalkingRoomAmIIn[0]._id && senderID !== userData.accountData._id){
                        playSound2()
                        setWhichTalkingRoomAmIIn(channelUpdated)
                      }
          
                  }
                }
      
      
              socket.on('leave-out-of-the-roomChannel-to-enter-the-new-channel',handleLeaveOutOfTheRoomchannelToEnterToTheNewChannel)
      
              return ()=>{
                socket.off('leave-out-of-the-roomChannel-to-enter-the-new-channel',handleLeaveOutOfTheRoomchannelToEnterToTheNewChannel)
              }
      
            },[room , userData])


      //ปิด chatroom channel setting
      const handleCloseChatroomMenu = (status) =>{
        setChatroomMenuToggle(status)
        setChatroomMenuIndex(null)
      }


      //จัดการเมื่อลบช่องแชทไปแล้ว mobile
      const closeMobileChatboxToggleInSetting = ()=>{
        setMobileMenuToggle(true)
        setMobileChatboxToggle(false)
      }
   

      //จัดการปิด setting
      const handleCloseRoomSettingCard = () =>{
        setRoomSettingToggle(false)
      }


      //เมื่อห้องถูกลบแล้ว ห้องพูดคุยที่ถูกลบจะทำการ refresh
      useEffect(()=>{
        const handleRoomDeleted = ({roomDeleted}) =>{
          if(roomDeleted._id === room._id){
            Swal.fire({
              text: "This room has been deleted already",
              showConfirmButton: false,
              timer: 1500
            })
            .then(()=>{
              router.push('/')
            })
          }
        }
        socket.on('room-deleting',handleRoomDeleted)

        return ()=>{
          socket.off('room-deleting',handleRoomDeleted)
        }  
      },[room])


      //ส่วนสุดท้าย จัดการ talkingroom channel ทั้งหมด
      //เมื่อเข้าห้อง
      const handleTalkingRoomParticipants =(event , talkingroom)=>{
          event.preventDefault();
          setMicOnOff(true);
          setSpeakerOnOff(true);
          axios.put(`${process.env.API_URL}/member-get-in-talkingroom`,{
              talkingroomID:talkingroom._id,
              userData:userData.accountData
          },{
            headers:{
              Authorization: `Bearer ${userData.token_key}`
            }
          })
          .then(async (response)=>{
            //กรณีที่อยู่ในช่องแล้ว แล้วย้ายไปช้่องใหม่
            if(whichTalkingRoomAmIIn && whichTalkingRoomAmIIn.length > 0){
            const channelUpdated = await response.data.talkingChannels.filter((channel)=>{
                return channel._id === whichTalkingRoomAmIIn[0]._id
             })
             await socket.emit('leave-out-of-the-roomChannel-to-enter-the-new-channel',{roomUpdated:response.data , channelUpdated:channelUpdated , senderID: userData.accountData._id})
            }
     
            setIsInRoom(true)
            setRoom(response.data)
            await socket.emit('enter-to-the-room',{roomUpdated:response.data , senderID: userData.accountData._id})

            //เช็คว่าอยู่ห้องไหน
            await setWhichTalkingRoomAmIIn(()=>{
                return response.data.talkingChannels.filter((talkingroom)=>{
                return talkingroom.participants.some((participant)=>{
                  return participant._id === userData.accountData._id
                })
              })
            })
          })
          .catch((error)=>{
            Swal.fire({
             icon:'error',
             title:'Error entering to the talking channel',
             text:error
            })
            .then(()=>{
              setTalkingroomFocus(null)
            })
          })
      }

      //จะทำงานเมื่อปิดเว็บเพจนี้ หรือย้าย URL ที่อยู่นอก router, refresh , ปิด browser
      useEffect(() => {
        const handleBeforeUnload =async (event) => {
          event.preventDefault(); // Prevent the default behavior (showing a confirmation dialog)
          event.returnValue = ''; // Required for some browsers
          if(userData){
            try{
              const response = await axios.put(`${process.env.API_URL}/member-get-out-of-talkingroom`, {
                  userData: userData.accountData
              },{
                headers:{
                  Authorization: `Bearer ${userData.token_key}`
                }
              });
              await socket.emit('leave-out-of-the-roomChannel', { roomUpdated: response.data, senderID: userData.accountData._id });
            }catch (error) {
              Swal.fire({
                  title: 'Error get out of the talkingroom',
                  text: error.response.data.error
              });
            }

          }else{
          try{
            const userData = await UserDataFetching();
            const response = await axios.put(`${process.env.API_URL}/member-get-out-of-talkingroom`, {
                userData: userData.accountData
            },{
              headers:{
                Authorization: `Bearer ${userData.token_key}`
              }
            });
            await socket.emit('leave-out-of-the-roomChannel', { roomUpdated: response.data, senderID: userData.accountData._id });
          }catch (error) {
            Swal.fire({
                title: 'Error get out of the talkingroom',
                text: error.response.data.error
            });
          }

          }

      };
          

        const handleUnload = async (event) => {
          await event.preventDefault();
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('unload', handleUnload);
      
        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
          window.removeEventListener('unload', handleUnload);
        };
      }, [userData]);

      //เมื่อคลิก GoBack Left Arrow on top-left corner 
      useEffect(() => {
        const handlePopstate = async (event) => {
          const userData = await UserDataFetching()

              await axios.put(`${process.env.API_URL}/member-get-out-of-talkingroom`, {
                userData: userData.accountData
              },{
                headers:{
                  Authorization: `Bearer ${userData.token_key}`
                }
              })
              .then(async (response)=>{
                playSound2()
                await socket.emit('leave-out-of-the-roomChannel',{roomUpdated:response.data , senderID:userData.accountData._id})
              })
              .catch((error)=>{
                Swal.fire({
                  title: 'Error get out of the talkingroom',
                 text:error.response.data.error
                })
            })
        };
      
        window.addEventListener('popstate', handlePopstate);
      
        return () => {
          window.removeEventListener('popstate', handlePopstate);
        };
      }, [userData]);
    
      //จะทำงานเมื่อย้ายไป Path อื่นๆของ router
      //เหลือตรงนี้
      useEffect(() => {

        const handleRouteChange = debounce(async() => { 
          const userData = await UserDataFetching()

          if(userData && isInRoom){
            const response = await axios.put(`${process.env.API_URL}/member-get-out-of-talkingroom`, {
              userData: userData.accountData
            },{
              headers:{
                Authorization: `Bearer ${userData.token_key}`
              }
            })
              playSound2()
              await socket.emit('leave-out-of-the-roomChannel',{roomUpdated:response.data , senderID:userData.accountData._id})
              
          }
    
        }, 300);
      
        router.events.on('routeChangeStart', handleRouteChange);
      
        return () => {
          router.events.off('routeChangeStart', handleRouteChange);
        };
      }, [isInRoom]);

      const handleExitFromTalkingMobile = async () =>{
        await axios.put(`${process.env.API_URL}/member-get-out-of-talkingroom`, {
          userData: userData.accountData
        },{
          headers:{
            Authorization: `Bearer ${userData.token_key}`
          }
        })
        .then(async (response)=>{
          playSound2()
          await socket.emit('leave-out-of-the-roomChannel',{roomUpdated:response.data , senderID:userData.accountData._id})
        })
        .catch((error)=>{
          Swal.fire({
           title: 'Error get out of the talkingroom',
           text:error.response.data.error
          })
        })
      }


      //จัดการ offline ทั้งหมด
      // ######
      // ######
      // ######
      // ###### >>>
      //จัดการ refreshed, ปิดบราวเซอร์ , ปิดเว็บไซด์ 
      useEffect(() => {
        const handleBeforeUnload =async (event) => {
          event.preventDefault(); // Prevent the default behavior (showing a confirmation dialog)
          event.returnValue = ''; // Required for some browsers
          if(room){
          if(userData){
            const isAdmin = room.admins.filter((admin)=>{
              return admin.participant === userData.accountData._id
            })
  
            const isParticipant = room.participants.filter((admin)=>{
              return admin.participant === userData.accountData._id
            })

            const isCreator = room.creator.filter((creator)=>{
              return creator.participant === userData.accountData._id
            })
  
            if(isAdmin.length > 0){
              await axios.put(`${process.env.API_URL}/offline-from-the-room-admin`,{roomID:room._id , userID:userData.accountData._id},{
                headers:{
                  Authorization: `Bearer ${userData.token_key}`
                }
              })
              .then((response)=>{
                 socket.emit('room-status-update-after-online-offline',{roomID:response.data._id, roomData:response.data})
              })
              .catch((error)=>{
                  console.log(error.response.data)
              })
            }
            else if(isParticipant.length > 0){
              await axios.put(`${process.env.API_URL}/offline-from-the-room-participant`,{roomID:room._id , userID:userData.accountData._id},{
                headers:{
                  Authorization: `Bearer ${userData.token_key}`
                }
              })
              .then((response)=>{
                socket.emit('room-status-update-after-online-offline',{roomID:response.data._id, roomData:response.data})
              })
              .catch((error)=>{
                  console.log(error.response.data)
              })
            }
            else if(isCreator.length > 0){
              await axios.put(`${process.env.API_URL}/offline-from-the-room-creator`,{roomID:room._id , userID:userData.accountData._id},{
                headers:{
                  Authorization: `Bearer ${userData.token_key}`
                }
              })
              .then((response)=>{
                socket.emit('room-status-update-after-online-offline',{roomID:response.data._id, roomData:response.data})
              })
              .catch((error)=>{
                  console.log(error.response.data)
              })
            }

          }else{
            const userData = await UserDataFetching();
            
            const isAdmin = room.admins.filter((admin)=>{
              return admin.participant === userData.accountData._id
            })
  
            const isParticipant = room.participants.filter((admin)=>{
              return admin.participant === userData.accountData._id
            })

            const isCreator = room.creator.filter((creator)=>{
              return creator.participant === userData.accountData._id
            })
  
            if(isAdmin.length > 0){
              await axios.put(`${process.env.API_URL}/offline-from-the-room-admin`,{roomID:room._id , userID:userData.accountData._id},{
                headers:{
                  Authorization: `Bearer ${userData.token_key}`
                }
              })
              .then((response)=>{
                 socket.emit('room-status-update-after-online-offline',{roomID:response.data._id, roomData:response.data})
              })
              .catch((error)=>{
                  console.log(error.response.data)
              })
            }
            else if(isParticipant.length > 0){
              await axios.put(`${process.env.API_URL}/offline-from-the-room-participant`,{roomID:room._id , userID:userData.accountData._id},{
                headers:{
                  Authorization: `Bearer ${userData.token_key}`
                }
              })
              .then((response)=>{
                socket.emit('room-status-update-after-online-offline',{roomID:response.data._id, roomData:response.data})
              })
              .catch((error)=>{
                  console.log(error.response.data)
              })
            }
            else if(isCreator.length > 0){
              await axios.put(`${process.env.API_URL}/offline-from-the-room-creator`,{roomID:room._id , userID:userData.accountData._id},{
                headers:{
                  Authorization: `Bearer ${userData.token_key}`
                }
              })
              .then((response)=>{
                socket.emit('room-status-update-after-online-offline',{roomID:response.data._id, roomData:response.data})
              })
              .catch((error)=>{
                  console.log(error.response.data)
              })
            }
         
          }
          }

      };
          

        const handleUnload = async (event) => {
          await event.preventDefault();
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('unload', handleUnload);
      
        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
          window.removeEventListener('unload', handleUnload);
        };
      }, [userData ,room]);


      //จัดการย้อนกลับ
      useEffect(() => {
        const handlePopstate = async (event) => {
          const userData = await UserDataFetching()

          if(room){
          const isAdmin = room.admins.filter((admin)=>{
            return admin.participant === userData.accountData._id
          })

          const isParticipant = room.participants.filter((admin)=>{
            return admin.participant === userData.accountData._id
          })

          const isCreator = room.creator.filter((creator)=>{
            return creator.participant === userData.accountData._id
          })

          if(isAdmin.length > 0){
            await axios.put(`${process.env.API_URL}/offline-from-the-room-admin`,{roomID:room._id , userID:userData.accountData._id},{
              headers:{
                Authorization: `Bearer ${userData.token_key}`
              }
            })
            .then((response)=>{
               socket.emit('room-status-update-after-online-offline',{roomID:response.data._id, roomData:response.data})
            })
            .catch((error)=>{
                console.log(error.response.data)
            })
          }
          else if(isParticipant.length > 0){
            await axios.put(`${process.env.API_URL}/offline-from-the-room-participant`,{roomID:room._id , userID:userData.accountData._id},{
              headers:{
                Authorization: `Bearer ${userData.token_key}`
              }
            })
            .then((response)=>{
              socket.emit('room-status-update-after-online-offline',{roomID:response.data._id, roomData:response.data})
            })
            .catch((error)=>{
                console.log(error.response.data)
            })
          }
          else if(isCreator.length > 0){
            await axios.put(`${process.env.API_URL}/offline-from-the-room-creator`,{roomID:room._id , userID:userData.accountData._id},{
              headers:{
                Authorization: `Bearer ${userData.token_key}`
              }
            })
            .then((response)=>{
              socket.emit('room-status-update-after-online-offline',{roomID:response.data._id, roomData:response.data})
            })
            .catch((error)=>{
                console.log(error.response.data)
            })
          }

          }
        };
      
        window.addEventListener('popstate', handlePopstate);
      
        return () => {
          window.removeEventListener('popstate', handlePopstate);
        };
      }, [userData , room]);

      //จัดการย้ายไป path อื่น
      useEffect(() => {

        const handleRouteChange = debounce(async() => { 
          const userData = await UserDataFetching()
          if(room && room !== 'notfound' && userData){
          const isAdmin = room.admins.filter((admin)=>{
            return admin.participant === userData.accountData._id
          })

          const isParticipant = room.participants.filter((admin)=>{
            return admin.participant === userData.accountData._id
          })

          const isCreator = room.creator.filter((creator)=>{
            return creator.participant === userData.accountData._id
          })

          if(isAdmin.length > 0){
            await axios.put(`${process.env.API_URL}/offline-from-the-room-admin`,{roomID:room._id , userID:userData.accountData._id},{
              headers:{
                Authorization: `Bearer ${userData.token_key}`
              }
            })
            .then((response)=>{
               socket.emit('room-status-update-after-online-offline',{roomID:response.data._id, roomData:response.data})
            })
            .catch((error)=>{
                console.log(error)
            })
          }
          else if(isParticipant.length > 0){
            await axios.put(`${process.env.API_URL}/offline-from-the-room-participant`,{roomID:room._id , userID:userData.accountData._id},{
              headers:{
                Authorization: `Bearer ${userData.token_key}`
              }
            })
            .then((response)=>{
              socket.emit('room-status-update-after-online-offline',{roomID:response.data._id, roomData:response.data})
            })
            .catch((error)=>{
                console.log(error)
            })
          }
          else if(isCreator.length > 0){
            await axios.put(`${process.env.API_URL}/offline-from-the-room-creator`,{roomID:room._id , userID:userData.accountData._id},{
              headers:{
                Authorization: `Bearer ${userData.token_key}`
              }
            })
            .then((response)=>{
              socket.emit('room-status-update-after-online-offline',{roomID:response.data._id, roomData:response.data})
            })
            .catch((error)=>{
                console.log(error)
            })
          }

        }
    
        }, 300);
      
        router.events.on('routeChangeStart', handleRouteChange);
      
        return () => {
          router.events.off('routeChangeStart', handleRouteChange);
        };
      }, [room]);



      //จัดการหลังจากอยู่ในช่องพูดคุยแล้วจะ ทำการใช้เสียงในการสนมนา webRCT
      //เหลือส่วนนี้ แก้ไข local และ remote ยังไม่เชื่อมต่อกันอย่างที่ควรจะเป็น 
      const [me, setMe] = useState('');
      const [initPeer, setInitPeer] = useState([]);
      const [nonInitpeer, setNonInitPeer] = useState([]);
      const [myStream , setMyStream] = useState(null)
      const [audioInput , setAudioInput] = useState(null)
      const [connecting , setConnecting] = useState(false);
      const LocalAudioRef = useRef(null);
      const remoteAudioRefs = useRef([]);
      const userNO = useRef(null);



      useEffect(()=>{
        if(userData){
          setMe(userData.accountData._id)
        }
      },[userData])

        //When entering the talking channel
        useEffect(()=>{
          const handleUpdateRoomAfterEnterToTheRoom = async ({roomUpdated , senderID}) =>{
            //When being in tha taking chanel
            if(roomUpdated && senderID === userData.accountData._id && LocalAudioRef.current){

                const roomEntering = await roomUpdated.talkingChannels.filter((talkingroom) => {
                  return talkingroom.participants.some((participant) => {
                      return participant._id === senderID; 
                  });
                })
  
            
                //doing stream for myself
             navigator.mediaDevices.getUserMedia({audio:audioInput?
               {
                 deviceId:{exact:audioInput},
                 echoCancellation: true 
               }
               :
               { echoCancellation: true }
             })
             .then(async (stream)=>{
               if(LocalAudioRef.current){
                   LocalAudioRef.current.srcObject = stream;
                   setMyStream(stream); 
                    //If i join in the room 
                  setConnecting(true);        
               }else {
                 Swal.fire({
                   icon:'error',
                   text:'LocalAudioRef is not initialized'
                 })
               }
             
             // I , as a new user , will initiate init-peers to other users ( this is for sending to the others user in the same talking channel).
             // Or you can say that all of init peers created belongs to this user
             const peers = [];
           
             roomEntering[0].participants.forEach((user) =>{
                 if(user._id !== me){
 
                   const peer = new Peer({
                     initiator:true,
                     trickle:false,
                     stream:stream,
                     config: { iceServers: [
                       {
                         urls: "stun:stun.relay.metered.ca:80",
                       },
                       {
                         urls: "turn:global.relay.metered.ca:80",
                         username: "69f829afeb5224e9ddf75a31",
                         credential: "MAfZhLk3cf3ncot1",
                       },
                       {
                         urls: "turn:global.relay.metered.ca:80?transport=tcp",
                         username: "69f829afeb5224e9ddf75a31",
                         credential: "MAfZhLk3cf3ncot1",
                       },
                       {
                         urls: "turn:global.relay.metered.ca:443",
                         username: "69f829afeb5224e9ddf75a31",
                         credential: "MAfZhLk3cf3ncot1",
                       },
                       {
                         urls: "turns:global.relay.metered.ca:443?transport=tcp",
                         username: "69f829afeb5224e9ddf75a31",
                         credential: "MAfZhLk3cf3ncot1",
                       },
                     ]
 
                      }
                   })
                   peers.push({from:me , to:user._id , peer:peer})
        
                 }
 
             })
             //This will be stored in only this user or my state
             //After creating all of init-peers , the peers will be stored in State initPeer as an array, each index is object including to : who it is sent to , and peer : init-peer value object
             setInitPeer(peers)
 
 
             //Each init-peer that is going to be sent create offer SDP (session description protocal) as well as Ice candidates
             const offers = []
             peers.forEach((object)=>{
               const signalPromise = new Promise((resolve) => {
                 object.peer.on('signal', (signal) => {
                   resolve({from:object.from ,  to: object.to, offer: signal });
                 });
             });
             offers.push(signalPromise)
             })
 
             Promise.all(offers)
             .then(async (offers) => {
               if(offers.length > 0){
                 //After created , all of the offer will be sent to the target users identified by to object in peer
                 //in offers will store from , to , and offer in an object in Array named offers
                 socket.emit('offer-got-send',{offers:offers , NO:userNO.current , roomEntering:roomEntering , roomUpdated:roomUpdated})
               }else{
                 socket.emit('offer-not-got-send',{roomUpdated:roomUpdated})
                 //If there is on offer created or said that there are no other users in the talk, only me
                 //The connecting loader will be finished
                  //Update WhichTalkingRoomAmIIn for specific talking channel i am entering  
                  setWhichTalkingRoomAmIIn(roomEntering)
                  setConnecting(false);
                  playSound();
                 
               }
             })
 
 
           })

            }
          }
  
          socket.on('enter-to-the-room',handleUpdateRoomAfterEnterToTheRoom)
  
          return ()=>{
            socket.off('enter-to-the-room',handleUpdateRoomAfterEnterToTheRoom)
          }
  
        },[room , userData , me , LocalAudioRef.current])


      useEffect(()=>{
        const handleOfferNotGotSend  = ({roomUpdated}) =>{
          //If there is only 1 user, the room will be updated
          if(room._id === roomUpdated._id){
            setRoom(roomUpdated)
          }

        }

        socket.on('offer-not-got-send',handleOfferNotGotSend)

        return ()=>{
          socket.off('offer-not-got-send',handleOfferNotGotSend)
        }

      },[room])
      

      useEffect(()=>{
        const handleCreateAnswer =  ({offers , NO , roomEntering , roomUpdated})=>{ 

          //Check if userNO and myStream are exit
          if(userNO && myStream){
           offers.forEach( async (object)=>{
            // Check if the offer is send to me , and the offer is not created from me
              if(object.to === me && object.from !== me){
                  const peer = new Peer({
                    initiator:false,
                    trickle:false,
                    stream:myStream,
                    config: { iceServers: [
                      {
                        urls: "stun:stun.relay.metered.ca:80",
                      },
                      {
                        urls: "turn:global.relay.metered.ca:80",
                        username: "69f829afeb5224e9ddf75a31",
                        credential: "MAfZhLk3cf3ncot1",
                      },
                      {
                        urls: "turn:global.relay.metered.ca:80?transport=tcp",
                        username: "69f829afeb5224e9ddf75a31",
                        credential: "MAfZhLk3cf3ncot1",
                      },
                      {
                        urls: "turn:global.relay.metered.ca:443",
                        username: "69f829afeb5224e9ddf75a31",
                        credential: "MAfZhLk3cf3ncot1",
                      },
                      {
                        urls: "turns:global.relay.metered.ca:443?transport=tcp",
                        username: "69f829afeb5224e9ddf75a31",
                        credential: "MAfZhLk3cf3ncot1",
                      },
                  ]
                      
                     }
                  })

                   //Create non-init peer according to the number of offers that got
                   setNonInitPeer((prev)=>[...prev , {from:me , to:object.from , peer:peer}])
                  //connect or signal to the offer that got sent
                 peer.signal(object.offer)

                 //Peer stream
                 peer.on('stream',(stream)=>{
                  setNonInitPeer((prev)=>[...prev , {from:me , to:object.from , peer:peer , stream:stream}])
                 })
                  
                  //Send to the each init peer not in array, because send to each individual offer peer
                  peer.on('signal',(signal)=>{
                    socket.emit('answer-got-send',{nonInitpeer:peer , initNO:NO , answer:signal, from:me, userNO:userNO.current, to:object.from , roomEntering:roomEntering , roomUpdated:roomUpdated})
                  })
          
                  
              }

           })

          }
        }
        
          socket.on('nonInitpeer-get-offer-create-answer',handleCreateAnswer)

          return ()=>{
            socket.off('nonInitpeer-get-offer-create-answer',handleCreateAnswer)
          }


      },[whichTalkingRoomAmIIn , me , myStream])


      useEffect(()=>{
        const handleAcceptAnswer = async ({answer, from, userNO, to , roomEntering , roomUpdated , initNO})=>{

          //Check if the answer send back to me 
          if(to === me && initPeer.length > 0){
            //ถ้าเราเป็นคนสุดท้ายที่เข้าจะ ทำการปิดการ loading เมื่อเชื่อต่อเสร็จแล้ว //ส่วนคนที่ไม่ใช่จะมีการแจ้งเตือน
            setConnecting(false);
            playSound();
            setWhichTalkingRoomAmIIn(roomEntering);
            setRoom(roomUpdated);

              initPeer.forEach((object)=>{
                //check if the user whom this peer sent to is the same as the user that sent this answer
                if(object.to === from){
                  object.peer.signal(answer)

                  object.peer.on('stream',(stream)=>{
                    if(remoteAudioRefs.current[userNO]){
                      console.log(stream)
                      console.log(remoteAudioRefs.current[userNO])
                     remoteAudioRefs.current[userNO].srcObject = stream
                    }

                  })
                }
              })

          }
          //Check if I was not the new user who just came in the talking channel
          else if(from === me && nonInitpeer){
            playSound();
            setWhichTalkingRoomAmIIn(roomEntering);
            setRoom(roomUpdated);
            socket.emit('non-init-peer-stream-to-init',{initNO:initNO , senderID:me , to:to})
          }


        }
        
          socket.on('initpeer-accept-answer',handleAcceptAnswer)

          return ()=>{
            socket.off('initpeer-accept-answer',handleAcceptAnswer)
          }


      },[whichTalkingRoomAmIIn , me , initPeer , room , nonInitpeer])

      useEffect(() => {
        const nonInitPeerStreamToInit = ({ initNO, senderID, to }) => {

  
          if (senderID === me && nonInitpeer.length > 0) {
            if ( remoteAudioRefs.current[initNO]) {
              // Stream to the offer creator or init peer
              nonInitpeer.forEach((object) => {
                if (object.to === to) {
                  remoteAudioRefs.current[initNO].srcObject = object.stream;
                }
              });
              Swal.fire({
                text:`A new user joining to the channel`,
                showConfirmButton: false,
                timer: 1500,
                position:"top"
              })
            } else {
              Swal.fire({
                icon: 'error',
                text: 'RemoteAudio is not initialized on the Non-init side',
              });
            }
          }
        };
      
        socket.on('non-init-peer-stream-to-init', nonInitPeerStreamToInit);
      
        return () => {
          socket.off('non-init-peer-stream-to-init', nonInitPeerStreamToInit);
        };
      }, [whichTalkingRoomAmIIn, me, initPeer, room, nonInitpeer, myStream , remoteAudioRefs.current]);
      


      const handleMicOff = ()=>{
        if(myStream){
          myStream.getAudioTracks().forEach(track => {
            track.enabled = false;
          });
        }
      }

      const handleMicOn = async () => {
        if(myStream){
        myStream.getAudioTracks().forEach(track => {
          track.enabled = true;
        });
         } 
      };

    const handleSoundVolumeOff = ()=>{
          if(remoteAudioRefs.current.length > 1 && remoteAudioRefs.current){
            remoteAudioRefs.current.forEach((audio)=>{
              if(audio){
                audio.muted = true
              }
            })
          }
    }

    const handleSoundVolumeOn = ()=>{
      if(remoteAudioRefs.current.length > 1 && remoteAudioRefs.current){
        remoteAudioRefs.current.forEach((audio)=>{
          if(audio){
            audio.muted = false
          }
        })
      }
    }

    //จัดการเกี่ยวกับ Audio Input | Output
    const handleAudioInput = async (audioInputSelected) =>{
        //ถ้าเข้าร่วมช่องพูดคุยจะทำการ ออกจากช่องนั้น
        if(whichTalkingRoomAmIIn && whichTalkingRoomAmIIn.length > 0){
          await axios.put(`${process.env.API_URL}/member-get-out-of-talkingroom`, {
            userData: userData.accountData
          },{
            headers:{
              Authorization: `Bearer ${userData.token_key}`
            }
          })
          .then(async (response)=>{
            playSound2()
            setAudioInput(audioInputSelected)
            await socket.emit('leave-out-of-the-roomChannel',{roomUpdated:response.data , senderID:userData.accountData._id})
          })
          .catch((error)=>{
            Swal.fire({
             icon:'error',
             title:'เกิดข้อผิดพลาด',
             text:error.response.data.error
            })
          })
        }

    }

    //ค่อยแก้ พักไว้ก่อนละกัน
    const handleLeaveTheTalkingChannel = async (event)=>{
        event.preventDefault()

        if(initPeer.length > 0 ){
        initPeer.forEach((object)=>{
          object.peer.destroy();
          object.peer.on('close', function () {
            console.log('Init Peer connection closed');
          });
        });
        // Clear the initPeer state
        setInitPeer([]);
      }

      if(nonInitpeer.length > 0) {
        nonInitpeer.forEach((NonInitobject)=>{
          NonInitobject.peer.destroy();
          NonInitobject.peer.on('close', function () {
            console.log('Init Peer connection closed');
          });
        });
          socket.emit('init-peers-connected-to-me-disconnect',{from:userData.accountData._id , userNO:userNO})
      // Clear the initPeer state
      setNonInitPeer([])
      }

      if(myStream){
        myStream.getTracks().forEach((track)=>{
          track.stop();
        })
      }

      try {
        // Send request to server
        const response = await axios.put(`${process.env.API_URL}/member-get-out-of-talkingroom`, {
            userData: userData.accountData
        },{
          headers:{
            Authorization: `Bearer ${userData.token_key}`
          }
        });

        // Emit socket event
        await socket.emit('leave-out-of-the-roomChannel', {
            roomUpdated: response.data,
            senderID: userData.accountData._id
        });

        // Play sound after successful leave
        playSound2();
    } catch (error) {
        // Handle errors
        Swal.fire({
            title: 'Error get out of the talkingroom',
            text: error.response.data.error
        });
    }

    }

    useEffect(()=>{
      const initPeersWhoConnectedToMeDisconnect = ({from , userNO})=>{
        if(initPeer.length > 0){
         initPeer.forEach((object)=>{
              if(object.to === from){
                object.peer.destroy();
                object.peer.on('close', function () {
                  console.log(`Init Peer connected to ID : ${from} closed`);
                  setInitPeer(initPeer.filter((object)=>{
                    return object.to !== from
                  }))
                });
              }
         })
        }

        if(nonInitpeer.length > 0){
          initPeer.forEach((object)=>{
            if(object.from === from){
              object.peer.destroy();
              object.peer.on('close', function () {
                console.log(`Non Init Peer ID: ${from} that connected to you closed`);
                setInitPeer(initPeer.filter((object)=>{
                  return object.to !== from
                }))
              });
            }
       })
        }

      }

      socket.on('init-peers-connected-to-me-disconnect',initPeersWhoConnectedToMeDisconnect)

      return ()=>{
        socket.off('init-peers-connected-to-me-disconnect',initPeersWhoConnectedToMeDisconnect)
      }

    },[initPeer ,remoteAudioRefs.current])



    //About Toggle between Chat channel and Talking Channel Display
    const [CloseChatToggle, setClostChatToggle] = useState(false)



    //Handle All Loading
    const RoomsOnMainLoadingStatus=()=>{
      setRoomOnMainLoading(false);
    }

  

  
    //handle Downloading the file
    //config AWS S3
    AWS.config.update({
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      region: process.env.S3_BUCKET_REGION
    });
    const s3 = new AWS.S3();
    //Get file 
    const handleDownloadFile = async (file,event) => {
      try {
        event.preventDefault();
        // Generate a pre-signed URL for the file you want to download
        // Expires in 1 day
        if(file){
          const params = {
            Bucket: process.env.S3_BUCKET_NAME_FILE, 
            Key: file.key,      
            Expires: 60 * 60 * 24,
            ResponseContentDisposition: 'attachment'        
          };
          const url = await s3.getSignedUrlPromise('getObject', params);
          
          // Create an invisible anchor element
          const link = document.createElement('a');
          link.href = url;
          link.download = file.key.split('/').pop(file.key); // Use the file name from the key
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }else{
          Swal.fire({
            icon:'error',
            text:'There is no this file anymore'
          })
        }
  
      } catch (error) {
        console.log('Error downloading file:', error);
        Swal.fire({
          icon:'error',
          text:error
        })
      }
    };

    
  
    

  if(roomLoading || adminLoading || participantLoading || creatorLoading || !userData){
      return(
      <div className="block" >
      <LoaderBeforeFetching/>
      </div>
      )
    }else if(!roomLoading && !adminLoading && !participantLoading && !creatorLoading && userData && room === 'notfound'){
      return <Notfound/>
    }else
    {return (
    <>
    <Head>
      <title>{room.roomName} | TalkToGo</title>
    </Head>
    <div>
    {/* If to check that you are really our members */}
    {roomPermission && room ?
    <>
    <div className={`${roomOnMainLoading || roomLoading || adminLoading || participantLoading || creatorLoading?'hidden':'flex'} bg-[#383739]`}>

    {/* Room on Main for ipad and Pc */}
    <div className={`hidden md:block w-[70px] bg-[#050111]`}>
              <RoomsOnMain roomYouAreIn={room} userData={userData} RoomsOnMainLoadingStatus={RoomsOnMainLoadingStatus}/>
     </div>

    {/* Room on Main for Mobile*/}
    <div className={`${mobileChatboxToggle?'hidden':'block'} ${talkingroomFocusedMobile?'hidden':'block'} md:hidden w-[70px] bg-[#050111]`}>
              <RoomsOnMain roomYouAreIn={room} userData={userData} RoomsOnMainLoadingStatus={RoomsOnMainLoadingStatus}/>
     </div>
    
    {/* Section 1 */}
    {/* All chatroom and talkingroom channels including microphone on and off, leaving the room for notbook and PC*/}
    <div className="hidden md:block w-[230px] bg-[#161617] text-white">
    <div className="flex flex-col h-screen relative">
      
 
        {/* Top side*/}
        <div className="h-[45px] px-2 flex items-center justify-between">
        <div className={`font-normal break-words text-[0.75rem]`}>{room.roomName.length>15?room.roomName.slice(0,15)+'...':room.roomName}</div>
          <div className="flex gap-2 lg:hidden">
            <FontAwesomeIcon id="members-info" icon={faUser} onClick={()=>setMemberCardToggle(memberCardToggle?false:true)} className={`outline-none w-3 h-3 cursor-pointer hover:text-purple-500 ${memberCardToggle?'text-purple-500':''}`}/>
            <FontAwesomeIcon id="invitation" onClick={()=>setInvite(invite?false:true)} icon={faPlus} className={`outline-none w-3 h-3 hover:text-purple-500 cursor-pointer ${invite?'text-purple-500':''}`}/>
            <FontAwesomeIcon id="settings" icon={faGears} onClick={()=>setRoomSettingToggle(true)} className={`outline-none w-4 h-4 cursor-pointer hover:text-purple-500 ${roomSettingToggle?'text-purple-500':'text-white'}`}/>
        </div>
        <Tooltip 
            anchorSelect='#members-info' place='bottom-end' style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
            >
            Members
         </Tooltip>
         <Tooltip 
            anchorSelect='#invitation' place='bottom-end' style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
            >
            Friend Invitation
         </Tooltip>
         <Tooltip 
            anchorSelect='#settings' place='bottom-end' style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
            >
            Settings
         </Tooltip>
        </div>
        

        {/* Middle side */}
        <div className="flex-1 overflow-y-auto">
          <div>
          <div className="flex justify-between items-center px-2">
          <div className="font-normal text-[0.75rem]">
            Chat channels
          </div>
          {isAdmin &&
          <button id="create-chat-channel" onClick={()=>{setCreateChatroomCardToggle(true)}} className={`outline-none text-[1.2rem] font-bold hover:text-gray-300 ${createChatroomCardToggle?'text-purple-500':'text-white'}`}>
            +
          </button>
          }
          {isCreator &&
          <button id="create-chat-channel" onClick={()=>{setCreateChatroomCardToggle(true)}} className={`outline-none text-[1.2rem] font-bold hover:text-gray-300 ${createChatroomCardToggle?'text-purple-500':'text-white'}`}>
            +
          </button>
          }
          <Tooltip 
            anchorSelect='#create-chat-channel' place='right' style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
            >
            Create Chat channel
         </Tooltip>
          </div>
          {room.chatChannels.map((chatroom,index)=>{
          return (
          <button onClick={()=>{setClostChatToggle(false); setChatroomFocused(index); setMobileMenuToggle(false); setMobileChatboxToggle(true);}} key={index} className={`w-full text-start break-words hover:bg-gray-600 text-[0.8rem] p-1 ${chatroomFocused === index?'bg-gray-600':''}`}>
              #&nbsp;{chatroom.roomName}
          </button>
          )
          })}
          </div>



          <div className="mt-4 text-[0.8rem] flex flex-col">
          <div className="flex items-center justify-between px-2">
          <div>
            Talking channels
          </div>
          {isAdmin &&
          <button id="create-talking-channel" onClick={()=>{setCreateTalkingroomCardToggle(true)}} className={`outline-none text-[1.2rem] font-bold hover:text-gray-300 ${createTalkingroomCardToggle?'text-purple-500':'text-white'}`}>
            +
          </button>
          }
           {isCreator &&
          <button id="create-talking-channel" onClick={()=>{setCreateTalkingroomCardToggle(true)}} className={`outline-none text-[1.2rem] font-bold hover:text-gray-300 ${createTalkingroomCardToggle?'text-purple-500':'text-white'}`}>
            +
          </button>
          }
          <Tooltip 
            anchorSelect='#create-talking-channel' place='right' style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
            >
            Create Talking channel
         </Tooltip>
          </div>
        {room.talkingChannels.map((talkingroom,index)=>{
          return (
            <button onClick={(event)=>{whichTalkingRoomAmIIn && whichTalkingRoomAmIIn[0]._id === talkingroom._id?setClostChatToggle(true):(setClostChatToggle(false), setTalkingroomFocus(index+1), handleTalkingRoomParticipants(event ,talkingroom))}} key={index} className={`w-full flex flex-col gap-2  hover:bg-gray-600 text-[0.8rem] p-1`}>
            <div className="text-start w-full break-words"><FontAwesomeIcon icon={faVolumeLow} className="w-3 h-3"/>&nbsp;{talkingroom.roomName}</div>
             {talkingroom.participants.map((participant,index)=>{
                return (
                <div className="flex gap-2 text-[0.7rem] px-2 " key={index}>
                    <div><img src={participant.accountImage.secure_url} id={`user${index}-${talkingroom._id}`} className="h-5 w-5 rounded-full" /></div>
                    <div className="break-all text-start">{participant.firstname} {participant.lastname}</div>
                    <audio 
                    ref={participant._id === userData.accountData._id ?(element)=>{LocalAudioRef.current = element;  remoteAudioRefs.current[index] = null; userNO.current = index;}:(element)=>{remoteAudioRefs.current[index] = element}} 
                     autoPlay muted={participant._id === userData.accountData._id ? true:false}/>
                </div>
                )
              })
             }
          </button>
          )
        })}
        </div>
        </div>


        {/* Bottom side */}
        <div className="h-[64px] flex flex-col bg-stone-800 ">
        <div className="p-1 text-white bg-stone-600 flex justify-end items-center w-full">
          {LocalAudioRef.current && whichTalkingRoomAmIIn?
          <div className="flex gap-2 items-center">
          
          <button onClick={(event)=>{handleLeaveTheTalkingChannel(event); setTalkingroomFocus(null); setClostChatToggle(false);}} className="px-1 bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-md text-[0.65rem]">LEAVE</button>

          { micOnOff  ?
          <FontAwesomeIcon id="microphone" className={`w-3 h-3 cursor-pointer  ${LocalAudioRef.current?'outline-none':'outline-none cursor-default text-white'}`} icon={faMicrophone} onClick={()=>{setMicOnOff(false); handleMicOff()}}/>
          :
          <FontAwesomeIcon id="microphone" className={`w-3 h-3 cursor-pointer  ${LocalAudioRef.current?'outline-none':'outline-none cursor-default text-white'}`} icon={faMicrophoneSlash} onClick={()=>{setMicOnOff(true); handleMicOn()}}/>
          }


          {remoteAudioRefs.current.length > 1  ?
          <>
          {speakerOnOff ?
          <FontAwesomeIcon id="sound" className={`w-3 h-3 cursor-pointer  ${LocalAudioRef.current?'outline-none':'outline-none cursor-default text-white'}`} icon={faVolumeLow} onClick={()=>{setSpeakerOnOff(false); handleSoundVolumeOff();}}/>
          :
          <FontAwesomeIcon id="sound" className={`w-3 h-3 cursor-pointer  ${LocalAudioRef.current?'outline-none':'outline-none cursor-default text-white'}`} icon={faVolumeXmark} onClick={()=>{setSpeakerOnOff(true); handleSoundVolumeOn();}}/>
          }
          </>
          :
          <>
         <FontAwesomeIcon id="sound" className='outline-none w-3 h-3 cursor-default  text-white' icon={faVolumeLow}/>
          </>
          }
          </div>
          :
          <div className="flex gap-2 items-center">
          <FontAwesomeIcon id="microphone" className={`w-3 h-3 cursor-pointer ${LocalAudioRef.current?'outline-none':'outline-none cursor-default text-white'}`} icon={faMicrophone}/>
          <FontAwesomeIcon id="sound" className={`w-3 h-3 cursor-pointer ${LocalAudioRef.current?'outline-none':'outline-none cursor-default text-white'}`} icon={faVolumeLow}/>
          </div>
          }
          <Tooltip 
            anchorSelect='#microphone' place='top-end' style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
            >
            Turn on/off microphone
          </Tooltip>
          <Tooltip 
            anchorSelect='#sound' place='top-end' style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
            >
            Turn on/off Sound
          </Tooltip>
        </div>
        <div className="flex items-center gap-1 p-1">
            <Link href={`/profile/${userData.accountData.id}`}>
            <img src={userData.accountData.accountImage.secure_url} className="w-6 h-6 rounded-full" id="my-self-profile"/>
            </Link>
            <Link href={`/profile/${userData.accountData.id}`}>
            <div className="text-[0.65rem] font-normal">
               <div className="hover:text-purple-500 active:text-purple-500">{userData.accountData.firstname} {userData.accountData.lastname}</div>
               <div className="text-[0.6rem] text-green-400">Online</div>
            </div>
            </Link>
        </div>
        </div>
    </div>
    </div>


   
  {/* Section 1  mobile*/}
  {/* All chatroom and talkingroom channels including microphone on and off, leaving the room for mobile*/}
  {/* Up */}
  <div className="h-screen flex-1">
  {/* Down */}
  <div className="flex">
    {!talkingroomFocusedMobile &&
    <div
     ref={draggableRef}
     draggable="true"
     onDragEnd={handleDragEnd}
     hidden={!mobileMenuToggle?true:false} 
     className="w-full md:hidden bg-[#161617]"
     >

    <div className="text-white w-full flex flex-col justify-between">
 
        <div className="flex flex-col h-screen relative">
        <div className="h-[40px] flex items-center justify-between px-2">
          <div className={`font-normal break-words ${room.roomName.length>15?'text-[0.65rem]':'text-[0.9rem]'}`}>{room.roomName.length>15?room.roomName.slice(0,20)+'...':room.roomName}</div>
          <div className="flex gap-2 lg:hidden">
            <FontAwesomeIcon id="members-info-mobile"  icon={faUser} onClick={()=>setMemberCardToggle(memberCardToggle?false:true)} className={`outline-none w-4 h-4 cursor-pointer hover:text-purple-500 ${memberCardToggle?'text-purple-500':''}`}/>
            <FontAwesomeIcon id="invitation-mobile" onClick={()=>setInvite(invite?false:true)} icon={faPlus} className={`outline-none w-4 h-4 hover:text-purple-500 cursor-pointer ${invite?'text-purple-500':''}`}/>
            <FontAwesomeIcon id="settings-mobile" icon={faGears} onClick={()=>setRoomSettingToggle(true)} className={`outline-none w-4 h-4 cursor-pointer hover:text-purple-500 ${roomSettingToggle?'text-purple-500':'text-white'}`}/>
          </div>
          <Tooltip 
            anchorSelect='#members-info-mobile' place='bottom-end' className="hidden md:block" style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
            >
            Members
            </Tooltip>
            <Tooltip 
            anchorSelect='#invitation-mobile' place='bottom-start' className="hidden md:block" style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
            >
            Friend Invitation
            </Tooltip>
            <Tooltip 
            anchorSelect='#settings-mobile' place='bottom-start' className="hidden md:block" style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
            >
            Settings
            </Tooltip>
        </div>
          
        <div className="flex-1 overflow-y-auto">
        <div className="px-2 text-white">
        <div className="flex justify-between items-center">
          <div className="font-normal text-[0.8rem]">
            Chat channels
          </div>
          {isAdmin &&
          <button id="create-chat-channel-mobile" onClick={()=>{setCreateChatroomCardToggle(true)}} className={`text-[1.5rem] font-bold hover:text-gray-300 ${createChatroomCardToggle?'text-purple-500':'text-white'}`}>
            +
          </button>
          }
          {isCreator &&
          <button id="create-chat-channel-mobile" onClick={()=>{setCreateChatroomCardToggle(true)}} className={`text-[1.5rem] font-bold hover:text-gray-300 ${createChatroomCardToggle?'text-purple-500':'text-white'}`}>
            +
          </button>
          }
         <Tooltip 
            anchorSelect='#create-chat-channel-mobile' place='left' className="hidden md:block" style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
            >
            Create Chat channel
          </Tooltip>
        </div>

        <div>
        {room.chatChannels.map((chatroom,index)=>{
          return (
          <button onClick={()=>{setChatroomFocused(index); setMobileMenuToggle(false); setMobileChatboxToggle(true);}} key={index} className={`w-full text-start break-words hover:bg-gray-600 text-[0.8rem] p-1 ${chatroomFocused === index?'bg-gray-600':''}`}>
          #&nbsp;{chatroom.roomName}
          </button>
          )
        })}
        </div>
        </div>

        <div className="px-2 pt-2 text-white">
        <div className="text-[0.8rem] flex justify-between items-center ">
          <div>
            Talking channels
          </div>
          {isAdmin &&
          <button id="create-talking-channel-mobile" onClick={()=>{setCreateTalkingroomCardToggle(true)}} className={`text-[1.5rem] font-bold hover:text-gray-300 ${createTalkingroomCardToggle?'text-purple-500':'text-white'}`}>
            +
          </button>
          }
          {isCreator &&
          <button id="create-talking-channel-mobile" onClick={()=>{setCreateTalkingroomCardToggle(true)}} className={`text-[1.5rem] font-bold hover:text-gray-300 ${createTalkingroomCardToggle?'text-purple-500':'text-white'}`}>
            +
          </button>
          }
           <Tooltip 
            anchorSelect='#create-talking-channel-mobile' place='left' className="hidden md:block" style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
            >
            Create Talking channel
          </Tooltip>
        </div>
        </div>
        <div className="pb-4">
        {room.talkingChannels.map((talkingroom,index)=>{
          return (
          <button onClick={(event)=>{setTalkingroomFocusMobile(index+1); handleTalkingRoomParticipants(event ,talkingroom);}} key={index} className={`w-full text-start hover:bg-gray-600 px-2 text-white text-[0.8rem] p-1 ${talkingroomFocusedMobile === index+1?'bg-gray-600':''}`}>
             <div className="text-start w-full break-words"><FontAwesomeIcon icon={faVolumeLow} className="w-3 h-3"/>&nbsp;{talkingroom.roomName}</div>
          </button>
          )
        })}
        </div>
        </div>
    </div>
    </div>
    </div>
    }

    <div hidden={mobileChatboxToggle || talkingroomFocusedMobile?true:false} className="bg-stone-800 ms-1 md:hidden">
    <div className="bg-stone-900 h-[40px]">
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    </div>
    <div>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    </div>
    </div>


     {/* Section 1.5*/}
    {/* talking channel display */}
    {CloseChatToggle && whichTalkingRoomAmIIn &&
    <div className="flex-1 hidden md:flex md:flex-col just w-full h-screen text-white border-l border-stone-600">
        <div className="h-[44px] bg-stone-900 flex items-center w-full px-2">
            <div className="text-[0.75rem]"><FontAwesomeIcon icon={faVolumeLow} className="w-3 h-3"/>&nbsp;{whichTalkingRoomAmIIn[0].roomName}</div>
        </div>

        <div className="flex-1 overflow-auto grid grid-cols-12 w-full my-4">
            {whichTalkingRoomAmIIn[0].participants.length > 0 &&
            whichTalkingRoomAmIIn[0].participants.map((participant,index) =>{
            return (
            <div id={`userAnother${index}`} className="md:col-span-6 lg:col-span-4 xl:col-span-3 bg-stone-600 h-56 p-1 m-1 flex flex-col justify-center items-center gap-2 rounded-md" key={index}>
                <img src={participant.accountImage.secure_url} className="w-20 h-20 rounded-full"/>
                <div className="text-[0.8rem]">{participant.firstname} {participant.lastname}</div>
            </div>
            )
            })
            }
        </div>
        

  <div className="h-[70px] px-2 text-white flex justify-center items-center w-full">
          {LocalAudioRef.current && whichTalkingRoomAmIIn?
          <div className="flex gap-2 items-center">
          
          <FontAwesomeIcon icon={faPhone} onClick={(event)=>{handleLeaveTheTalkingChannel(event); setTalkingroomFocus(null); setClostChatToggle(false);}} className="rounded-full p-4 h-5 w-5 bg-red-600 hover:bg-red-500 cursor-pointer"/>
          { micOnOff  ?
          <FontAwesomeIcon className={`cursor-pointer rounded-full p-4 h-5 w-5 bg-stone-600 hover:bg-stone-500  ${LocalAudioRef.current?'':'cursor-default text-white'}`} icon={faMicrophone} onClick={()=>{setMicOnOff(false); handleMicOff()}}/>
          :
          <FontAwesomeIcon className={`cursor-pointer rounded-full p-4 h-5 w-5 bg-stone-600 hover:bg-stone-500  ${LocalAudioRef.current?'':'cursor-default text-white'}`} icon={faMicrophoneSlash} onClick={()=>{setMicOnOff(true); handleMicOn()}} />
          }


          {remoteAudioRefs.current.length > 1  ?
          <>
          {speakerOnOff ?
          <FontAwesomeIcon className={`cursor-pointer rounded-full p-4 h-5 w-5 bg-stone-600 hover:bg-stone-500 ${LocalAudioRef.current?'':'cursor-default text-white'}`} icon={faVolumeLow} onClick={()=>{setSpeakerOnOff(false); handleSoundVolumeOff();}}/>
          :
          <FontAwesomeIcon className={`cursor-pointer rounded-full p-4 h-5 w-5 bg-stone-600 hover:bg-stone-500  ${LocalAudioRef.current?'':'cursor-default text-white'}`} icon={faVolumeXmark} onClick={()=>{setSpeakerOnOff(true); handleSoundVolumeOn();}}/>
          }
          </>
          :
          <>
         <FontAwesomeIcon className='rounded-full p-4 h-5 w-5 bg-stone-800 cursor-default  text-white' icon={faVolumeLow}/>
          </>
          }
          </div>
          :
          <div className="flex gap-2 items-center">
          <FontAwesomeIcon className={`rounded-full p-4 h-5 w-5 bg-stone-800 cursor-pointer ${LocalAudioRef.current?'':'cursor-default text-white'}`} icon={faMicrophone}/>
          <FontAwesomeIcon className={`rounded-full p-4 h-5 w-5 bg-stone-800 cursor-pointer ${LocalAudioRef.current?'':'cursor-default text-white'}`} icon={faVolumeLow}/>
          </div>
          }
  </div>
        
    </div>
    }

    {/* Section 1.5 mobile*/}
    {/* talking channel display for only mobile*/}
    {talkingroomFocusedMobile &&
    <div className="w-full md:hidden bg-stone-800">
        {
        room.talkingChannels.map((talkingroom,index)=>{
          return (
          <div>    
          {talkingroomFocusedMobile === index+1 &&
          <div className="h-screen flex flex-col">

            <div className="w-full">
              <div className="text-[0.8rem] w-full flex h-[40px] bg-stone-900 px-2">
              <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faArrowLeft} onClick={()=>{setTalkingroomFocusMobile(null); setMobileMenuToggle(true); handleExitFromTalkingMobile();}} className="cursor-pointer hover:text-purple-500 me-2 h-5 w-5 text-white ms-3"/>
              <FontAwesomeIcon icon={faVolumeLow} className="w-4 h-4 text-white"/> 
              <div className="text-white">{talkingroom.roomName}</div>
            </div>
            </div>
            </div>

            <div className="flex-1 md:hidden w-full p-4 overflow-y-auto text-white grid grid-cols-12">
             {talkingroom.participants.map((participant,index)=>{
                return (
                <div id={`userMobile${index}`} className="col-span-6 text-[0.8rem] m-2 bg-stone-700 h-56 flex flex-col items-center justify-center gap-2 rounded-md" key={index}>
                    <div><img src={participant.accountImage.secure_url} className="h-10 w-10 md:h-6 md:w-6 rounded-full" /></div>
                    <div>{participant.firstname} {participant.lastname}</div>
                    <audio 
                     ref={participant._id === userData.accountData._id ?(element)=>{LocalAudioRef.current = element;  remoteAudioRefs.current[index] = null; userNO.current = index;}:(element)=>{remoteAudioRefs.current[index] = element}} 
                     autoPlay muted={participant._id === userData.accountData._id ? true:false}/>
                </div>
                )
              })
             }
          </div>

          <div className="h-[70px] bg-stone-900 w-full">
        <div className="h-[70px] px-2 text-white flex justify-between items-center w-full">

          {LocalAudioRef.current && whichTalkingRoomAmIIn?
          <div className="flex gap-4 items-center w-full justify-center">

          <FontAwesomeIcon icon={faPhone} onClick={(event)=>{handleLeaveTheTalkingChannel(event); setTalkingroomFocusMobile(null); setMobileMenuToggle(true);}} className="rounded-full p-4 h-5 w-5 bg-red-600 hover:bg-red-700 cursor-pointer"/>

          { micOnOff  ?
          <FontAwesomeIcon className={`rounded-full p-4 h-5 w-5 bg-stone-600 cursor-pointer ${LocalAudioRef.current?'':'cursor-default text-white'}`} icon={faMicrophone} onClick={()=>{setMicOnOff(false); handleMicOff()}}/>
          :
          <FontAwesomeIcon className={`rounded-full p-4 h-5 w-5 bg-stone-600 cursor-pointer ${LocalAudioRef.current?'':'cursor-default text-white'}`} icon={faMicrophoneSlash} onClick={()=>{setMicOnOff(true); handleMicOn()}} />
          }


          {remoteAudioRefs.current.length > 1  ?
          <>
          {speakerOnOff ?
          <FontAwesomeIcon className={`rounded-full p-4 h-5 w-5 bg-stone-600 cursor-pointer ${LocalAudioRef.current?'':'cursor-default text-white'}`} icon={faVolumeLow} onClick={()=>{setSpeakerOnOff(false); handleSoundVolumeOff();}}/>
          :
          <FontAwesomeIcon className={`rounded-full p-4 h-5 w-5 bg-stone-600 cursor-pointer ${LocalAudioRef.current?'':'cursor-default text-white'}`} icon={faVolumeXmark} onClick={()=>{setSpeakerOnOff(true); handleSoundVolumeOn();}}/>
          }
          </>
          :
          <>
         <FontAwesomeIcon className='rounded-full p-4 h-5 w-5 bg-stone-700 cursor-default text-white' icon={faVolumeLow}/>
          </>
          }
          </div>
          :
          <div className="flex gap-4 items-center">
          <FontAwesomeIcon className={`rounded-full p-4 h-5 w-5 bg-stone-600 cursor-pointer ${LocalAudioRef.current?'':'cursor-default text-white'}`} icon={faMicrophone}/>
          <FontAwesomeIcon className={`rounded-full p-4 h-5 w-5 bg-stone-600 cursor-pointer ${LocalAudioRef.current?'':'cursor-default text-white'}`} icon={faVolumeLow}/>
          </div>
          }

        </div>
        </div>

        </div>
          }
          </div>
          )
          })}
    </div>
    }

        {/* Section 2 */}
        {/* Chat messages display*/}
        <div className={`flex-1 hidden ${CloseChatToggle?'md:hidden':'md:block'}  h-screen`}>
              {room.chatChannels.map((chatroom,index)=>{
                return (
                chatroomFocused === index &&
                <div key={index} className="flex flex-col h-screen">
                    <div className="w-full">
                    <div className="text-[0.8rem] bg-stone-900 w-full flex gap-1 items-center justify-between py-4 px-2 h-[44px] relative">
                       <div className="flex gap-2">
                       <div className="text-gray-300 ">#</div>
                       <div className="text-white ">{chatroom.roomName}</div>
                       </div>
                      {isAdmin &&
                       <div>
                        <FontAwesomeIcon 
                        onClick={()=>{setChatroomMenuIndex(index+1); setChatroomMenuToggle(true)}}
                        icon={faGear} 
                        className={`outline-none w-3 h-3 cursor-pointer hover:text-gray-200 ${chatroomMenuToggle?'text-purple-500':'text-white'}`}
                        id="chat-channel-settings"
                        />
                       </div>
                      }
                      {isCreator &&
                       <div>
                        <FontAwesomeIcon 
                        onClick={()=>{setChatroomMenuIndex(index+1); setChatroomMenuToggle(true)}}
                        icon={faGear} 
                        className={`outline-none w-3 h-3 cursor-pointer hover:text-gray-200 ${chatroomMenuToggle?'text-purple-500':'text-white'}`}
                        id="chat-channel-settings"
                        />
                       </div>
                      }
                        <Tooltip 
                        anchorSelect='#chat-channel-settings' place='top-end' style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
                        >
                        Chat channel settings
                        </Tooltip>
                    
                       {setChatroomMenuToggle && index+1 === chatroomMenuIndex && 
                        <div className={`absolute overlay`}>
                          {/* ตั้งค่าช่องแชท */}
                          <ChatroomMenu userData={userData} chatroom={chatroom} roomYouAreIn={room} handleCloseChatroomMenu={handleCloseChatroomMenu} isMobile={false}/>
                        </div>
                       }
                       </div>
                    </div>

                    {chatroom.messages.length !== 0 ?
                       <div className="flex-1  w-full p-4 overflow-y-auto" ref={chatRef}>
                          {chatroom.messages.map((message,index) =>{
                            return (
                            <div className="text-white text-[0.9rem] flex gap-2 pb-10" key={index}>
                                <div>
                                <Link href={`/profile/${message.senderData.id}`}>
                                  <img src={message.senderData.accountImage.secure_url} className="w-8 h-8 rounded-full"/>
                                </Link>
                                </div>

                                <div>
                                <div className="flex gap-2 items-center font-normal text-[0.8rem]">
                                    <Link href={`/profile/${message.senderData.id}`} className={`${room.admins.some((admin)=>admin.participant === message.senderData._id) && 'text-yellow-500 hover:text-yellow-600 active:text-yellow-600'} ${room.participants.some((p)=>p.participant === message.senderData._id) && 'text-white hover:text-gray-200 active:text-gray-200'} ${room.creator.some((creator)=>creator.participant === message.senderData._id) && 'text-purple-400 hover:text-purple-500 active:text-purple-500'}`}>
                                      {message.senderData.firstname} {message.senderData.lastname} ({room.admins.some((admin)=>admin.participant === message.senderData._id) && ' Admin'} {room.participants.some((p)=>p.participant === message.senderData._id) && 'Participant'} {room.creator.some((creator)=>creator.participant === message.senderData._id) && 'Leader '}) - 
                                      <span> {convertTime(message.timestamp)}</span>
                                    </Link>
                                </div>
                                {message.content.startsWith('https://www.youtube.com/') || message.content.startsWith('https://youtu.be/')
                                ?
                                <div className="break-words w-[50vw] lg:w-[40vw] text-[0.75rem]">
                                  <Link className="text-green-500 hover:text-green-600 active:text-green-600" href={message.content}>{message.content}</Link>
                                  <iframe
                                    className="iframe"
                                    height="315"
                                    src={getEmbeddableUrl(message.content)}
                                    allowFullScreen
                                  ></iframe>    
                                </div>
                                :
                                <div className="break-words w-[50vw] lg:w-[40vw] text-[0.75rem]">
                                  {isURL(message.content)?
                                  <Link className="text-green-500 hover:text-green-600 active:text-green-600" href={message.content}>{message.content}</Link>
                                  :
                                  message.content}
                                </div>
                                }

                                <div className="grid grid-cols-12 w-[50vw] lg:w-[40vw]">
                                {message.images.length === 1 &&
                                 message.images.map((image) =>{
                                    return <img src={image.image.secure_url} className="col-span-12 w-56 h-56 rounded-xl"/>
                                 })
                                }
                                {message.images.length > 1 &&
                                 message.images.map((image) =>{
                                    return <img src={image.image.secure_url} className="col-span-6 max-h-96 h-full p-1 w-full rounded-xl "/>
                                 })
                                }
                                {message.video &&
                                <div className="col-span-10 h-auto py-2 flex items-center justify-center p-1 w-auto rounded-xl bg-stone-800">
                                <video controls height={700} width={500}>
                                <source src={message.video.Location} type="video/mp4" />
                                Your browser does not support the video tag.
                               </video>
                               </div>
                                }
                                {message.file &&
                                <>
                                <div onClick={(event)=>{handleDownloadFile(message.file,event);}} id={`download-file-${index}`} className="cursor-pointer h-24 w-64 max-w-auto text-[0.7rem] p-3 rounded-md bg-stone-800 text-white hover:bg-purple-700 active:bg-purple-700 flex flex-col items-center justify-center">
                                      <div className="pb-2 px-2 self-start">Download File</div>
                                    <div className="flex justify-center items-center">
                                    <FontAwesomeIcon icon={faCircleDown} className="h-10 w-10"/>
                                    <div className="ps-2">
                                        <div>Name : {message.file.name.length > 20?message.file.name.slice(0,20)+'...':message.file.name}</div>
                                        <div>Size : {message.file.size/(1024 * 1024) > 0.99?((message.file.size/(1024 * 1024)).toFixed(4)+' MB'):((message.file.size/1024).toFixed(4)+' KB')}</div>
                                        <div>Type : {message.file.type}</div>
                                    </div>
                                    </div>
                                </div>
                                <Tooltip 
                                anchorSelect={`#download-file-${index}`} place='right' style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
                                >
                                Download file '{message.file.name}'
                              </Tooltip>
                                </>
                                }
                                
                                </div>
                                </div>

                            </div>
                            )
                          })
                          }
                       </div>
                        :
                        <div className="flex-1 text-gray-300 text-[0.8rem] flex items-center justify-center"> 
                            <div> Let's start talking !</div>
                        </div>
                    }

                    <div className="h-[44px] mx-2 py-1 flex items-end">
                    <Messages updateToBottom={updateToBottom} chatroom={chatroom} userData={userData} />
                    </div>
                </div>
                )
              })}
        </div>

          
        {/* Section 2 Mobile */}
        {/* Messages display*/}
              {room.chatChannels.map((chatroom,index)=>{
                return (
                chatroomFocused === index &&
                <div key={index} className={`md:hidden bg-stone-800 h-screen w-full ${!mobileChatboxToggle?'hidden':'flex flex-col'}`}>
                      <div className="w-full h-[40px] bg-stone-900 p-2">
                    <div className="text-[1rem] w-full flex justify-between">
                      <div className="flex gap-1 items-center ">
                      <FontAwesomeIcon icon={faArrowLeft} onClick={()=>{setMobileChatboxToggle(false); setMobileMenuToggle(true)}} className="cursor-pointer hover:text-purple-500 ms-2 me-3 h-5 w-5 text-white"/>
                       <div className="text-white">#</div>
                       <div className="text-white">{chatroom.roomName}</div>
                       </div>
                       
                       {isAdmin &&
                       <div>
                        <FontAwesomeIcon 
                        onClick={()=>{setChatroomMenuIndex(index+1); setChatroomMenuToggle(true)}}
                        icon={faGear} 
                        className={`outline-none w-4 h-4 cursor-pointer hover:text-gray-200 ${chatroomMenuToggle?'text-purple-500':'text-white'}`}
                        id="chat-channel-settings-mobile"
                        />
                       </div>
                        }
                        {isCreator &&
                       <div>
                        <FontAwesomeIcon 
                        onClick={()=>{setChatroomMenuIndex(index+1); setChatroomMenuToggle(true)}}
                        icon={faGear} 
                        className={`outline-none w-4 h-4 cursor-pointer hover:text-gray-200 ${chatroomMenuToggle?'text-purple-500':'text-white'}`}
                        id="chat-channel-settings-mobile"
                        />
                       </div>
                        }
                         <Tooltip 
                        anchorSelect='#chat-channel-settings-mobile' place='top-end' className="hidden md:block" style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
                        >
                        Chat channel settings
                        </Tooltip>
                        
                       {setChatroomMenuToggle && index+1 === chatroomMenuIndex && 
                        <div className={`absolute overlay`}>
                          {/* ตั้งค่าช่องแชท */}
                          <ChatroomMenu userData={userData} chatroom={chatroom} roomYouAreIn={room} handleCloseChatroomMenu={handleCloseChatroomMenu} closeMobileChatboxToggleInSetting={closeMobileChatboxToggleInSetting} isMobile={true}/>
                        </div>
                       }
                    </div>
                    </div>
                    {chatroom.messages.length !== 0 ?
                       <div className="flex-1 w-full p-4 overflow-y-auto" ref={chatRefMobile}>
                          {chatroom.messages.map((message,index) =>{
                            return (
                            <div className="text-white text-[0.9rem] flex gap-2 pb-10" key={index}>
                                <div>
                                <Link href={`/profile/${message.senderData.id}`}>
                                  <img src={message.senderData.accountImage.secure_url} className="w-8 h-8 rounded-full"/>
                                </Link>
                                </div>

                                <div>
                                <div className="flex gap-2 items-center text-[0.8rem]">
                                    <Link href={`/profile/${message.senderData.id}`} className={`${room.admins.some((admin)=>admin.participant === message.senderData._id) && 'text-yellow-500 hover:text-yellow-600 active:text-yellow-600'} ${room.participants.some((p)=>p.participant === message.senderData._id) && 'text-white hover:text-gray-200 active:text-gray-200'} ${room.creator.some((creator)=>creator.participant === message.senderData._id) && 'text-purple-400 hover:text-purple-500 active:text-purple-500'}`}>
                                      {message.senderData.firstname} {message.senderData.lastname} ({room.admins.some((admin)=>admin.participant === message.senderData._id) && ' Admin'} {room.participants.some((p)=>p.participant === message.senderData._id) && 'Participant'} {room.creator.some((creator)=>creator.participant === message.senderData._id) && 'Leader '}) - 
                                      <span> {convertTime(message.timestamp)}</span>
                                    </Link>
                                </div>
                                {message.content.startsWith('https://www.youtube.com/') || message.content.startsWith('https://youtu.be/')
                                ?
                                <div className="break-words w-[80vw]">
                                  <Link className="text-[0.75rem] text-green-500 hover:text-green-600 active:text-green-600" href={message.content}>{message.content}</Link>
                                  <iframe
                                    className="iframe-mobile"
                                    width='100vw'
                                    height="215"
                                    src={getEmbeddableUrl(message.content)}
                                    allowFullScreen
                                  ></iframe>    
                                </div>
                                :
                                <div className="break-words w-[80vw]">
                                  {isURL(message.content)?<Link className="text-[0.75rem] text-green-500 hover:text-green-600 active:text-green-600" href={message.content}>{message.content}</Link>:<div className="text-[0.75rem]">{message.content}</div>}
                                </div>
                                }

                                <div className="grid grid-cols-12 mt-3">
                                {message.images.length === 1 &&
                                 message.images.map((image) =>{
                                    return <img src={image.image.secure_url} className="col-span-12 w-56 h-56 rounded-md"/>
                                 })
                                }
                                {message.images.length > 1 &&
                                 message.images.map((image) =>{
                                    return <img src={image.image.secure_url} className="col-span-6 w-44 h-44  rounded-md "/>
                                 })
                                }
                                 {message.video &&
                                <div className="col-span-10 h-auto py-2 flex items-center justify-center p-1 w-[50vw] rounded-xl bg-stone-800">
                                <video controls height={700} width={500}>
                                <source src={`${message.video.Location}#t=0.1`} type="video/mp4" />
                                Your browser does not support the video tag.
                               </video>
                               </div>
                                }
                                {message.file &&
                                <>
                                <div onClick={(event)=>{handleDownloadFile(message.file,event);}} id={`download-file-${index}`} className="cursor-pointer h-24 min-w-56 col-span-10 w-[50vw] text-[0.7rem] p-2 rounded-md bg-stone-700 text-white hover:bg-purple-700 active:bg-purple-700 flex flex-col items-center justify-center">
                                      <div className="pb-2 px-2 self-start">Download File</div>
                                    <div className="flex justify-center items-center">
                                    <FontAwesomeIcon icon={faCircleDown} className="h-10 w-10"/>
                                    <div className="ps-2">
                                        <div>Name : {message.file.name.length > 40?message.file.name.slice(0,40)+'...':message.file.name}</div>
                                        <div>Size : {message.file.size/(1024 * 1024) > 0.99?((message.file.size/(1024 * 1024)).toFixed(4)+' MB'):((message.file.size/1024).toFixed(4)+' KB')}</div>
                                        <div>Type : {message.file.type}</div>
                                    </div>
                                    </div>
                                </div>
                                <Tooltip 
                                anchorSelect={`#download-file-${index}`} place='right' style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
                                >
                                Download file '{message.file.name}'
                              </Tooltip>
                                </>
                                }
                                </div>
                                </div>

                            </div>
                            )
                          })
                          }
                       </div>
                        :
                        <div className="flex-1 flex text-white text-[0.9rem] items-center justify-center"> 
                            <div> Let's start talking !</div>
                        </div>
                    }

                    <div className="mx-2 py-1 flex items-end h-[44px]">
                    <Messages updateToBottom={updateToBottom} chatroom={chatroom} userData={userData} />
                    </div>
                </div>
                )
              })}

          {/* Section 3 for Ipad and PC only , not mobile */}
         {/* member displaying*/}
         <div className="hidden lg:flex flex-col h-screen w-[200px] border-l border-stone-600">

         <div className="h-[45px] bg-stone-900 relative">
            <div className="text-[0.75rem] flex justify-between items-center py-4 px-2 break-words text-white">
            <div> Members</div>
            <div className="flex gap-2 items-center">
            <button id="second-invitation" onClick={()=>setInvite(invite?false:true)} className={`hover:text-purple-500 ${invite?'text-purple-500':''}`}> 
            <FontAwesomeIcon icon={faPlus}/>
            </button>
            <button id="second-settings" onClick={()=>setRoomSettingToggle(true)} className={`hover:text-purple-500 ${roomSettingToggle?'text-purple-500':'text-white'}`}>
            <FontAwesomeIcon icon={faGears} />
            </button>
            <Tooltip 
            anchorSelect='#second-invitation' place='bottom-end' style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
            >
            Friend Invitation
            </Tooltip>
            <Tooltip 
            anchorSelect='#second-settings' place='bottom-end' style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
            >
            Settings
            </Tooltip>
            </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto">
           <div className="my-4 px-2 text-white flex flex-col gap-8">

           <div>
          <div className="font-normal text-[0.8rem] mb-3">
                  Leader - {room.creator.length}
          </div>
          <div>
          {creator && creatorStatus &&
          creator.map((creator,index)=>{
          return (
          <div key={index} className="flex gap-2 items-center mb-2 relative">
              <Link href={`/profile/${creator.id}`}>
              <div><img src={creator.accountImage.secure_url} className="w-7 h-7 rounded-full"/></div>
              </Link>
              <FontAwesomeIcon icon={faCircle} className={`${creatorStatus[index] === 'online'?'text-green-400':'text-red-500'} w-2 h-2 border-2 border-[#383739] rounded-full absolute left-5 top-4`}/> 
              <Link href={`/profile/${creator.id}`}>
              <div className="text-[0.7rem] text-white hover:text-gray-200">{creator.firstname} {creator.lastname}</div>
              </Link>
          </div>
          )
          })
          }
          </div>
          </div>

          <div>
          <div className="font-normal text-[0.8rem] mb-3">
                  Admins - {room.admins.length}
          </div>
          <div className="mb-10">
          {admins && adminStatuses &&
          admins.map((admin,index)=>{
          return (
          <div key={index} className="flex gap-2 items-center mb-2 absolute">
              <Link href={`/profile/${admin.id}`}>
              <div><img src={admin.accountImage.secure_url} className="w-7 h-7 rounded-full"/></div>
              </Link>
              <FontAwesomeIcon icon={faCircle} className={`${adminStatuses[index] === 'online'?'text-green-400':'text-red-500'} w-2 h-2 border-2 border-[#383739] rounded-full absolute left-5 top-4`}/> 
              <Link href={`/profile/${admin.id}`}>
              <div className="text-[0.7rem] text-white hover:text-gray-200">{admin.firstname} {admin.lastname}</div>
              </Link>
          </div>
          )
          })
          }
          {admins && admins.length === 0 &&
            <div className="text-[0.75rem] flex flex-col justify-center items-center h-20">
            <div className={` text-gray-300 text-center`}>
            <div>
              There are no admins in this room yet.
            </div>
            </div>
      </div>
          }
          </div>
          </div>

          <div>
          <div className="font-normal text-[0.8rem] mb-3">
                  Normal members - {room.participants.length}
          </div>
          {participants && participants.length !== 0 && participantStatuses &&
          participants.map((participant,index)=>{
          return (
          <div key={index} className="flex gap-2 items-center mb-2 relative">
              <Link href={`/profile/${participant.id}`}>
              <div><img src={participant.accountImage.secure_url} className="w-7 h-7 rounded-full"/></div>
              </Link>
              <FontAwesomeIcon icon={faCircle} className={`${participantStatuses[index] === 'online' ?'text-green-400':'text-red-500'} w-2 h-2 border-2 border-[#383739] rounded-full absolute left-5 top-4`}/> 
              <Link href={`/profile/${participant.id}`}>
              <div className="text-[0.7rem] text-white hover:text-gray-200">{participant.firstname} {participant.lastname}</div>
              </Link>
          </div>
          )
          })}

          {participants && participants.length === 0 &&
          <div className="text-[0.75rem] flex flex-col justify-center items-center h-20">
                <div className={`cursor-pointer text-gray-300 hover:text-purple-300 text-center ${invite?'text-purple-500':''}`} onClick={()=>setInvite(true)}>
                <div>
                  There are no normal members yet.
                </div>
                <div>
                  Click here to add a member.
                </div>
                </div>
          </div>
          }
          </div>


            </div>  
        </div>
    </div>
    </div>
    </div>

  
    {/* Friend invitation card */}
    {invite &&
      <div className="overlay z-40">
      <FriendInvite userData={userData} roomYouAreIn={room} handleCloseInviteCard={handleCloseInviteCard}/>
      </div>
    }
    </div>
    <div className={`${roomOnMainLoading || roomLoading || adminLoading || participantLoading || creatorLoading ?'block':'hidden'}`} >
      <LoaderBeforeFetching/>
    </div>
    </>
    :
    //Room permission, if you are not a member of the room
    <div className="min-h-screen bg-[#383739] text-white flex flex-col items-center pt-56 gap-8">
        {room && 
        <img src={room.roomIcon?room.roomIcon.secure_url:'/black-background.jpg'} className="w-40 h-40 rounded-full"/>
        }
        <div className="md:text-[1.2rem] text-[1rem] text-center p-3">{userData?`${userData.accountData.firstname} ${userData.accountData.lastname}`:'Unknown'} , has not been a member of  {room?`'${room.roomName}' yet`:'Unknown'}</div>
        {room && userData && 
        <Requests userData={userData} accountID={userData.accountData._id} roomID={room._id}/>
        }       
    </div>
    }   

    
  {//Creating a new chat channel card
  createChatroomCardToggle &&
    <div className="overlay z-40">
      <CreateChatroomCard userData={userData} roomYouAreIn={room} handleCloseCreateChatroomCard={handleCloseCreateChatroomCard}/>
    </div>
    }

    
    {//Creating a new Talking channel card 
    createTalkingroomCardToggle &&
    <div className="overlay z-40">
      <CreateTalkingroomCard userData={userData} roomYouAreIn={room} handleCloseCreateTalkingroomCard={handleCloseCreateTalkingroomCard}/>
    </div>
    } 

    {//Member displaying for mobile
    memberCardToggle &&
    <div className="overlay z-40">
      <MemberCard userData={userData} handleCloseMemberCard={handleCloseMemberCard} admins={admins} creator={creator} participants={participants} creatorStatus={creatorStatus} participantStatuses={participantStatuses} adminStatuses={adminStatuses}/>
    </div>
    }

    {//overall room setting
    roomSettingToggle &&
    <div className="overlay z-40">
      <RoomSetting isInRoom={isInRoom} userData={userData} participants={participants} admins={admins} roomYouAreIn={room} handleCloseRoomSettingCard={handleCloseRoomSettingCard} handleAudioInput={handleAudioInput}/>
    </div>
    }

    {//Loading when conecting to other peers
    connecting &&
    <div className="overlay z-40">
    <div className="loader-page-for-cover z-50 p-2 px-3 text-white shadow-md overflow-y-auto">
        <div className="flex flex-row items-center gap-2">
        <FontAwesomeIcon icon={faPhone}  className="w-16 h-16 animate-bounce"/>
        <div className="loader-event-dot text-[4px] w-2"></div>
        </div>
    </div>
    </div>
    }

    </div>
    </>
    ) 
  }
}