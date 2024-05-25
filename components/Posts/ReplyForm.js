import { useEffect, useState } from "react"
import FileResizer from "react-image-file-resizer"
import Swal from "sweetalert2"
import axios from "axios"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faClose, faImage, faPlay } from "@fortawesome/free-solid-svg-icons"
import { CodeStarconnections } from "aws-sdk"
 
export default function Reply(props){
    const [replyInput,setReplyInput] = useState('')
    const [replyImage,setReplyImage] = useState(null)

     //Base64 convert Image and store in the var
     const handleFileUploadForReplyImage=(event)=>{
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
                setReplyImage(url)
            }, // Is the callBack function of the resized new image URI.
            "base64", // Is the output type of the resized new image.
          );
        }
        catch(error){
            console.log('Uploading reply image failed:' + error)
        }
     }  



     const handleSubmit= async (event)=>{
        event.preventDefault()

        const accountImage = props.accountData.accountImage
        const firstname = props.accountData.firstname
        const lastname = props.accountData.lastname
        const accountID = props.accountData.id
        const postID = props.postID
        const commentID = props.commentItem.commentID

        const dateNow = new Date()
        const currentDate = dateNow.toLocaleDateString()
        let hours = dateNow.getHours()
        const minutes = dateNow.getMinutes()
        const AMPM = hours>= 12 ? 'PM':'AM'

        //converts 24 Hours to 12 hour time
        hours = await hours % 12
        hours = await hours?hours:12; //in case that its midnight time like 00:00
        const currentTime = `${hours}:${minutes<10?`0${minutes}`:minutes} ${AMPM}`

        Swal.fire({
            text:`Would you like to reply the comment ?`,
            showCancelButton:true
        }).then((status)=>{
            if(status.isConfirmed){
                props.handleReplyLoading(true);
                axios.post(`${process.env.API_URL}/create-reply`,{
                    currentDate,currentTime,accountImage,firstname,lastname,accountID,postID,commentID,replyInput,
                    replyImage:replyImage
                
                },{
                    headers:{
                        Authorization: `Bearer ${props.tokenKey}`
                      }
                })
                    .then(async (response)=>{
                        Swal.fire({
                             text: "Successfully replied",
                             showConfirmButton: false,
                             timer: 1500,
                             position:"top"
                      }).then(()=>{
                            setReplyInput('')
                            setReplyImage(null)
                            props.handleReplyToggle();
                            props.handleRealtime(props.index,response.data)

                      })
                     })
                     .catch((error)=>{
                        console.log(error)
                        Swal.fire({
                            title: "Reply Error",
                            text: error.response.data.error
                     });
                     })
                     .finally(()=>{
                        props.handleReplyLoading(false);
                     })
            }

        })


     }


    return(
    <div className="flex flex-col gap-2">
        <div className="w-full flex flex-col">
                <div className={replyInput && replyInput.length>170?"pb-1 flex gap-2":"pb-1 flex gap-2 h-full"}>
                <div className="w-full bg-violet-600 rounded-md border border-violet-600">
                <textarea placeholder='write your opinion for replying ...' onChange={(event)=>setReplyInput(event.target.value)} rows={replyInput && replyInput.length>170?7:3} value={replyInput} className="w-full p-2 bg-stone-800  outline-none text-[0.75rem] rounded-md text-white"/>
                <div className="flex justify-between items-center px-2">
                    <div className="flex gap-3">
                    <label htmlFor="image" className="cursor-pointer px-2">
                    <FontAwesomeIcon icon={faImage} className="h-5 w-5 text-white hover:text-gray-300 active:text-gray-400"/>
                    </label>
                    <input accept="image/*" onChange={handleFileUploadForReplyImage} className="hidden" id="image" type="file"/>
                    </div>
                    <button onClick={handleSubmit} className="text-[0.9rem] p-1">
                        <FontAwesomeIcon icon={faPlay} className={replyInput || replyImage?"h-4 w-4 p-1 hover:text-gray-300 active:text-gray-300":"h-5 w-5 p-1 hidden"}/>
                    </button>
                </div>
                {replyImage &&
                    <div className="p-2 bg-gray-600 h-32 flex justify-between">
                        <img src={replyImage} className="h-28 w-28"/>
                        <FontAwesomeIcon onClick={()=>{setReplyImage(null)}} icon={faClose} className="bg-white text-black hover:bg-gray-300 cursor-pointer w-3 h-3 rounded-full p-1"/>
                    </div>
                }
               
                </div>

                </div>
        
        </div>
    </div>
    )
}