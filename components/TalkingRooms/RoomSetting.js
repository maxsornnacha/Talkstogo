import {  faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import FileResizer from "react-image-file-resizer"
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/router";
import { io } from "socket.io-client"
const socket = io(process.env.API_SOCKET_URL)
import {playSound2} from "@/modules/modules"
import LoaderPage from "../loader/LoaderPage";
import AWS from 'aws-sdk'

export default function RoomSetting({isInRoom,userData,roomYouAreIn,handleCloseRoomSettingCard,participants,admins,handleAudioInput}){

    AWS.config.update({
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        region: process.env.S3_BUCKET_REGION
      });

    const router = useRouter()
    const [isAdmin, setIsAdmin] = useState(roomYouAreIn.admins.some((admin)=>admin.participant === userData.accountData._id) )
    const [isCreator, setIsCreator] = useState(roomYouAreIn.creator.some((creator)=>creator.participant === userData.accountData._id) )
    const [whichSetting,setWhichSetting] = useState(1)
    // 1 = comment setting
    // 2 = member setting
    // 3 = talkingChannel setting

    //แก้ไขข้อมูลห้อง
    const [imageInput, setImageInput] = useState(null)
    const [nameInput,setNameInput] = useState(roomYouAreIn.roomName)
    const [descriptionInput,setDescriptionInput] = useState(roomYouAreIn.roomDescription)

    //ไล่สมาชิคออก
    const [participantSelected,setParticipantSelected] = useState(participants && participants.length > 0 ?participants[0]._id:null)
    const [adminSelected,setAdminSelected] = useState(admins && admins.length > 0 ?admins[0]._id:null)

    //เลื่อนระดับเป็นแอดมิน
    const [participantSelectedToBeAdmin,setParticipantSelectedToBeAdmin] = useState(participants && participants.length > 0 ?participants[0]._id:null)
    const [adminSelectedToBeParticipant,setAdminSelectedToBeParticipant] = useState(admins && admins.length > 0 ?admins[0]._id:null)
     //Base64 convert Image and store in the var
     const handleFileUpload=(event)=>{
        try{
        const file = event.target.files[0]
        FileResizer.imageFileResizer(
            file, // Is the file of the image which will resized.
            720, // Is the maxWidth of the resized new image.
            720, // Is the maxHeight of the resized new image.
            "JPEG", // Is the compressFormat of the resized new image.
            100, // Is the quality of the resized new image.
            0, // Is the degree of clockwise rotation to apply to uploaded image.
            (url)=>{
                setImageInput(url)
            }, // Is the callBack function of the resized new image URI.
            "base64", // Is the output type of the resized new image.
          );
        }catch(error){
            console.log(error)
        }
     }

     //แก้ไขชื่อห้อง
     const handleRoomName = (event)=>{

        if(nameInput.length <= 30 || event.nativeEvent.inputType === "deleteContentBackward"){
            setNameInput(event.target.value)
         }else{
                event.preventDefault(); 
         }
    }

    //แก้ไขรายละเอียด
    const handleRoomDescription = (event)=>{
        if(descriptionInput.length <= 65 || event.nativeEvent.inputType === "deleteContentBackward"){
        setDescriptionInput(event.target.value)
         }else{
            event.preventDefault(); 
         }
    }

     const handleChangingRoomInfo =(event)=>{
        event.preventDefault()
        Swal.fire({
            text:`Are you sure you want to edit the room '${roomYouAreIn.roomName}' ?`,
            showCancelButton: true
        })
        .then(async (status)=>{
            if(status.isConfirmed){
                if(nameInput === ''){
                    Swal.fire({
                        title:'Error Talkingroom editing',
                        text:'Please enter the room name before editing !'
                    })
                }else if(roomYouAreIn.roomName === nameInput && roomYouAreIn.roomDescription === descriptionInput && !imageInput)
                {
                    await Swal.fire({
                        text:'Successfully edited, nothing has changed',
                        showConfirmButton: false,
                        timer: 1500,
                        position:"top"
                    })
                    handleCloseRoomSettingCard()
                }
                else
                {
                    setEditRoomLoading(true);
                    axios.put(`${process.env.API_URL}/change-room-info`,{
                    roomID:roomYouAreIn._id,
                    roomName:nameInput,
                    roomDescription:descriptionInput,
                    prevRoomIcon:(roomYouAreIn.roomIcon?roomYouAreIn.roomIcon:null),
                    roomIcon:(imageInput?imageInput:roomYouAreIn.roomIcon)
                    },{
                        headers:{
                            Authorization: `Bearer ${userData.token_key}`
                          }
                    })
                    .then(async (response)=>{
                            await socket.emit('new-talkingroom-or-chatroom-created',{roomUpdated:response.data})
                            await Swal.fire({
                                text:'Successfully edited',
                                showConfirmButton: false,
                                timer: 1500,
                                position:"top"
                            })
                            handleCloseRoomSettingCard()
                    })
                    .catch((error)=>{
                         Swal.fire({
                             title:'Error Talkingroom editing',
                             text:error.response.data.error
                         })
                     })
                     .finally(()=>{
                        setEditRoomLoading(false);
                     })

                }
        
            }
        })
        .catch((error)=>{
            setEditRoomLoading(false);
            Swal.fire({
                title:'Error Talkingroom editing',
                text:error
            })

       })
     }

     const handleKickingOutParticipant = (event)=>{
        event.preventDefault()
        //participantSelected
    if(participantSelected) {
        Swal.fire({
            icon:'warning',
            text:`Are you sure you want to remove a normal member from the room ?`,
            showCancelButton: true
        })
        .then((status)=>{
            if(status.isConfirmed){
                setKickingOutLoading(true);
                axios.delete(`${process.env.API_URL}/get-out-of-the-room`,{
                    data:{userID:participantSelected , roomID:roomYouAreIn._id},
                    headers:{
                        Authorization: `Bearer ${userData.token_key}`
                      }
                })
                .then(async (response)=>{
                    await socket.emit('new-talkingroom-or-chatroom-created',{roomUpdated:response.data.roomData})
                    await socket.emit('selected-participant-deleting',{participantSelected:response.data.participantSelected})
                    await socket.emit('room-deleted-on-roomOnMain-for-userKickedOut',{roomDeleted:response.data.roomData , userKickedOut:participantSelected})
                    await Swal.fire({
                        text:'Successfully removed',
                        showConfirmButton: false,
                        timer: 1500,
                        position:"top"
                    })
                    handleCloseRoomSettingCard()
            })
            .catch((error)=>{
                 Swal.fire({
                     title:'Error normal member removing',
                     text:error.response.data.error
                 })
             })
             .finally(()=>{
                setKickingOutLoading(false);
             })
            }
        })
        .catch((error)=>{
            setKickingOutLoading(false);
             Swal.fire({
                title:'Error normal member removing',
                 text:error
             })
        })
    }else{
        setKickingOutLoading(false);
        Swal.fire({
            title:'Error normal member removing',
            text:'Please select a normal member'
        })
    }
 
     }


     const handleKickingOutAdmin = (event)=>{
        event.preventDefault()
        //participantSelected
    if(adminSelected) {
        Swal.fire({
            icon:'warning',
            text:`Are you sure you want to remove an admin from the room ?`,
            showCancelButton: true
        })
        .then((status)=>{
            if(status.isConfirmed){
                setKickingOutAdminLoading(true);
                axios.delete(`${process.env.API_URL}/get-out-of-the-room-admin`,{
                    data:{userID:adminSelected , roomID:roomYouAreIn._id},
                    headers:{
                        Authorization: `Bearer ${userData.token_key}`
                      }
                })
                .then(async (response)=>{
                    await socket.emit('new-talkingroom-or-chatroom-created',{roomUpdated:response.data.roomData})
                    await socket.emit('selected-participant-deleting',{participantSelected:response.data.participantSelected})
                    await socket.emit('room-deleted-on-roomOnMain-for-userKickedOut',{roomDeleted:response.data.roomData , userKickedOut:adminSelected})
                    await Swal.fire({
                        text:'Successfully removed',
                        showConfirmButton: false,
                        timer: 1500,
                        position:"top"
                    })
                    handleCloseRoomSettingCard()
            })
            .catch((error)=>{
                 Swal.fire({
                     title:'Error admin removing',
                     text:error.response.data.error
                 })
             })
             .finally(()=>{
                setKickingOutAdminLoading(false);
             })
            }
        })
        .catch((error)=>{
            setKickingOutAdminLoading(false);
             Swal.fire({
                 title:'Error admin removing',
                 text:error
             })

        })
    }else{
        setKickingOutAdminLoading(false);
        Swal.fire({
            title:'Error admin removing',
            text:'Please select an admin member'
        })
    }
 
     }


     const handleGetOutOfTheRoom = (event)=>{
        event.preventDefault()
        
        Swal.fire({
            icon:'warning',
            text:`Are you sure you want to quit the room '${roomYouAreIn.roomName}' ?`,
            showCancelButton: true,
            confirmButtonText:'Yes, of course !'
        })
        .then((status)=>{
            if(status.isConfirmed){
                if(isCreator){
                    Swal.fire({
                        title:'Status : Leader',
                        text:'You can not quit the room because you are the leader'
                    })
                }else{
                    if(isAdmin){
                    //ออกจากห้อง admin
                    setQuitRoomAdminLoading(true);
                    axios.delete(`${process.env.API_URL}/get-out-of-the-room-admin`,{
                        data:{userID:userData.accountData._id , roomID:roomYouAreIn._id},
                        headers:{
                            Authorization: `Bearer ${userData.token_key}`
                          }
                    })
                    .then(async (response)=>{
                        await socket.emit('new-talkingroom-or-chatroom-created',{roomUpdated:response.data.roomData})
                        await Swal.fire({
                            text:`Quitted successfully from the room '${roomYouAreIn.roomName}'`,
                            showConfirmButton: false,
                            timer: 1500,
                            position:"top"
     
                        }).then(()=>{
                            router.push('/')
                        })
                    })
                    .catch((error)=>{
                     Swal.fire({
                         title:'Error room quitting',
                         text:error.response.data.error
                     })
                    })
                    .finally(()=>{
                        setQuitRoomAdminLoading(false);
                    })
                    }else{
                        //ออกจากห้อง participant
                        setQuitRoomParticipantLoading(true); 
                        axios.delete(`${process.env.API_URL}/get-out-of-the-room`,{
                            data:{userID:userData.accountData._id , roomID:roomYouAreIn._id},
                            headers:{
                                Authorization: `Bearer ${userData.token_key}`
                              }
                        })
                        .then(async (response)=>{
                            await socket.emit('new-talkingroom-or-chatroom-created',{roomUpdated:response.data.roomData})
                            await Swal.fire({
                                text:`Quitted successfully from the room '${roomYouAreIn.roomName}'`,
                                showConfirmButton: false,
                                timer: 1500,
                                position:"top"
                            }).then(()=>{
                                router.push('/')
                            })
                        })
                        .catch((error)=>{
                         Swal.fire({
                             title:'Error room quitting',
                             text:error.response.data.error
                         })
                        })
                        .finally(()=>{
                            setQuitRoomParticipantLoading(false);
                        })
                    }
                    }
            }
        })
     }
     


     const handleDeleteTheRoom = (event)=>{
        event.preventDefault()
        let allPublic_ids = null;
        Swal.fire({
            icon:'warning',
            text:`Are you sure you want to delete the room '${roomYouAreIn.roomName}' ?`,
            showCancelButton: true
        })
        .then((status)=>{
        
            if(status.isConfirmed){
                Swal.fire({
                    text:`${roomYouAreIn.slug}`,
                    input:'text',
                    inputPlaceholder:'Please type the message above to confirm the deletion of the chat room.',
                    showCancelButton: true 
                })
                .then((result)=>{

                    if(result.isConfirmed){
                        
                    if(result.value === roomYouAreIn.slug){
                        Swal.fire({
                            text:'The confirmation message was successfully confirmed',
                            showConfirmButton: false,
                            timer: 1500,
                            position:"top"
                        })
                        .then(()=>{
                            Swal.fire({
                                icon:'warning',
                                text:`Are you really sure you want to delete this room ?!`,
                                showCancelButton: true
                            })
                            .then((status)=>{
                                const allMsg = roomYouAreIn.chatChannels.map((chatChannel)=>{
                                    return chatChannel.messages
                                }).flat();
                    
                                if(allMsg && allMsg.length > 0){
                                    //All image from the room
                                    const allImages = allMsg.filter(message => message.images.length > 0).map((message)=>{
                                        return message.images
                                    }).flat();
                                    
                                    if(allImages && allImages.length > 0){
                                       allPublic_ids = allImages.map(image => image.image.public_id);
                                    }else{
                                        allPublic_ids = null;
                                    }
                                }

                                if(status.isConfirmed) {
                                        setDeleteRoomLoading(true);
                                      //ออกจากห้อง participant
                                        axios.delete(`${process.env.API_URL}/room-deleting`,{
                                         data:{
                                            roomID:roomYouAreIn._id,
                                            roomIcon:roomYouAreIn.roomIcon,
                                            allImagesID:allPublic_ids
                                         },
                                         headers:{
                                            Authorization: `Bearer ${userData.token_key}`
                                          }
                                        })
                                        .then(async (response)=>{
                                        
                                            if(allMsg && allMsg.length > 0){
                                                
                                            //Delete Video
                                            const allVideoKeys = allMsg.filter(message => message.video).map((message)=>{
                                                return message.video.Key
                                            })
                                            //Delete File
                                            const allFileKeys = allMsg.filter(message => message.file).map((message)=>{
                                                return message.file.key
                                            })
                                            
                                            if(allVideoKeys && allVideoKeys.length > 0){
                                            await allVideoKeys.forEach((key)=>{
                                                const deleteParams = {
                                                    Bucket: process.env.S3_BUCKET_NAME_VIDEO,
                                                    Key: key
                                                };
                                                const s3 = new AWS.S3();
                                                s3.deleteObject(deleteParams).promise();
                                            })
                                            }

                                            if(allFileKeys && allFileKeys.length > 0){
                                            await allFileKeys.forEach((key)=>{
                                                const deleteParams = {
                                                    Bucket: process.env.S3_BUCKET_NAME_FILE,
                                                    Key: key
                                                };
                                                const s3 = new AWS.S3();
                                                s3.deleteObject(deleteParams).promise()
                                            })
                                            }

                                            }

                                        Swal.fire({
                                                text:`Success , '${roomYouAreIn.roomName}' has been deleted already`,
                                                showConfirmButton: false,
                                                timer: 1500,
                                                position:"top"
                                                
                                                }).then(()=>{
                                                socket.emit('room-deleting',{roomDeleted:roomYouAreIn})
                                                })
                                        })
                                        .catch((error)=>{
                                                Swal.fire({
                                                    title:'Error room deleting',
                                                    text:error
                                                })
                                        })
                                        .finally(()=>{
                                            setDeleteRoomLoading(false);
                                        })
                                }
                            })
                        })
                    }else{
                        Swal.fire({
                            icon:'Error room deleting',
                            text:'The confirmation message is not correct, please try again'
                        })
                    }
                }
                })
            }
        })
     }


     //เลื่อนระดับเป็น แอดมิน
     const handleLevelUpToAdmin = (event)=>{
        event.preventDefault();
        Swal.fire({
            text:`Would you like to promote him/her to be Admin ?`,
            showCancelButton: true
        })
        .then((status)=>{
            if(status.isConfirmed){
                setLevelUpToAdminLoading(true);
                axios.put(`${process.env.API_URL}/level-up-to-admin`,{
                    userID:participantSelectedToBeAdmin,
                    roomID:roomYouAreIn._id
                },{
                    headers:{
                        Authorization: `Bearer ${userData.token_key}`
                      }
                })
                .then(async (response)=>{
                    await socket.emit('new-talkingroom-or-chatroom-created',{roomUpdated:response.data})
                    await Swal.fire({
                        text:`Successfully promoted`,
                        showConfirmButton: false,
                        timer: 1500,
                        position:"top"
                    })
                    .then(()=>{
                            handleCloseRoomSettingCard()
                    })
                    
                })
                .catch((error)=>{
                 Swal.fire({
                     title:'Error admin promoting',
                     text:error.response.data.error
                 })
                })
                .finally(()=>{
                    setLevelUpToAdminLoading(false);
                })

            }
        })

     }

     const handleLevelDownToParticipant = (event) =>{
        event.preventDefault();
        Swal.fire({
            text:`Would you like to demote this admin to be a normal member?`,
            showCancelButton: true
        })
        .then((status)=>{
            if(status.isConfirmed){
                setLevelDownToParticipantLoading(true);
                axios.put(`${process.env.API_URL}/level-down-to-participant`,{
                    userID:adminSelectedToBeParticipant,
                    roomID:roomYouAreIn._id
                },{
                    headers:{
                        Authorization: `Bearer ${userData.token_key}`
                      }
                })
                .then(async (response)=>{
                    await socket.emit('new-talkingroom-or-chatroom-created',{roomUpdated:response.data})
                    await Swal.fire({
                        text:`Successfully demoted to be Normal member`,
                        showConfirmButton: false,
                        timer: 1500,
                        position:"top"
                    })
                    .then(()=>{
                            handleCloseRoomSettingCard()
                    })
                })
                .catch((error)=>{
                 Swal.fire({
                     title:'Error admin demoting',
                     text:error.response.data.error
                 })
                })
                .finally(()=>{
                    setLevelDownToParticipantLoading(false);
                })

            }
        })

     }

     //จัดการ audio Input 
     const [audioInput, setAudioInput] = useState([])
     const [selectedAudioInput , setSelectedAudioInput] = useState('')

     useEffect(()=>{
        navigator.mediaDevices.enumerateDevices()
        .then(async (devices)=>{
            let allAudioInput = []
            await devices.forEach((device)=>{
                if(device.kind === 'audioinput'){
                    allAudioInput.push(device)
                }
            })
            setSelectedAudioInput(allAudioInput.length>0?allAudioInput[0].deviceId:[])
            setAudioInput(allAudioInput)
          
        })
     
     },[])

     const handleChangeAudioInputDevice = (event)=>{
        event.preventDefault()
        Swal.fire({
            text:`Would you like to change the audio input device ?`,
            showCancelButton: true
        })
        .then((status)=>{
            if(status.isConfirmed && selectedAudioInput.length > 0){
   
                try{
                    handleAudioInput(selectedAudioInput)
                    Swal.fire({
                        text:'Successfully changed',
                        showConfirmButton: false,
                        timer: 1500,
                        position:"top"
                    })
                    .then(async()=>{
                        //if you are in the talking channel , you will be leaved out automatically first 
                        if(isInRoom){
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
                             title:'Error talking channel leaving out',
                             text:error.response.data.error
                            })
                        })
                        }     
                    })
                    .then(()=>{
                        handleCloseRoomSettingCard()
                    })
                }
                catch(error){
                    Swal.fire({
                        title:'Error input device changing',
                        text:error
                    })
                } 
            }
            else{
                Swal.fire({
                    title:'Error input device changing',
                    text:'There are no Audio Input Devices to change'
                })
            }
        })
     }



     //จัดการเปลี่ยนชื่อ | ลบช่องพูดคุย
     const [talkingChannelSelected , setTalkingChannelSelected] = useState(roomYouAreIn.talkingChannels[0]._id)
     const [talkingChannelSelectedName , setTalkingChannelSelectedName] = useState(roomYouAreIn.talkingChannels[0].roomName)
     const [talkingChannelName , setTalkingChannelName] = useState(roomYouAreIn.talkingChannels[0].roomName)
     const [messageConfirmInput , setMessageConfirmInput] = useState('')

     const handleSetTalkingChannelSelectedInputName = (event)=>{
        event.preventDefault()
            const result = roomYouAreIn.talkingChannels.filter((channel)=>{
                    return channel._id === event.target.value;
            })

        setTalkingChannelName(result[0].roomName) 
        setTalkingChannelSelectedName(result[0].roomName)
     }

     const handleChangeTalkingChannelName = (event)=>{
        if(talkingChannelName.length <= 30 || event.nativeEvent.inputType === "deleteContentBackward"){
            setTalkingChannelName(event.target.value)
        }else{
            event.preventDefault(); 
        }
    }

    const handleSubmitChangingTalkingChannelName = (event)=>{
        event.preventDefault()

        Swal.fire({
            text:'Would you like to edit the talking channel name ?',
            showCancelButton: true
        })
        .then((status)=>{
                if(status.isConfirmed){
                    setEditTalkingChannelLoading(true);
                    axios.put(`${process.env.API_URL}/talkingChannel-data-updated`,{
                        talkingChannelID:talkingChannelSelected,
                        talkingChannelName: talkingChannelName
                    },{
                        headers:{
                            Authorization: `Bearer ${userData.token_key}`
                        }
                    })
                    .then(async (response)=>{
                        await socket.emit('new-talkingroom-or-chatroom-created',{roomUpdated:response.data})
                        Swal.fire({
                            text:'Successfully updated',
                            showConfirmButton: false,
                            timer: 1500,
                            position:"top"
                        })
                        .then(()=>{
                            setEditTalkingChannelLoading(false); 
                        })
                        .then(()=>{
                             handleCloseRoomSettingCard()
                         })
                    })
                    .catch((error)=>{
                            Swal.fire({
                                title:"Error talking channel's data updating",
                                text:error.response.data.error
                            })
                    })
                    .finally(()=>{
                        setEditTalkingChannelLoading(false);
                    })
                }

        })
    }

    const handleDeleteData = (event)=>{
        event.preventDefault()
        Swal.fire({
            icon:'warning',
            text:'Are you sure you want to delete this talking channel ?',
            showCancelButton:true
        })
        .then((status)=>{
            if(status.isConfirmed){
                if(messageConfirmInput.trim() === talkingChannelSelectedName.trim()){
                    setDeleteTalkingChannelLoading(true);
                    axios.delete(`${process.env.API_URL}/talkingChannel-data-deleted`,{
                        data:{talkingChannelID:talkingChannelSelected  , roomData:roomYouAreIn},
                        headers:{
                            Authorization: `Bearer ${userData.token_key}`
                          }
                    })
                    .then(async (response)=>{
                        await socket.emit('new-talkingroom-or-chatroom-created',{roomUpdated:response.data})
                        await Swal.fire({
                            text:'Successfully deleted',
                            showConfirmButton: false,
                            timer: 1500,
                            position:'top'
                        })
                        .then(()=>{
                            setDeleteTalkingChannelLoading(false);
                        })
                        .then(()=>{
                            handleCloseRoomSettingCard()
                        })
                    })
                    .catch((error)=>{
                        console.log(error)
                        Swal.fire({
                            title: "Error talking channel deleting",
                            text:error.response.data.error
                        });
                    })
                    .finally(()=>{
                        setDeleteTalkingChannelLoading(false);
                    })
                }
                else{
                    setDeleteTalkingChannelLoading(false);
                    Swal.fire({
                        title:"Error talking channel deleting",
                        text:'The confirmation message is wrong, please try again',
                    })
                }
              
        }
        })
    }

    //Loading Handling
    const [editRoomLoading , setEditRoomLoading] = useState(false);
    const [kickingOutLoading , setKickingOutLoading] = useState(false);
    const [kickingOutAdminLoading,setKickingOutAdminLoading] = useState(false);
    const [quitRoomAdminLoading , setQuitRoomAdminLoading] = useState(false);
    const [quitRoomParticipationLoading , setQuitRoomParticipantLoading] = useState(false);
    const [deleteRoomLoading,setDeleteRoomLoading] = useState(false);
    const [levelUpToAdminLoading,setLevelUpToAdminLoading] = useState(false);
    const [levelDownToParticipantLoading, setLevelDownToParticipantLoading] = useState(false);

    //Talking Channel Loading Handling
    const [editTalkingChannelLoading , setEditTalkingChannelLoading] = useState(false);
    const [deleteTalkingChannelLoading, setDeleteTalkingChannelLoading] = useState(false);

    return(
    <>
    <div 
    className={`room-setting-card ${editRoomLoading || kickingOutLoading || kickingOutAdminLoading || quitRoomAdminLoading || quitRoomParticipationLoading || deleteRoomLoading || levelUpToAdminLoading || levelDownToParticipantLoading || editTalkingChannelLoading || deleteTalkingChannelLoading?'hidden':'z-20'} bg-stone-800 text-white p-2 text-[0.9rem]`}
    >
        <div className="w-full">
        <div><FontAwesomeIcon icon={faXmark} className="h-5 w-5 cursor-pointer hover:text-purple-500 active:text-gray-200" onClick={()=>handleCloseRoomSettingCard()}/></div>
        <div className="text-center text-[1rem] font-bold pb-3">Settings</div>
        <div className="text-[0.75rem] text-gray-200 pb-1">(Status : {isAdmin && <span className='text-yellow-500'>Admin</span>} {isCreator && <span className='text-purple-400'>Leader</span>} {!isAdmin && !isCreator && 'Participant'})</div>
        </div>

        <div className="flex flex-wrap w-full text-[0.8rem]">
                <button onClick={()=>setWhichSetting(1)} className={`flex-1 bg-stone-900 py-2  hover:bg-purple-600 ${whichSetting === 1 && 'border-b-2 border-purple-600'}`}>Common</button>
                {isAdmin && <button onClick={()=>setWhichSetting(2)} className={`flex-1 bg-stone-900 py-2  hover:bg-purple-600 ${whichSetting === 2 && 'border-b-2 border-purple-600'}`}>Member management</button>}
                {isCreator && <button onClick={()=>setWhichSetting(2)} className={`flex-1 bg-stone-900 py-2  hover:bg-purple-600 ${whichSetting === 2 && 'border-b-2 border-purple-600'}`}>Member management</button>}
                <button onClick={()=>setWhichSetting(3)} className={`flex-1 bg-stone-900 py-2  hover:bg-purple-600 ${whichSetting === 3 && 'border-b-2 border-purple-600'}`}>Talking channel management</button>
            </div>


        {/* common Setting */}
        {isAdmin && whichSetting === 1 &&
             <div className="w-full py-2">
             <div className="py-2 text-[0.8rem] font-semibold">
                Room editing
             </div>
             <div className="bg-stone-900 p-4 flex flex-col gap-2">
             {!imageInput ?
            <label htmlFor="room-icon" className="cursor-pointer w-20" >
                <FontAwesomeIcon icon={faPlus} className="text-white w-3 h-3 absolute rounded-full p-1 bg-purple-700 left-[70px]"/>
                {roomYouAreIn.roomIcon?
                <img id="roomIcon" src={roomYouAreIn.roomIcon.secure_url} className="w-16 h-16 rounded-full"/>
                :
                <div className="w-16 h-16 rounded-full bg-stone-800 hover:bg-gray-600 active:bg-gray-600">&nbsp;&nbsp;&nbsp;</div>
                }
            </label>
             :
             <label htmlFor="room-icon" className="cursor-pointer w-20">
                <FontAwesomeIcon icon={faPlus} className="text-white w-3 h-3 absolute rounded-full p-1 bg-purple-700 left-[70px]"/>
                <img id="roomIcon" src={imageInput} className="w-16 h-16 rounded-full"/>
             </label>
             }
             <input onChange={handleFileUpload} id="room-icon" type="file" hidden={true}/>
             <div className="flex flex-col">
                <label className="text-[0.75rem]">A new name <span className={`text-[0.65rem] ${nameInput !== ''?'text-green-500':'text-red-500'}`}>Required</span></label>
                <input value={nameInput} onChange={handleRoomName} className={`outline-none bg-stone-800 border border-gray-600 focus:border-purple-700 p-1 py-2 text-[0.8rem]`}/>
             </div>
             <div className="flex flex-col">
                <label className="text-[0.75rem]">A new description</label>
                <textarea value={descriptionInput} onChange={handleRoomDescription} row={7} className="outline-none bg-stone-800 border border-gray-600 focus:border-purple-700 p-1 py-2 text-[0.8rem]"/>
             </div>
             <div className="w-full py-2">
                <button onClick={handleChangingRoomInfo} className="bg-purple-600 hover:bg-purple-700 active:bg-purple-700 p-2 px-6 rounded-md text-[0.8rem] font-semibold">Edit</button>
             </div>
             </div> 
        </div>
        }

        {isCreator && whichSetting === 1 &&
        <div className="w-full py-2">

             <div className="py-2 text-[0.8rem] font-semibold">
                Room editing
             </div>
             <div className="bg-stone-900 p-4 flex flex-col gap-2">
             {!imageInput ?
            <label htmlFor="room-icon" className="cursor-pointer w-20" >
                <FontAwesomeIcon icon={faPlus} className="text-white w-3 h-3 absolute rounded-full p-1 bg-purple-700 left-[70px]"/>
                {roomYouAreIn.roomIcon?
                <img id="roomIcon" src={roomYouAreIn.roomIcon.secure_url} className="w-16 h-16 rounded-full"/>
                :
                <div className="w-16 h-16 rounded-full bg-stone-800 hover:bg-gray-600 active:bg-gray-600">&nbsp;&nbsp;&nbsp;</div>
                }
            </label>
             :
             <label htmlFor="room-icon" className="cursor-pointer w-20">
                <FontAwesomeIcon icon={faPlus} className="text-white w-3 h-3 absolute rounded-full p-1 bg-purple-700 left-[70px]"/>
                <img id="roomIcon" src={imageInput} className="w-16 h-16 rounded-full"/>
             </label>
             }
             <input onChange={handleFileUpload} id="room-icon" type="file" hidden={true}/>
             <div className="flex flex-col">
                <label className="text-[0.75rem]">A new name <span className={`text-[0.65rem] ${nameInput !== ''?'text-green-500':'text-red-500'}`}>Required</span></label>
                <input value={nameInput} onChange={handleRoomName} className={`outline-none bg-stone-800 border border-gray-600 focus:border-purple-700 p-1 py-2 text-[0.8rem]`}/>
             </div>
             <div className="flex flex-col">
                <label className="text-[0.75rem]">A new description</label>
                <textarea value={descriptionInput} onChange={handleRoomDescription} row={7} className="outline-none bg-stone-800 border border-gray-600 focus:border-purple-700 p-1 py-2 text-[0.8rem]"/>
             </div>
             <div className="w-full py-2">
                <button onClick={handleChangingRoomInfo} className="bg-purple-600 hover:bg-purple-700 active:bg-purple-700 p-2 px-6 rounded-md text-[0.8rem] font-semibold">Edit</button>
             </div>
             </div> 
        </div>
        }

        {/* quite the room */}
        {whichSetting === 1 &&
        <>
        <div className="w-full py-2 text-[0.8rem] font-semibold">
                Quit being a room member
        </div>
        {isAdmin &&
        <div className="bg-stone-800 w-full text-[0.75rem] font-semibold">
            <div className="w-full">
                <button  onClick={handleGetOutOfTheRoom} className="p-2 w-full bg-red-500 hover:bg-red-600 active:bg-red-600 rounded-md">Quit</button>
            </div> 
        </div>
        }
        {!isAdmin && !isCreator && 
        <div className="bg-stone-800 w-full text-[0.75rem] font-semibold">
            <div className="w-full">
                <button onClick={handleGetOutOfTheRoom} className="w-full p-2 bg-red-500 hover:bg-red-600 active:bg-red-600 rounded-md text-[0.8rem] font-semibold">Quit</button>
            </div>
        </div>
        }
         {isCreator &&
        <div className="bg-stone-800 w-full text-[0.75rem] font-semibold">
            <div className="w-full">
                <button  disabled={true} className="p-2 w-full bg-stone-900 rounded-md">You are not permitted to leave the talking room, as you are the only room leader in this talking room.</button>
            </div>
           
        </div>
        }
  
        {/* delete the room */}
        {isCreator && whichSetting === 1 &&
        <div className="w-full">
        <div className="w-full py-2 text-[0.8rem] font-semibold">
             Delete the room
        </div>
         <div className="bg-stone-800 w-full">  
            <div className="w-full">
                <button onClick={handleDeleteTheRoom} className="p-2 w-full bg-red-500 hover:bg-red-600 active:bg-red-600 rounded-md text-[0.8rem] font-semibold">Delete</button>
            </div>
        </div>
        </div>
        }
        </>
        }

        {/* Members Management */}
        {isAdmin && whichSetting === 2 &&
        <div className="w-full pt-4">
                 <div className="py-2 pb-1 text-[0.8rem] font-semibold">
                 Promoted to admin
                </div>
             <div className="bg-stone-900 flex flex-col gap-2 p-4">
                 <div className="flex gap-1 items-center text-[0.8rem]">
                 <div>Select an admin</div>
                 <div>
                 {participants && participants.length > 0 ?
                 <select className="bg-stone-700 outline-none rounded-md text-[0.8rem] py-1" onChange={(event)=>{setParticipantSelectedToBeAdmin(event.target.value);}} value={participantSelectedToBeAdmin}>
                 {participants.map((participant)=>{
                 return (
                <option value={participant._id} key={participant._id}>
                    <div>{participant.firstname} {participant.lastname}</div>
                    <div>({participant.username})</div>
                </option>
                )
                 })
                }
                 </select>
                :
                <div className="bg-gray-200 text-black p-1 rounded-md font-semibold text-[0.75rem]">
                    Normal members cannot be promoted due to no normal members in this room.
                </div>
                }
                 </div>
                 </div>
                 {participants && participants.length > 0 &&
                 <div className="py-2 w-full">
                     <button onClick={handleLevelUpToAdmin} className="p-2 bg-purple-500 hover:bg-purple-600 active:bg-purple-600 rounded-md">Promote to be admin</button>
                 </div>
                 }
            </div>


             <div className="py-2 pb-1 text-[0.8rem] font-semibold">
                    Kick normal members out of the chat room.
             </div>
             <div className="bg-stone-900 flex flex-col gap-2 p-4">
                 <div className="flex gap-1 items-center text-[0.8rem]">
                 <div>Select a normal member</div>
                 <div>
                 {participants && participants.length > 0 ?
                 <select className="bg-stone-700 outline-none rounded-md text-[0.8rem] py-1" onChange={(event)=>{setParticipantSelected(event.target.value);}} value={participantSelected}>
                 {
                 participants.map((participant)=>{
                return (
                <option value={participant._id} key={participant._id}>
                    <div>{participant.firstname} {participant.lastname}</div>
                    <div>({participant.username})</div>
                </option>
                )
                 })
                 }
                 </select>
                 :
                 <div className="bg-gray-200 text-black p-1 rounded-md font-semibold text-[0.75rem]">
                    A normal member cannot be kicked out due to no participants in this room.
                </div>
                }
                 </div>
                 </div>
                {participants && participants.length > 0 &&
                 <div className="py-2 w-full">
                     <button onClick={handleKickingOutParticipant} className="p-2 bg-red-500 hover:bg-red-600 active:bg-red-600 rounded-md text-[0.8rem] font-semibold">Kick participant out</button>
                 </div>    
                }        
                </div>

             <div>
             </div>
        </div>
        }

        
        {isCreator && whichSetting === 2 &&
        <div className="w-full pt-4">
             <div className="py-2 text-[0.8rem] font-semibold">
                    Demoting to normal member
             </div>
             <div className="bg-stone-900 flex flex-col gap-2 p-4"> 
                 <div className="flex gap-1 items-center text-[0.8rem]">
                 <div>Select an admin</div>
                 <div>
                 {admins && admins.length > 0 ?
                 <select className="bg-stone-700 outline-none rounded-md text-[0.8rem] py-1" onChange={(event)=>{setAdminSelectedToBeParticipant(event.target.value);}} value={adminSelectedToBeParticipant}>
                 {admins.map((admin)=>{
                 return (
                <option value={admin._id} key={admin._id}>
                    <div>{admin.firstname} {admin.lastname}</div>
                    <div>({admin.username})</div>
                </option>
                )
                 })
                }
                 </select>
                :
                <div className="bg-gray-200 text-black p-1 rounded-md font-semibold text-[0.75rem]">
                    Normal members cannot be demoted because there are no admins in this room.
                </div>
                }
                 </div>
                 </div>
                 {admins && admins.length > 0 &&
                 <div className="py-2 w-full">
                     <button onClick={handleLevelDownToParticipant} className="p-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-600 rounded-md text-[0.8rem] font-semibold">Demote to be participant</button>
                 </div>
                 }
            </div>

            <div className="py-2 pb-1 text-[0.8rem] font-semibold">
                 Promoted to admin
            </div>
             <div className="bg-stone-900 flex flex-col gap-2 p-4">
                 <div className="flex gap-1 items-center text-[0.8rem]">
                 <div>Select a participant</div>
                 <div>
                 {participants && participants.length > 0 ? 
                 <select className="bg-stone-700 outline-none rounded-md text-[0.8rem] py-1" onChange={(event)=>{setParticipantSelectedToBeAdmin(event.target.value);}} value={participantSelectedToBeAdmin}>
                 {participants.map((participant)=>{
                 return (
                <option value={participant._id} key={participant._id}>
                    <div>{participant.firstname} {participant.lastname}</div>
                    <div>({participant.username})</div>
                </option>
                )
                 })
                }
                 </select>
                :
                <div className="bg-gray-200 text-black p-1 rounded-md font-semibold text-[0.75rem]">
                    Normal members cannot be promoted due to no normal ones in this room.
                </div>
                }
                 </div>
                 </div>
                 {participants && participants.length > 0 &&
                 <div className="py-2 w-full">
                     <button onClick={handleLevelUpToAdmin} className="p-2 bg-purple-500 hover:bg-purple-600 active:bg-purple-600 rounded-md text-[0.8rem] font-semibold">Promote to be admin</button>
                 </div>
                 }
            </div>


             <div className="py-2 text-[0.8rem] font-semibold">
                Kick admins out of the chat room
             </div>
             <div className="bg-stone-900 flex flex-col gap-2 p-4">
                 <div className="flex gap-1 items-center text-[0.8rem]">
                 <div>Select an admin</div>
                 <div>
                 {admins && admins.length > 0 ?
                 <select className="bg-stone-700 outline-none rounded-md text-[0.8rem] py-1" onChange={(event)=>{setAdminSelected(event.target.value);}} value={adminSelected}>
                 {
                 admins.map((admin)=>{
                return (
                <option value={admin._id} key={admin._id}>
                    <div>{admin.firstname} {admin.lastname}</div>
                    <div>({admin.username})</div>
                </option>
                )
                 })
                 }
                 </select>
                 :
                 <div className="bg-gray-200 text-black p-1 rounded-md font-semibold text-[0.75rem]">
                    Admin cannot be kicked out due to no admins in this room.
                </div>
                }
                 </div>
                 </div>
                {admins && admins.length > 0 &&
                 <div className="py-2 w-full">
                     <button onClick={handleKickingOutAdmin} className="p-2 bg-red-500 hover:bg-red-600 active:bg-red-600 rounded-md text-[0.8rem] font-semibold">Kick admin out</button>
                 </div>    
                }        
            </div>

            <div className="py-2 text-[0.8rem] font-semibold">
                Kick normal members out of the chat room
             </div>
             <div className="bg-stone-900 flex flex-col gap-2 p-4">
                 <div className="flex gap-1 items-center text-[0.8rem]">
                 <div>Select a participant</div>
                 <div>
                 {participants && participants.length > 0 ?
                 <select className="bg-stone-700 outline-none rounded-md text-[0.8rem] py-1" onChange={(event)=>{setParticipantSelected(event.target.value);}} value={participantSelected}>
                 {
                 participants.map((participant)=>{
                return (
                <option value={participant._id} key={participant._id}>
                    <div>{participant.firstname} {participant.lastname}</div>
                    <div>({participant.username})</div>
                </option>
                )
                 })
                 }
                 </select>
                 :
                 <div className="bg-gray-200 text-black p-1 rounded-md font-semibold text-[0.75rem]">
                    Normal members cannot be kicked out due to no normal ones in this room.
                </div>
                }
                 </div>
                 </div>
                {participants && participants.length > 0 &&
                 <div className="py-2 w-full">
                     <button onClick={handleKickingOutParticipant} className="p-2 bg-red-500 hover:bg-red-600 active:bg-red-600 rounded-md text-[0.8rem] font-semibold">Kick participant out</button>
                 </div>    
                }        
            </div>

             <div>
             </div>
        </div>
        }


        {whichSetting === 3 && 
        <>
        {isAdmin &&
        <>
        <div className="w-full py-2 pt-4 text-[0.8rem] font-semibold">
            Talking channel Setting
        </div>
        <div className="bg-stone-900 w-full py-2 px-4 flex flex-col gap-2">
            <div className="text-[0.8rem]">
                 <label className="me-1">select a talking channel </label>
                 <select className="w-6/12 bg-stone-700 outline-none rounded-md text-[0.8rem] py-1 my-2" onChange={(event)=>{setTalkingChannelSelected(event.target.value); handleSetTalkingChannelSelectedInputName(event);}} value={talkingChannelSelected}>
                    {roomYouAreIn &&
                     roomYouAreIn.talkingChannels.map((channel,index)=>{
                        return <option value={channel._id} key={index}>{channel.roomName}</option>
                    })
                    }
                 </select>
            </div>

            <div className="text-[0.75rem] font-semibold">Information editing</div>
            <div className="bg-stone-800 outline-none rounded-md text-[0.8rem] px-2 py-4 flex flex-col gap-2">
                <div className="flex flex-col text-[0.75rem]">
                <label className="pb-2">A new name <span className={`text-[0.7rem] ${talkingChannelName.length > 0?'text-green-500':'text-red-500'}`}>Required</span></label>
                <input value={talkingChannelName} onChange={handleChangeTalkingChannelName} className="outline-none bg-stone-800 border border-gray-600 focus:border-purple-700 p-1 py-2 text-[0.8rem]"/>
                </div>
                <button onClick={handleSubmitChangingTalkingChannelName} className="p-2 mb-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-700 rounded-md font-semibold w-20 text-[0.8rem]">Edit</button>
            </div>

            <div className="text-[0.75rem] font-semibold">Delete the talking channel '{talkingChannelSelectedName}'</div>
            <div className="bg-stone-800 outline-none rounded-md text-[0.8rem] px-2 py-4 flex flex-col gap-2">
            <div className="flex flex-col">
                <label className="pb-2">Please write a message <span className="text-purple-500">{talkingChannelSelectedName}</span> to confirm deleting the talking channel</label>
                <input value={messageConfirmInput} onChange={(event)=>setMessageConfirmInput(event.target.value)} 
                className="outline-none bg-stone-800 border border-gray-600 focus:border-purple-700 p-1 py-2 text-[0.8rem]" 
                placeholder="Confirmation message"/>
                </div>
                <button onClick={handleDeleteData} className="p-2 mb-2 bg-red-500 hover:bg-red-600 active:bg-red-600 rounded-md font-semibold w-20 text-[0.8rem]">Delete</button>
            </div>
    
        </div>
        </>
        }

        {isCreator &&
        <>
        <div className="w-full py-2 pt-4 text-[0.8rem] font-semibold">
            Talking channel Setting
        </div>
        <div className="bg-stone-900 w-full py-2 px-4 flex flex-col gap-2">
            <div className="text-[0.8rem]">
                 <label className="me-1">select a talking channel </label>
                 <select className="w-6/12 bg-stone-700 outline-none rounded-md text-[0.8rem] py-1 my-2" onChange={(event)=>{setTalkingChannelSelected(event.target.value); handleSetTalkingChannelSelectedInputName(event);}} value={talkingChannelSelected}>
                    {roomYouAreIn &&
                     roomYouAreIn.talkingChannels.map((channel,index)=>{
                        return <option value={channel._id} key={index}>{channel.roomName}</option>
                    })
                    }
                 </select>
            </div>

            <div className="text-[0.75rem] font-semibold">Information editing</div>
            <div className="bg-stone-800 outline-none rounded-md text-[0.8rem] px-2 py-4 flex flex-col gap-2">
                <div className="flex flex-col text-[0.75rem]">
                <label className="pb-2">A new name <span className={`text-[0.7rem] ${talkingChannelName.length > 0?'text-green-500':'text-red-500'}`}>Required</span></label>
                <input value={talkingChannelName} onChange={handleChangeTalkingChannelName} className="outline-none bg-stone-800 border border-gray-600 focus:border-purple-700 p-1 py-2 text-[0.8rem]"/>
                </div>
                <button onClick={handleSubmitChangingTalkingChannelName} className="p-2 mb-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-700 rounded-md font-semibold w-20 text-[0.8rem]">Edit</button>
            </div>

            <div className="text-[0.75rem] font-semibold">Delete the talking channel '{talkingChannelSelectedName}'</div>
            <div className="bg-stone-800 outline-none rounded-md text-[0.8rem] px-2 py-4 flex flex-col gap-2">
            <div className="flex flex-col">
                <label className="pb-2">Please write a message <span className="text-purple-500">{talkingChannelSelectedName}</span> to confirm deleting the talking channel</label>
                <input value={messageConfirmInput} onChange={(event)=>setMessageConfirmInput(event.target.value)} 
                className="outline-none bg-stone-800 border border-gray-600 focus:border-purple-700 p-1 py-2 text-[0.8rem]" 
                placeholder="Confirmation message"/>
                </div>
                <button onClick={handleDeleteData} className="p-2 mb-2 bg-red-500 hover:bg-red-600 active:bg-red-600 rounded-md font-semibold w-20 text-[0.8rem]">Delete</button>
            </div>
    
        </div>
        </>
        }


        <div className="w-full py-2 text-[0.8rem] font-semibold">
                 Setting Audio Devices
        </div>
        <div className="bg-stone-900 w-full py-4 ps-4 px-2 flex flex-col gap-4">
             <div>
                 <label className="text-[0.8rem]">Audio Input </label>
                 {audioInput && audioInput.length > 0 ?
                 <select className="w-6/12 bg-stone-700 outline-none rounded-md text-[0.8rem] py-1 my-2" onChange={(event)=>{setSelectedAudioInput(event.target.value);}} value={selectedAudioInput}>
                    {
                     audioInput.map((device)=>{
                        return <option value={device.deviceId} key={device.deviceId}>{device.label}</option>
                    })
                    }
                 </select>
                 :
                 <div className="text-center bg-gray-200 text-black p-1 rounded-md font-semibold text-[0.75rem] my-2">
                 It cannot be changed because there is no connection to the Audio Input Devices.
                 </div>
                }
                {audioInput && audioInput.length > 0 &&
                 <div>
                <button onClick={handleChangeAudioInputDevice} className="py-2 px-6 my-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-700 rounded-md text-[0.8rem] font-semibold">Change</button>
                </div>
                }
             </div>
        </div>
        </>
        }
    
    </div>
    <div>

    </div>
    {editRoomLoading || kickingOutLoading || kickingOutAdminLoading || quitRoomAdminLoading || quitRoomParticipationLoading || deleteRoomLoading || levelUpToAdminLoading || levelDownToParticipantLoading || editTalkingChannelLoading || deleteTalkingChannelLoading ?
     <div className="loader-page-for-cover z-50 p-2 px-3 text-white shadow-md overflow-y-auto">
     <LoaderPage/>
    </div>
    :
    <></>
    }
    </>
    )
}