import { useState } from "react"
import axios from 'axios'
import Swal from "sweetalert2"
import FileResizer from "react-image-file-resizer"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft, faClose, faFileImage, faFileVideo, faPlus} from "@fortawesome/free-solid-svg-icons"
import { io } from "socket.io-client"
const socket = io(process.env.API_SOCKET_URL)
import LoaderPage from "../loader/LoaderPage"
import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid';


export default function Postform(props){

    AWS.config.update({
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        region: process.env.S3_BUCKET_REGION
    });

    const [imageToggle,setImageToggle] = useState(false);
    const [image,setImage] = useState(null);
    const [videoInput,setVideoInput] = useState(null);
    const [videoInputDisplay,setVideoInputDisplay] = useState(null);

    const [content,setContent] = useState('');
    const [loading,setLoading] = useState(false);

    const handleToggleForCancel=(event)=>{
        event.preventDefault()
        props.toggleCancel(false)
    }

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
                    setImage(url);
                    setVideoInputDisplay(null);
                    setVideoInput(null);
                }, // Is the callBack function of the resized new image URI.
                "base64", // Is the output type of the resized new image.
              );
        }catch(error){
                console.log('Uploaading post image failed: ' + error)
                Swal.fire({
                    icon: 'error',
                    text: error
                })
        }
         }

    const handleVideoUpload =(event)=>{
        try{
            event.preventDefault();
            const videoFile = event.target.files[0]
            if(videoFile){
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
                        setImageToggle(false);
                        setImage(null);
                    }
             }
           }
        }
        catch(error){
            console.log('Uploaading post image failed: ' + error)
            Swal.fire({
                icon: 'error',
                text: error
            })
           }
         }
    

    const handleSubmitForm=async (event)=>{
        event.preventDefault()
        const id = props.accountData.id
        const firstname = props.accountData.firstname
        const lastname = props.accountData.lastname
        const accountImage = props.accountData.accountImage
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
            text:`Would you like to upload your post ?`,
            showCancelButton:true
        }).then(async (status)=>{
            if(status.isConfirmed){
                if(content.length !== 0 || image || videoInput){
                if(videoInput){
                setLoading(true);

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
                    setLoading(false)
                    console.error('Error uploading video:', error);
                      setVideoInput(null)
                      Swal.fire({
                          icon: 'error',
                          text: error
                      })
                    } else {
                        // Store the S3 URL (data.Location) in the database
                        axios.post(`${process.env.API_URL}/create-post`,{
                            content,
                            firstname,
                            lastname,
                            accountImage,
                            currentDate,
                            currentTime,
                            image,
                            id,
                            video:data.Location
                        },{
                            headers:{
                                Authorization: `Bearer ${props.tokenKey}`
                              }
                        })
                        .then(async (response)=>{
    
                            Swal.fire({
                                text: "Successfully uploaded",
                                showConfirmButton: false,
                                timer: 1500,
                                position:"top"
                          }).then(()=>{
                                socket.emit('create-post',{post:response.data});
                                props.toggleCancel(false)
                          })
                         })
                         .catch((error)=>{
                            Swal.fire({
                                title: "Error post uploading",
                                text:error.response.data.error
                         });
                         })
                         .finally(()=>{
                            setLoading(false)
                         })
                    }
                    })


                }else{
                    setLoading(true);
                    axios.post(`${process.env.API_URL}/create-post`,{
                        content,
                        firstname,
                        lastname,
                        accountImage,
                        currentDate,
                        currentTime,
                        image,
                        id,
                        video:videoInput
                    },{
                        headers:{
                            Authorization: `Bearer ${props.tokenKey}`
                          }
                    })
                    .then(async (response)=>{

                        Swal.fire({
                            text: "Successfully uploaded",
                            showConfirmButton: false,
                            timer: 1500,
                            position:"top"
                      }).then(()=>{
                            socket.emit('create-post',{post:response.data});
                            props.toggleCancel(false)
                      })
                     })
                     .catch((error)=>{
                        Swal.fire({
                            title: "Error post uploading",
                            text:error.response.data.error
                     });
                     })
                     .finally(()=>{
                        setLoading(false)
                     })
                }
                }else{
                    Swal.fire({
                        title: "Error post uploading",
                        text: "Please, write your post's content before uploading"
                 });
                }
            }
        })
    }



    return (
    <div>
        <div> 
            {!imageToggle &&
            <div className={`post-form ${!loading && 'z-20'} md:w-[500px] ${image || videoInput?'h-[90vh]':'h-auto'}  p-2 px-3 bg-stone-800 text-white shadow-md shadow-gray-900 overflow-hidden hover:overflow-y-auto`}>
            
            <div className="w-full flex flex-col">
            <div className=" flex ">
            <div onClick={handleToggleForCancel} className="cursor-pointer fixed">
                <FontAwesomeIcon icon={faArrowLeft} className="w-6 h-6 hover:text-violet-400 "/>
            </div>
            </div>
            <div className="text-[1.1rem] font-semibold text-center pb-2">
                Creating a new post
            </div>
            </div>

        
            <div className="py-3 flex items-center gap-2  w-full">
                <Link href={`/profile/${props.accountData.id}`}>
                <img src={props.accountData.accountImage} className="w-8 h-8 rounded-full"/>
                </Link>
                <Link href={`/profile/${props.accountData.id}`} className="text-violet-400 hover:text-white active:text-white text-[0.8rem]">
                    {props.accountData.firstname} {props.accountData.lastname}
                </Link>
            </div>


            <div className="w-full flex flex-col items-center h-auto">
            <textarea value={content} onChange={(event)=>setContent(event.target.value)}  className={`border-t border-l border-r w-full border-violet-600 rounded-t-xl p-1 px-2 flex-1 outline-none bg-stone-800 ${content && content.length>150?'text-[0.8rem]':'text-[0.85rem]'}`} rows={image?3:7} placeholder={`What are you thinking, ${props.accountData.firstname} ${props.accountData.lastname} ?`}/>
            {image &&
            <div  className="bg-stone-400 p-2 border-r border-l border-violet-600  w-full flex flex-col items-center">
            <FontAwesomeIcon onClick={()=>{setImage(null);}} icon={faClose} className="cursor-pointer self-start bg-violet-600 hover:bg-violet-700 p-1 rounded-full w-4 h-4"/>
            <img onClick={()=>{setImageToggle(true);}} className="cursor-pointer w-72 h-72" src={image}  alt="uploaded image"/>
            </div>
            }
            {videoInput && videoInputDisplay &&
            <div className="bg-stone-400 p-2 border-r border-l border-violet-600  w-full flex flex-col items-center relative">
              <FontAwesomeIcon onClick={()=>{setVideoInput(null); setVideoInputDisplay(null);}} icon={faClose} className="cursor-pointer self-start bg-violet-600 hover:bg-violet-700 p-1 rounded-full w-4 h-4"/>
                 <video controls height={100} width={300} poster='https://res.cloudinary.com/dakcwd8ki/image/upload/v1716363446/u9xnotpuzkxbwfwlek2d.jpg' className="bg-stone-700 ">
                 <source src={`${videoInputDisplay}`} type="video/mp4" />
                 Your browser does not support the video tag.
                </video>
            </div>
            }
            <div className="flex w-full">
            <label htmlFor="image" className={`cursor-pointer rounded-bl-xl w-full py-2 bg-violet-600 hover:bg-violet-800 active:bg-violet-800 text-[0.8rem] p-1 flex items-center justify-center`}>
                        <FontAwesomeIcon icon={faFileImage} className={"h-6 w-6  rounded-md"}/>
                        <FontAwesomeIcon icon={faPlus} className="w-3 h-3 pe-1"/>
                        Upload an image
                    <input className="hidden" id="image" type="file" accept="image/*" onChange={handleImageUpload}/>
            </label>
            <label htmlFor="video" className={`border-l border-stone-700 cursor-pointer rounded-br-xl w-full py-2 bg-violet-600 hover:bg-violet-800 active:bg-violet-800 text-[0.8rem] p-1 flex items-center justify-center`}>
                        <FontAwesomeIcon icon={faFileVideo} className={"h-6 w-6  rounded-md"}/>
                        <FontAwesomeIcon icon={faPlus} className="w-3 h-3 pe-1"/>
                        Upload a video
                    <input className="hidden" id="video" type="file" accept="video/*" onChange={handleVideoUpload}/>
            </label>
            </div>
            </div>   

            <div className="w-full flex justify-center">
                <div className="w-full my-7">
                <button onClick={handleSubmitForm} className="w-full py-2 bg-stone-900 hover:bg-gray-700  text-[0.9rem] font-semibold">
                    Upload the post
                </button>
                </div>
            </div>
            
            </div>
            }

            {imageToggle &&
             <div className="overlay flex flex-col">
             <div className="image-card-post-form p-3 md:w-auto bg-[rgba(0,0,0,0.7)] rounded-xl">
             <div className="w-full h-8 text-white z-10">
             <FontAwesomeIcon onClick={()=>{setImageToggle(false);}} icon={faClose} className="h-7 w-7 hover:text-gray-400 cursor-pointer"/>
             </div>
             <div className="p-3">
             <img className="h-full w-full" src={image} alt="Post picture"/>
             </div>
             </div>
             </div>     
            }

            {loading &&
            <div className="loader-page-for-cover z-20 p-2 px-3 text-white shadow-md overflow-y-auto">
                <LoaderPage/>
            </div>    
            }
        </div>
    </div>
    )
}