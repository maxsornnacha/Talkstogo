import { useState } from "react";
import FileResizer from 'react-image-file-resizer'
import axios from "axios";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCamera, faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import LoaderPage from "../loader/LoaderPage";

export default function CreatingRoom({handleCreatingRoomClose,userData}){
    const router = useRouter()
    const [loading , setLoading] = useState(false);
    const [roomData,setRoomData] = useState({
        roomName : '',
        roomDescription : ''
    })

    const [roomIcon,setRoomIcon] = useState(null)

    const {roomName,roomDescription} = roomData

    const handleRoomName = (event)=>{

        if(roomName.length <= 30 || event.nativeEvent.inputType === "deleteContentBackward"){
    
        setRoomData((prev)=>{
            return ({
                roomName:event.target.value,
                roomDescription:prev.roomDescription,
            })
        })
         }else{
                event.preventDefault(); 
         }
    }

    
    const handleRoomDescription = (event)=>{
        if(roomDescription.length <= 65 || event.nativeEvent.inputType === "deleteContentBackward"){
        setRoomData((prev)=>{
            return ({
                roomName:prev.roomName,
                roomDescription:event.target.value,
            })
        })
         }else{
            event.preventDefault(); 
         }
    }

     //Base64 convert Image and store in the var
     const handleFileUpload=(event)=>{
        const file = event.target.files[0]
        FileResizer.imageFileResizer(
            file, // Is the file of the image which will resized.
            720, // Is the maxWidth of the resized new image.
            720, // Is the maxHeight of the resized new image.
            "JPEG", // Is the compressFormat of the resized new image.
            100, // Is the quality of the resized new image.
            0, // Is the degree of clockwise rotation to apply to uploaded image.
            (url)=>{
                setRoomIcon(url)
            }, // Is the callBack function of the resized new image URI.
            "base64", // Is the output type of the resized new image.
          );
     }

    const handleSubmit=(event)=>{
        event.preventDefault()

        Swal.fire({
            text:`Would you like to create a new room ?`,
            showCancelButton:true
        }).then((status)=>{
            if(status.isConfirmed){
                if(roomName === ''){
                    Swal.fire({
                       title:'Unsuccessfully room created',
                       text: 'Please write a room name before creating'
                 });
                }
                else{
                    setLoading(true);
                    axios.post(`${process.env.API_URL}/create-talkingroom`,{roomName,roomDescription,roomIcon,userID:userData.accountData._id},{
                        headers:{
                            Authorization: `Bearer ${userData.token_key}`
                          }
                    })
                    .then(async (response)=>{
                        handleCreatingRoomClose(false)
                        Swal.fire({
                             text: "Successfully created",
                             showConfirmButton: false,
                             timer: 1500,
                             position:"top"
                      })
                      .then(()=>{
                        setLoading(false);
                      })
                      .then(()=>{
                        Swal.fire({
                            text: "We are redirecting you to the new room ...",
                            showConfirmButton: false,
                            timer: 1500,
                            position:"top"
                        })
                      })
                      .then(async ()=>{ 
                           await router.push(`/rooms/talking-room/${response.data.slug}`)
                            await window.location.reload();
                        })
                     })
                     .catch((error)=>{
                        console.log(error)
                        Swal.fire({
                            title: "Error Talkingroom creating",
                            text:error.response.data.error
                     });
                     })
                     .finally(()=>{
                        setLoading(false);
                     })
                }
            }
        })

    }

    


    return(
    <>
    {!loading &&
    <div className={`creating-room z-20 bg-stone-800 text-white px-4`}>
        <div className="w-full flex flex-col pb-2">
        <FontAwesomeIcon icon={faArrowLeft} onClick={()=>{handleCreatingRoomClose(false);}} className="cursor-pointer w-5 h-5 hover:text-purple-500 fixed" />
        <div className="text-center  w-full text-[1.1rem] font-bold">Creating a Talkingroom</div>
        </div>

        <div className="text-center mt-4 text-[0.8rem]">
                Establish a new talkingroom identity with a name. The description and icon can be changed later.
        </div>
        
        <div className="flex flex-col items-center w-full">
            {roomIcon ?
            <label htmlFor="room-icon" className="cursor-pointer flex flex-col items-center ">
                <img src={roomIcon} className="h-28 w-28 m-4 rounded-full"/>
            </label>
            :
            <label htmlFor="room-icon" className="bg-gray-200  text-gray-900 hover:text-white hover:border-white hover:bg-purple-600 cursor-pointer flex flex-col items-center border border-gray-900 border-dashed m-4 p-5 rounded-full">
                    <FontAwesomeIcon icon={faCamera} className="w-7 h-7 p-1"/>
                    <div className="font-semibold">UPLOAD</div> 
            </label>
            }
            <input accept="image/*" onChange={handleFileUpload}  id="room-icon" className="hidden" type="file"/>
        </div>

        <div className="flex flex-col gap-1 mb-4 w-full">
            <label className="text-[0.75rem]">Name <span className={`${roomName === ''?'text-red-500':'text-green-500'}`}>Required</span></label>
            <input onChange={handleRoomName} value={roomName} type="text" className={`border text-[0.75rem] py-2 bg-stone-800  border-gray-600 focus:border-purple-700 outline-none  p-1 rounded-sm`}/>
        </div>

        <div className="flex flex-col gap-1 mb-4 w-full">
            <label className="text-[0.75rem]">Description</label>
            <textarea onChange={handleRoomDescription} value={roomDescription} type="text" rows={3} className="text-[0.75rem] py-2 bg-stone-800 border border-gray-600 focus:border-purple-700 outline-none  p-1 rounded-sm"/>
        </div>

        <div className="flex justify-between w-full ">
            <button onClick={handleSubmit} className="bg-stone-900 text-white hover:bg-gray-600 w-full py-3 rounded-sm text-[0.9rem] font-bold">Creating a room</button>
        </div>
    </div>
    }
    {loading &&
    <div className="loader-page-for-cover z-50 p-2 px-3 text-white shadow-md overflow-y-auto">
    <LoaderPage/>
    </div>
    }

    </>
    )
}