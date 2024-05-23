import {  faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { io } from 'socket.io-client'
import LoaderPage from "../loader/LoaderPage";
const socket = io(process.env.API_SOCKET_URL)


export default function CreateTalkingroomCard({userData,roomYouAreIn,handleCloseCreateTalkingroomCard}){
    const [roomtalkingnameInput,setRoomtalkingnameInput] = useState('')
    const [loading , setLoading] = useState(false);

    const handleTalkingroomName = (event)=>{
        if(roomtalkingnameInput.length <= 30 || event.nativeEvent.inputType === "deleteContentBackward"){
            setRoomtalkingnameInput(event.target.value)
        }else{
            event.preventDefault(); 
        }
    }

    const handleSubmit=(event)=>{
        event.preventDefault()

        Swal.fire({
            text:`Would you like to create a new talking channel ?`,
            showCancelButton:true
        }).then((status)=>{
            if(status.isConfirmed){
                if(roomtalkingnameInput === ''){
                    Swal.fire({
                        title: "Error chat-channel creating",
                        text:'Please enter the talking channel name before creating !'
                 });
                }
                else{
                    setLoading(true);
                    axios.post(`${process.env.API_URL}/create-talkingroom-in-talkingroom`,{roomtalkingname:roomtalkingnameInput , roomID:roomYouAreIn._id},{
                        headers:{
                            Authorization: `Bearer ${userData.token_key}`
                        }
                    })
                    .then(async (response)=>{
                        await socket.emit('new-talkingroom-or-chatroom-created',{roomUpdated:response.data})
                        await Swal.fire({
                            text:'Successfully created',
                            showConfirmButton: false,
                            timer: 1500,
                            position:"top"
                        })
                        handleCloseCreateTalkingroomCard(false)
                    })
                    .catch((error)=>{
                        console.log(error)
                        Swal.fire({
                            title: "Error chat-channel creating",
                            text:error.response.data.error
                     });
                    })
                    .finally(()=>{
                        setLoading(false);
                    })
                }
            
            }
        }).catch((error)=>{
            setLoading(false);
            console.log(error)
            Swal.fire({
                title: "Error chat-channel creating",
                text:error.response.data.error
         });
         })

    }

    return (
    <>
    <div className={`create-chatroom-talkingroom-card ${!loading && 'z-20'} bg-stone-800 text-white`}>
           <div className="flex flex-col w-full">
            <div className="text-start fixed px-2"><FontAwesomeIcon onClick={()=>{handleCloseCreateTalkingroomCard(false)}} icon={faArrowLeft} className="w-5 h-5 cursor-pointer hover:text-purple-500"/></div>
            <div className="text-center text-[1rem] font-bold">Creating a talking channel</div>

            <div className="py-10 flex flex-col mx-2">
                <label className="text-[0.8rem] pb-2">Name <span className={`text-[0.7rem] ${roomtalkingnameInput === ''?'text-red-500':'text-green-500'}`}>Required</span></label>
                <input value={roomtalkingnameInput} onChange={handleTalkingroomName} placeholder="the talking channel's name" type="text" className="outline-none bg-stone-800 border border-gray-600 focus:border-purple-700 p-1 py-2 text-[0.8rem]"/>
            </div>

            <div className="mx-2">
                <button onClick={handleSubmit} className="bg-stone-900 hover:bg-gray-600 py-2 w-full text-[0.9rem] font-semibold rounded-sm">Create</button>
            </div>
          </div>    
    </div>
    {loading &&
    <div className="loader-page-for-cover z-50 p-2 px-3 text-white shadow-md overflow-y-auto">
    <LoaderPage/>
   </div>
    }
    </>
    )
}