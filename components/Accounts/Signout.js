import axios from "axios"
import { useRouter } from "next/router"
import Swal from "sweetalert2"
import { playSound2 } from "@/modules/modules"
import { io } from "socket.io-client"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons"
const socket = io(process.env.API_SOCKET_URL)

export default function Signout({isInRoom , userData , room}){
    const redirect = useRouter()


    const handleSignOut=(event)=>{
        event.preventDefault()
        Swal.fire({
            text:`Are you sure that you want to log out?`,
            showCancelButton:true,
            confirmButtonText:"Logout",
            cancelButtonText:"Cancel"
        })
        .then((status)=>{
            if(status.isConfirmed){
                if(!room){
                    axios.post(`${process.env.API_URL}/logout-account`,null,{
                        withCredentials: true,
                        headers:{
                          Authorization: `Bearer ${userData.token_key}`
                        }
                    })  
                    .then((response)=>{
                        Swal.fire({
                          text:"Logout Successfully , Thanks for using our services",
                          showConfirmButton: false,
                          timer: 1500,
                          position: "top",
                        })
                        .then(()=>{
                                redirect.push('/login')
                        })
                    })
                    .catch((error)=>{
                        Swal.fire({
                            title: "Logout Failed",
                            text:error.response.data.error
                     });
                        
                    })   
                }else{
                    Swal.fire({
                        text:`Are you sure that you want to leave out of the room ${room.roomName}`,
                        imageUrl: room.roomIcon?room.roomIcon:"/black-background.jpg",
                        imageHeight: 100,
                        imageWidth: 100,
                        imageAlt: "A room icon",
                        showCancelButton:true
                    })
                    .then(async (status)=>{
                        if(status.isConfirmed && userData && !isInRoom){
                            try{
                                  //1
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
                                    await axios.put(`${process.env.API_URL}/offline-from-the-room-admin`,{roomID:room._id , userID:userData.accountData._id})
                                    .then((response)=>{
                                       socket.emit('room-status-update-after-online-offline',{roomID:response.data._id, roomData:response.data})
                                    })
                                  }
                                  else if(isParticipant.length > 0){
                                    await axios.put(`${process.env.API_URL}/offline-from-the-room-participant`,{roomID:room._id , userID:userData.accountData._id})
                                    .then((response)=>{
                                      socket.emit('room-status-update-after-online-offline',{roomID:response.data._id, roomData:response.data})
                                    })
                                  }
                                  else if(isCreator.length > 0){
                                    await axios.put(`${process.env.API_URL}/offline-from-the-room-creator`,{roomID:room._id , userID:userData.accountData._id})
                                    .then((response)=>{
                                      socket.emit('room-status-update-after-online-offline',{roomID:response.data._id, roomData:response.data})
                                    })
                                  }
    
                                  //2
                                  axios.post(`${process.env.API_URL}/logout-account`,null,{
                                    withCredentials: true,
                                })
                                .then((response)=>{
                                    Swal.fire({ 
                                        text:"Logout Successfully , Thank you for using our services",
                                        text:response.data,
                                        showConfirmButton: false,
                                        timer: 1500,
                                        position: "top",
                                    })
                                    .then(()=>{
                                            redirect.push('/')
                                    })
                                })
    
    
                            }
                            catch(error){
                                    Swal.fire({
                                     title:'Error logging out ',
                                     text:error
                                    })
                            }
                        }
                        else
                        {

                        try{
                            //1
                            await axios.put(`${process.env.API_URL}/member-get-out-of-talkingroom`, {
                                userData: userData.accountData
                              })
                              .then(async (response)=>{
                                playSound2()
                                await socket.emit('leave-out-of-the-roomChannel',{roomUpdated:response.data , senderID:userData.accountData._id})
                              })

                              //2
                              axios.post(`${process.env.API_URL}/logout-account`,null,{
                                withCredentials: true,
                            })
                            .then((response)=>{
                                Swal.fire({
                                    text:"Logout Successfully, Thank you for using our services",
                                    text:response.data,
                                    showConfirmButton: false,
                                    timer: 1500,
                                    position: "top",
                                })
                                .then(()=>{
                                        redirect.push('/')
                                })
                            })


                        }
                        catch(error){
                                Swal.fire({
                                 title:'Error getting out of the room , and Logging out',
                                 text:error
                                })
                        }
                            
                        }
                    })
                }
              
            }
        })

    }

    return (
    <div className="flex items-center gap-1 px-2" onClick={handleSignOut}>
            <FontAwesomeIcon icon={faRightFromBracket} className="h-5 w-5"/>
            <button className="py-2 text-start w-full text-[0.8rem] font-normal">Logout</button>
    </div>
    )
}