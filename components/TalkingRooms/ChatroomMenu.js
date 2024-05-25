import { faArrowLeft, faL, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { io } from 'socket.io-client'
import LoaderPage from "../loader/LoaderPage";
const socket = io(process.env.API_SOCKET_URL)
import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid';

export default function ChatroomMenu({chatroom,handleCloseChatroomMenu,closeMobileChatboxToggleInSetting , isMobile , roomYouAreIn,userData}){
    
    AWS.config.update({
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        region: process.env.S3_BUCKET_REGION
    });
    
    
    const [nameInput,setNameInput] = useState(chatroom.roomName)
    const [messageConfirmInput,setMessageConfirmInput] = useState('')

    const [editLoading , setEditLoading] = useState(false);
    const [deleteLoading , setDeleteLoading] = useState(false);

    const handleChangeChatroomName = (event)=>{
        if(nameInput.length <= 30 || event.nativeEvent.inputType === "deleteContentBackward"){
            setNameInput(event.target.value)
        }else{
            event.preventDefault(); 
        }
    }

    const handleUpdateData = (event)=>{
        event.preventDefault()
        Swal.fire({
            text:'Would you like to edit this chat channel ?',
            showCancelButton:true
        })
        .then((status)=>{
            if(status.isConfirmed){
                setEditLoading(true);
                if(nameInput === ''){
                    setEditLoading(false);
                    Swal.fire({
                        title:"Error chat-channel editing",
                        text:'Please enter the channel name before editing',
                    })
                }else{
                    axios.put(`${process.env.API_URL}/chatroom-data-updated`,{chatroom , nameInput},{
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
                        handleCloseChatroomMenu(false)
                    })
                    .catch((error)=>{
                        console.log(error)
                        Swal.fire({
                            title: "Error chat-channel editing",
                            text:error.response.data.error
                     });
                    })
                    .finally(()=>{
                        setEditLoading(false);
                    })
                }
              
        }
        })
    }

    const handleDeleteData = (event)=>{
        event.preventDefault()
        Swal.fire({
            icon:'warning',
            text:'Are you sure you want to delete this chat channel ?',
            confirmButtonText:'Yes, delete it !',
            showCancelButton:true
        })
        .then((status)=>{
            if(status.isConfirmed){
                setDeleteLoading(true);
                if(messageConfirmInput.trim() === chatroom.roomName.trim()){
                    axios.delete(`${process.env.API_URL}/chatroom-data-deleted`,{
                        data:{chatroom  , roomData:roomYouAreIn},
                        headers:{
                            Authorization: `Bearer ${userData.token_key}`
                          }
                    })
                    .then(async (response)=>{
                        const msgVideo = chatroom.messages.filter(message=>message.video).map(message=>message.video);
                        if(msgVideo && msgVideo.length > 0){
                        const s3 = new AWS.S3();
                        await msgVideo.forEach(async (element) => {
                            const deleteParams = {
                                Bucket: process.env.S3_BUCKET_NAME_VIDEO,
                                Key: element.Key
                            };
                            s3.deleteObject(deleteParams).promise();
                        });
                        }

                        await socket.emit('new-talkingroom-or-chatroom-created',{roomUpdated:response.data})
                        await Swal.fire({
                            text:'Successfully deleted',
                            showConfirmButton: false,
                            timer: 1500,
                            position:"top"
                        })
                        handleCloseChatroomMenu(false)
                        if(isMobile){
                            closeMobileChatboxToggleInSetting()
                        }
                    })
                    .catch((error)=>{
                        console.log(error)
                        Swal.fire({
                            title: "Error chat-channel deleting",
                            text:error.response.data.error
                     });
                    })
                    .finally(()=>{
                        setDeleteLoading(false);
                    })
                }
                else{
                    setDeleteLoading(false);
                    Swal.fire({
                        title:"Error chat-channel deleting",
                        text:'The confirmation message is incorrect.',
                    })
                }
              
        }
        })
    }



    return (
    <>
    <div className={`text-[0.9rem] ${!editLoading && !deleteLoading && 'z-20'} bg-stone-800 text-white setting-card p-2`}>
        <div className="w-full">
        <FontAwesomeIcon onClick={()=>{handleCloseChatroomMenu(false)}} icon={faArrowLeft} className="h-5 w-5 cursor-pointer fixed hover:text-purple-500"/>
        <div className="text-center text-[1rem] font-bold">Chat channel Settings</div>
        </div>

        <div className="my-2 mt-4 w-full text-[0.8rem] font-semibold">Information editing</div>
        <div className="w-full bg-stone-900 py-5"> 
            <div className="flex flex-col mx-4">
                <label className="text-[0.8rem] mb-2">A new name <span className={`${nameInput === ''?'text-red-500':'text-green-500'} text-[0.7rem]`}>Require</span></label>
                <input type="text" value={nameInput}  
                onChange={handleChangeChatroomName}
                className={`outline-none bg-stone-800 border border-gray-600 focus:border-purple-700 p-1 py-2 text-[0.8rem]`}
                />
            </div>
            <div className="w-full text-center">
            <button onClick={handleUpdateData} className="mt-4 bg-purple-700 hover:bg-purple-800 active:bg-purple-800 py-2 px-6 rounded-md">Edit</button>
             </div>
        </div>

        <div className="my-2 w-full text-[0.8rem] font-semibold">Delete the chat channel '{chatroom.roomName}'</div>
        <div className="w-full bg-stone-900 py-5"> 
            <div className="flex flex-col mx-4">
                <label className="text-[0.8rem] mb-2">Please write a message <span className="text-purple-500">{chatroom.roomName}</span> to confirm deleting the chat channel</label>
                <input type="text" 
                value={messageConfirmInput}
                onChange={(event)=>setMessageConfirmInput(event.target.value)}
                placeholder="Confirmation message "
                className="outline-none bg-stone-800 border border-gray-600 focus:border-purple-700 p-1 py-2 text-[0.8rem]"
                />
            </div>
            <div className="w-full text-center">
            <button onClick={handleDeleteData} className="mt-4 bg-stone-500 hover:bg-stone-600 active:bg-stone-600 py-2 px-4 rounded-md">Delete</button>
             </div>
        </div>
    </div>
    {editLoading &&
         <div className="loader-page-for-cover z-50 p-2 px-3 text-white shadow-md overflow-y-auto">
         <LoaderPage/>
        </div>  
    }
    {deleteLoading &&
         <div className="loader-page-for-cover z-50 p-2 px-3 text-white shadow-md overflow-y-auto">
         <LoaderPage/>
        </div>  
    }
    </>
    )
}