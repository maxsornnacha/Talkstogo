import { faArrowLeft, faCamera, faCaretRight, faClose, faFileArchive, faImage, faPaperclip, faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import axios from "axios"
import Swal from "sweetalert2";
import { io } from "socket.io-client"
const socket = io(process.env.API_SOCKET_URL)
import FileResizer from "react-image-file-resizer"
import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid';
import { faFileLines, faFolder } from "@fortawesome/free-regular-svg-icons";


export default function Messages({chatroom , userData , updateToBottom}){

    AWS.config.update({
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        region: process.env.S3_BUCKET_REGION
    });

      //Base64 convert Image and store in the var
      const handleImageUpload=(event)=>{
        try{
          event.preventDefault();
          const file = event.target.files[0]
          FileResizer.imageFileResizer(
              file, // Is the file of the image which will resized.
              720, // Is the maxWidth of the resized new image.
              720, // Is the maxHeight of the resized new image.
              "JPEG", // Is the compressFormat of the resized new image.
              100, // Is the quality of the resized new image.
              0, // Is the degree of clockwise rotation to apply to uploaded image.
              (url)=>{
                    setImageInput((prev)=>{
                        return  [...prev, url];
                    })
              }, // Is the callBack function of the resized new image URI.
              "base64", // Is the output type of the resized new image.
            );  
          }catch(error){
            console.log('Error uploading image :', error)
            Swal.fire({
                icon: 'error',
                text: error
            })
          }
       }

       //Cancel image
       const handleCancelImage = (imageCanceled) =>{
            setImageInput((prev)=>{
                return  prev.filter((item)=>{
                    return item!== imageCanceled
                })
            })

       }

       //Handle Video Input Events
       const handleVideoUpload = (event)=>{
            try{
                event.preventDefault()
                const videoFile = event.target.files[0]
                if (videoFile) {
                    const videoURL = URL.createObjectURL(videoFile)
                // Check the video duration after the video element is loaded
                const videoElement = document.createElement('video');
                videoElement.src = videoURL
                videoElement.onloadedmetadata = () => {
                    const duration = videoElement.duration;
                    //if duration is more than 60 seconds
                    if (duration > 60) {
                        Swal.fire({
                            icon: 'error',
                            text: 'Video duration should be less than 1 minute'
                        })
                        setVideoInput(null);
                        setVideoInputDisplay(null);
                    }else{
                        setVideoInputDisplay(videoURL);
                        setVideoInput(videoFile);
                    }
                }
                }
            }
            catch(error){
                console.log('Error uploading video :', error)
                Swal.fire({
                    icon: 'error',
                    text: error
                })
            }
       }


       //Handle File Upload Event
       const handleFileUpload = (event) =>{
        try{
            event.preventDefault();
            const MAX_FILE_SIZE_MB = 25;
            const anyFile = event.target.files[0]
            if (anyFile) {
                if(anyFile.size > MAX_FILE_SIZE_MB * 1024 * 1024){
                    Swal.fire({
                        icon: 'error',
                        text: `File size exceeds the maximum limit of ${MAX_FILE_SIZE_MB} MB`
                    })
                }else{
                    setFileInput(anyFile)
                }
            }

        }catch(error){
            console.log('Error uploading file :', error)
                Swal.fire({
                    icon: 'error',
                    text: error
            })
        }
       }

    
      //Handle sending messages in section 3
      const [insertToggle,setInsertToggle] =useState(false)
      const [imageInputToggle,setImageInputToggle] =useState(false)
      const [videoInputToggle,setVideoInputToggle] =useState(false);
      const [fileInputToggle , setFileInputToggle] =useState(false);

      //Iamge
      const [messageInput, setMessageInput] = useState('')
      const [imageInput, setImageInput] = useState([])
      //video
      const [videoInput, setVideoInput] = useState(null);
      const [videoInputDisplay,setVideoInputDisplay] = useState(null)
      //file
      const [fileInput , setFileInput] = useState(null);

      const [sendMsgLoading ,setSendMsgLoading] = useState(false);
      
      const handleSendMessage = async (event)=>{
        event.preventDefault();
        setSendMsgLoading(true);

        //Store video on AWS S3 cloud storage
        if(videoInput){
            const s3 = new AWS.S3();
            const params = {
                Bucket: process.env.S3_BUCKET_NAME_VIDEO,
                Key: uuidv4().toString(),
                Body: videoInput,
                ContentType: videoInput.type,
                ACL: 'public-read' // or 'private'
            };

            await s3.upload(params, (error, data) => {
                if (error) {
                  console.error('Error uploading video:', error);
                    setVideoInput(null)
                    Swal.fire({
                        icon: 'error',
                        text: error
                    })
                } else {
                  // Store the S3 URL (data.Location) in the database
                 axios.post(`${process.env.API_URL}/messages-from-chatroom-in-room-sending`,{
                    chatroomID:chatroom._id,
                    senderData:userData.accountData,
                    content:messageInput , 
                    images:imageInput,
                    video:data,
                    file:fileInput
                },{
                    headers:{
                        Authorization: `Bearer ${userData.token_key}`
                      }
                })
                .then(async (response)=>{
                    await socket.emit('new-talkingroom-or-chatroom-created',{roomUpdated:response.data})
                    setMessageInput('')
                    setImageInput([])
                    setImageInputToggle(false)
                    setInsertToggle(false)
                    updateToBottom()
                    setVideoInput(null)
                    setVideoInputDisplay(null)
                    setVideoInputToggle(false)
                    setFileInput(null)
                    setFileInputToggle(false)
                    Swal.fire({
                        text:'Video uploaded successfully',
                        showConfirmButton: false,
                        timer: 1500,
                        position:"top"
                    })
                })
                .catch((error)=>{
                    Swal.fire({
                        title:'Error message sending in Talkingroom',
                        text:error.response.data.error
                    })
                 })
                 .finally(()=>{
                    setSendMsgLoading(false);
                 })
                }
            })
 
    
        }
        else if(fileInput){
            const s3 = new AWS.S3();
            const params = {
                Bucket: process.env.S3_BUCKET_NAME_FILE,
                Key: `${uuidv4()}-${Date.now()}`,
                Body: fileInput,
                ContentType: fileInput.type,
                ACL: 'public-read' // or 'private'
            };

            await s3.upload(params, (error, data) => {
                if (error) {
                  console.error('Error uploading file:', error);
                  setFileInput(null)
                  Swal.fire({
                    icon: 'error',
                    text: error
                  })
                } else {
                  // Store the S3 key (data.key) in the database
                 axios.post(`${process.env.API_URL}/messages-from-chatroom-in-room-sending`,{
                    chatroomID:chatroom._id,
                    senderData:userData.accountData,
                    content:messageInput , 
                    images:imageInput,
                    video:videoInput,
                    file:{
                        name: fileInput.name,
                        key: data.Key, 
                        type: fileInput.type?fileInput.type:'Not defined',
                        size: fileInput.size
                    }
                },{
                    headers:{
                        Authorization: `Bearer ${userData.token_key}`
                      }
                })
                .then(async (response)=>{
                    await socket.emit('new-talkingroom-or-chatroom-created',{roomUpdated:response.data})
                    setMessageInput('')
                    setImageInput([])
                    setImageInputToggle(false)
                    setInsertToggle(false)
                    updateToBottom()
                    setVideoInput(null)
                    setVideoInputDisplay(null)
                    setVideoInputToggle(false)
                    setFileInput(null)
                    setFileInputToggle(false)
                    Swal.fire({
                        text:'File uploaded successfully',
                        showConfirmButton: false,
                        timer: 1500,
                        position:"top"
                    })
                })
                .catch((error)=>{
                    Swal.fire({
                        title:'Error message sending in Talkingroom',
                        text:error.response.data.error
                    })
                 })
                 .finally(()=>{
                    setSendMsgLoading(false);
                 })
                }
            })
        }
        else{
        axios.post(`${process.env.API_URL}/messages-from-chatroom-in-room-sending`,{
            chatroomID:chatroom._id,
            senderData:userData.accountData,
            content:messageInput , 
            images:imageInput,
            video:videoInput,
            file:fileInput
        },{
            headers:{
                Authorization: `Bearer ${userData.token_key}`
              }
        })
        .then(async (response)=>{
            await socket.emit('new-talkingroom-or-chatroom-created',{roomUpdated:response.data})
            setMessageInput('')
            setImageInput([])
            setImageInputToggle(false)
            setInsertToggle(false)
            updateToBottom()
            setVideoInput(null)
            setVideoInputDisplay(null)
            setVideoInputToggle(false)
            setFileInput(null)
            setFileInputToggle(false)
        })
        .catch((error)=>{
            Swal.fire({
                title:'Error message sending in Talkingroom',
                text:error.response.data.error
            })
         })
         .finally(()=>{
            setSendMsgLoading(false);
         })
        }
        
      }

    return (
    <>
    {chatroom &&
    <div className="h-[50px] bg-stone-800 border border-gray-600 w-full flex gap-2 items-center p-2 rounded-lg relative">
        {insertToggle && !sendMsgLoading &&
        <div className="bg-stone-900 text-white text-[0.8rem] w-full h-32 absolute bottom-[49px] left-0  p-2">
             <div className="flex justify-between mb-5">
             <div>Insert</div>
            <FontAwesomeIcon onClick={()=>{setInsertToggle(false); setImageInputToggle(false); setVideoInputToggle(false); setFileInputToggle(false);}} icon={faXmark} className="cursor-pointer rounded-full text-gray-900 bg-gray-200 hover:bg-purple-600 hover:text-white p-1 w-3 h-3"/>
             </div>

             <div className="flex gap-3">
                <div onClick={()=>{setImageInputToggle(true);}} className="flex flex-col justify-center items-center cursor-pointer hover:text-purple-400">
                <FontAwesomeIcon icon={faImage} className="h-8 w-8"/>
                <div className="text-[0.7rem]">Image file</div>
                </div>
            
                <div onClick={()=>{setVideoInputToggle(true);}} className="flex flex-col justify-center items-center cursor-pointer hover:text-purple-400">
                <FontAwesomeIcon icon={faCamera} className="h-8 w-8"/>
                <div className="text-[0.7rem]">Video file</div>
                </div>

                <div onClick={()=>{setFileInputToggle(true);}} className="flex flex-col justify-center items-center cursor-pointer hover:text-purple-400">
                <FontAwesomeIcon icon={faFileArchive} className="h-8 w-8"/>
                <div className="text-[0.8rem]">file</div>
                </div>

             </div>
        </div>
        }

        {imageInputToggle && !sendMsgLoading &&
            <div className="bg-stone-900 text-white text-[0.8rem] w-full h-auto absolute bottom-[50px] left-0 p-2">
                <div className="flex gap-3  items-center">
                <FontAwesomeIcon onClick={() => {setImageInputToggle(false); setImageInput([])}} icon={faArrowLeft} className="cursor-pointer text-gray-200 hover:text-purple-500 active:text-purple-500 w-4 h-4"/>
                <div>Image insert <span className="text-[0.8rem] text-yellow-500">(Maximum : 4 images)</span></div>
                </div>
 
                <div className="flex gap-4 overflow-x-auto py-4" >
        
                    <label htmlFor="image-input"className={`${imageInput.length >= 4?'hidden':'flex'} relative flex-col justify-center items-center cursor-pointer text-gray-200`}>
                     <div className="bg-stone-800 hover:bg-purple-600 hover:text-white w-32 h-32 flex justify-center items-center">
                    <FontAwesomeIcon icon={faPlus} className="h-8 w-8"/>
                    </div>
                    </label>
                    <input accept="image/*" onChange={handleImageUpload} type="file" hidden={true} id="image-input"/>
                    

                    {imageInput.length !== 0 &&
                        imageInput.map((image, index) => (
                        <div key={index} className="relative">
                        <FontAwesomeIcon onClick={()=>{handleCancelImage(image)}}  icon={faXmark} className="absolute left-28 bottom-[115px] cursor-pointer text-gray-900 rounded-full p-1 bg-gray-200 hover:bg-purple-600 hover:text-white active:bg-purple-600 active:text-white w-3 h-3"/>  
                        <img src={image} alt={`image_${index}`} className="min-h-32 h-32 min-w-32 w-32"/>
                        </div>
                        ))
                    }

                </div>
            </div>
        }

        {videoInputToggle && !sendMsgLoading &&
        <div className={`bg-stone-900 text-white text-[0.8rem] w-full ${videoInputDisplay?'min-h-56 h-auto':'h-48'} absolute bottom-[50px] left-0 p-2`}>
                <div className="flex gap-3  items-center">
                <FontAwesomeIcon onClick={() => {setVideoInputToggle(false); setVideoInput(null); setVideoInputDisplay(null);}} icon={faArrowLeft} className="cursor-pointer text-gray-200 hover:text-purple-500 active:text-purple-500 w-4 h-4"/>
                <div>Video insert <span className="text-yellow-500">(Maximum duration : 1 minute)</span></div>
                </div>

                {!videoInputDisplay &&
                <div className="flex justify-center pt-3">
                <label htmlFor="video-input"className={`${imageInput.length >= 4?'hidden':'flex'} relative flex-col justify-center items-center cursor-pointer text-gray-200`}>
                     <div className="bg-stone-800 rounded-full hover:bg-purple-600 hover:text-white w-32 h-32 flex justify-center items-center">
                    <FontAwesomeIcon icon={faPlus} className="h-8 w-8"/>
                    </div>
                    </label>
                    <input accept="video/*" onChange={handleVideoUpload} type="file" hidden={true} id="video-input"/>   
                </div>
                }


                {videoInputDisplay &&
                <div className="pt-4 flex justify-center relative bg-stone-800">
                 <FontAwesomeIcon onClick={()=>{setVideoInput(null); setVideoInputDisplay(null);}} icon={faClose} className="w-3 h-3 absolute top-2 right-0 rounded-full p-1 me-2 cursor-pointer hover:bg-violet-600 hover:text-white bg-white text-black"/>
                 <video controls height={100} width={300} poster='https://res.cloudinary.com/dakcwd8ki/image/upload/v1716363446/u9xnotpuzkxbwfwlek2d.jpg' className="bg-stonee-700">
                 <source src={videoInputDisplay} type="video/mp4" />
                 Your browser does not support the video tag.
                </video>
               </div>
                }
        </div>
        }

        {fileInputToggle && !sendMsgLoading &&
        <div className="bg-stone-900 text-white text-[0.8rem] w-full h-44 absolute bottom-[50px] left-0 p-2">
            <div className="flex gap-3  items-center">
                <FontAwesomeIcon onClick={() => {setFileInputToggle(false); setFileInput(null);}} icon={faArrowLeft} className="cursor-pointer text-gray-200 hover:text-purple-500 active:text-purple-500 w-4 h-4"/>
                <div>File insert <span className="text-[0.8rem] text-yellow-500">(Maximum : 25 MB)</span></div>
            </div>

            {!fileInput &&
            <div>
                <div className="flex justify-center pt-3">
                <label htmlFor="file-input"className={`${imageInput.length >= 4?'hidden':'flex'} relative flex-col justify-center items-center cursor-pointer text-gray-200`}>
                     <div className="bg-stone-800 flex-col gap-1 rounded-full hover:bg-purple-600 hover:text-white w-32 h-32 flex justify-center items-center">
                    <FontAwesomeIcon icon={faFolder} className="h-8 w-8"/>
                    <div className="font-semibold">Upload</div>
                    </div>
                </label>
                <input onChange={handleFileUpload} type="file" hidden={true} id="file-input"/>   
                </div>
            </div>
            }

            {fileInput &&
            <div className="flex justify-center pt-3 mt-2 relative bg-stone-800 h-32">
                <FontAwesomeIcon onClick={()=>{setFileInput(null);}} icon={faClose} className="w-3 h-3 absolute top-1 right-0 rounded-full p-1 me-2 cursor-pointer hover:bg-violet-600 hover:text-white bg-white text-black"/>
                <div className="h-24 w-auto px-2 rounded-md bg-stone-700 text-white flex items-center justify-center">
                <FontAwesomeIcon icon={faFileLines} className="h-10 w-10"/>
                <div className="ps-2">
                    <div>Name : {fileInput.name.length > 20?fileInput.name.slice(0,20)+'...':fileInput.name}</div>
                    <div>Size : {fileInput.size/(1024 * 1024) > 0.99?((fileInput.size/(1024 * 1024)).toFixed(4)+' MB'):((fileInput.size/1024).toFixed(4)+' KB')}</div>
                    <div>Type : {fileInput.type?fileInput.type:'Not identify'}</div>
                </div>
                </div>
            </div>
            }
        
        </div>
        }

        {!sendMsgLoading &&
        <>
        <FontAwesomeIcon onClick={()=>{setInsertToggle(insertToggle?false:true); setImageInputToggle(false)}} icon={faPlus} className={`cursor-pointer hover:bg-gray-200  ${insertToggle?'bg-purple-500 text-white':'bg-white'} rounded-full h-4 w-4 p-1`}/>
        <input value={messageInput} onChange={(event)=>setMessageInput(event.target.value)} placeholder={`Send a message to # ${chatroom.roomName}`} className="w-full bg-stone-800 outline-none text-white text-[0.8rem]"/>
        <FontAwesomeIcon hidden={(messageInput === '' && imageInput.length === 0 && !videoInput && !fileInput)?true:false} onClick={handleSendMessage} icon={faCaretRight} className="bg-white hover:bg-gray-200 active:bg-purple-500 cursor-pointer rounded-full h-4 w-4 p-1"/> 
        </>
        }

        {sendMsgLoading &&
        <div className="w-full flex justify-center gap-2">
            <div className="text-white text-[0.8rem]">Sending the message</div>
            <div className="loader-event-dot-message-handle"></div>
        </div>
        }
       
    </div>
    }
    </>
    )
}