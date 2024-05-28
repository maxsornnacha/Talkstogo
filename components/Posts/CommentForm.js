import { useEffect, useState} from "react"
import Link from "next/link"
import FileResizer from "react-image-file-resizer"
import axios from "axios"
import Swal from "sweetalert2"
import { io } from "socket.io-client"
import ReplyForm from "./ReplyForm"
import { useRouter } from "next/router"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft, faChevronDown, faChevronUp, faClose, faComment, faPlay, faThumbsUp  } from "@fortawesome/free-solid-svg-icons"
import { faImage } from "@fortawesome/free-regular-svg-icons"
import LoaderPage from "../loader/LoaderPage"
const socket = io(process.env.API_SOCKET_URL)


export default function CommentForm(props){
    const router = useRouter()
    const [replyToggleForDisplay,setReplyToggleForDisplay] = useState(false)
    const [replyToggle,setReplyToggle] = useState(null)
    const [commentInput,setCommentInput] = useState('')
    const [commentImage,setCommentImage] = useState(null)
    const [commentData, setCommentData] = useState([])


    const [commentSubmitLoading,setCommentSubmitLoading] = useState(false);
    const [replySubmitLoading,setReplySubmitLoading] = useState(false);


    const handleReplyLoading=(status)=>{
        setReplySubmitLoading(status);
    }

    useEffect(() => {
        setCommentData(props.postComments);
    }, [props.postComments]);



    const handleToggleForCancel=(event)=>{
        event.preventDefault()
        props.toggleCancel(false)
         
    }

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
                setCommentImage(url)
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
            text:`Would you like to upload the comment ?`,
            showCancelButton:true
        }).then((status)=>{
            if(status.isConfirmed){
                setCommentSubmitLoading(true);
                axios.post(`${process.env.API_URL}/create-comment`,{
                    currentDate,currentTime,accountImage,firstname,lastname,accountID,postID,commentInput,commentImage
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
                            setCommentInput('')
                            setCommentImage(null)   
                            setCommentMobileToggle(true);
                        //make it in real-time from client side    
                        socket.emit('commentData',
                        {commentData:response.data.comments , postID:props.postID}
                       ) 
                        socket.on('commentData',({commentData})=>{
                            setCommentData(commentData)
                        
                         })
                        
                      })
                     })
                     .catch((error)=>{
                        Swal.fire({
                            title: "Error comment uploading",
                            text:error.response.data.error
                     });
                     })
                     .finally(()=>{
                        setCommentSubmitLoading(false);
                     })
            }

        })


     }
     
     const handleRealtime=(index , postUpdated)=>{
            //make it in real-time from client side    
            socket.emit('replyData',
            {postUpdated}
            ) 

        setReplyToggleForDisplay(index)
                  
     }

    
    //Post Image Displaying
    const [showPostImage , setShowPostImage] = useState(false);
    const [showCommentImage , setShowCommentImage] = useState(null);
    const [showReplyImage , setShowReplyImage] = useState(null);

    const [commentMobileToggle, setCommentMobileToggle] = useState(false);

    const handleReplyToggle = ()=>{
        setReplyToggle(null);
    }

    return(
    <div>  
        <div>
        <form className={`comment-form ${!replySubmitLoading && !commentSubmitLoading && 'z-20'} bg-[#333] text-white flex flex-col`}>
            {/* Section 1 Topic */}
            <div className="w-full flex flex-col">
            <div className=" px-3 flex">
            <div onClick={handleToggleForCancel} className="cursor-pointer hover:text-purple-400">
                <FontAwesomeIcon icon={faArrowLeft} className="w-6 h-6 absolute"/>
            </div>
            </div>
            <div className="text-[1.1rem] font-bold  w-full text-center pb-2">
                {props.post.firstname}'s Post
            </div>
            </div>

            <div className={`h-[80dvh] md:h-[83vh] flex flex-col md:flex-row`}>
            {/* Section2 Post Info */}
            <div className="h-full md:w-7/12 overflow-auto px-5 bg-stone-800 break-all">
                <div className="py-2 flex items-center gap-2">
                <Link href={`/profile/${props.post.accountID}`} >
                <img src={props.post.accountImage.secure_url} className="w-8 h-8 rounded-full hover:border hover:border-purple-700 active:border-purple-700"/>
                </Link>
                <Link href={`/profile/${props.post.accountID}`} >
                <div className="flex flex-col justify-center ">
                <p className="text-[0.75rem] text-purple-400 hover:text-white active:text-white">{props.post.firstname} {props.post.lastname}</p>
                <span className="text-[0.7rem] ">{props.post.currentTime} &nbsp;{props.post.currentDate}</span>
                 </div>
                 </Link>
                </div>
                
                <div className="py-2 text-[0.8rem]">
                    {props.post.content}
                </div>
                {props.post.image && 
                <div className="py-2">
                <img onClick={()=>{setShowPostImage(true);}} src={props.post.image.secure_url} className="cursor-pointer w-56 h-56 rounded-md hover:border-2 hover:border-purple-700 active:border-purple-700"/>
                </div>
                }
                {props.post.video && 
                <div className="px-2 pb-3">
                <video controls height={100} width={300} autoPlay className="bg-stone-900">
                <source src={`${props.post.video.Location}#t=0.1`} type="video/mp4" />
                Your browser does not support the video tag.
               </video>
                </div>
                }
                {/* image show card from Post Image */}
                {showPostImage && 
                <div className="overlay flex flex-col">
                    <div className="image-card w-auto h-auto p-3 md:w-auto bg-[rgba(0,0,0,0.7)] rounded-xl border-2 border-purple-700">
                    <div className="w-full h-8 text-white z-10">
                    <FontAwesomeIcon onClick={()=>{setShowPostImage(false);}} icon={faClose} className="h-7 w-7 hover:text-purple-500 cursor-pointer"/>
                    </div>
                    <div className="p-3  flex justify-center">
                    <img className="max-h-[90vh] md:max-h-[60vh] md:max-w-[70vw] md:w-auto w-full" src={props.post.image.secure_url} alt="Post picture"/>
                    </div>
                    </div>
                </div>
                }
                <div className="pt-3  col-span-12 flex flex-row items-center pb-5">
                 <div className="flex flex-row  items-center">
                 <FontAwesomeIcon icon={faThumbsUp} className="me-1 h-4 w-4 ms-2" alt="Likes"/>
                 <span className="text-[0.8rem]" >{props.post.likes.length}</span>
                 </div>
                 <div className="flex flex-row  items-center">
                <FontAwesomeIcon icon={faComment} className="me-1 h-4 w-4 ms-2" alt="Comments"/>
                 <span className=" text-[0.8rem]">{props.post.comments.length}</span>
                 </div>            
                 </div>
            </div>

            {/* Section3 Comment and Reply */}
            <div className={`md:w-5/12 px-3 bg-stone-900 py-3 ${commentMobileToggle?'h-[300vh] ':'h-[80px]'} md:h-full duration-500  ${commentMobileToggle && 'overflow-auto'}`}> 
                {/* Comment Topic */}
                <div className="cursor-pointer md:hidden"><FontAwesomeIcon className="hover:text-purple-500" icon={commentMobileToggle?faChevronDown:faChevronUp} onClick={()=>{setCommentMobileToggle(commentMobileToggle?false:true);}}/></div>
                <div className="text-[0.85rem] font-normal">Comments</div>
                <div className="py-2 w-full">

                {/* Comment Input */}
                <div className="fixed bottom-0 w-full left-0 md:static">
                <div className="bg-purple-600 rounded-md">
                <textarea placeholder='write your opinion ...' onChange={(event)=>setCommentInput(event.target.value)} rows={commentInput && commentInput.length>170?7:3} value={commentInput} className="p-2 bg-stone-800 border-purple-600 border w-full outline-none text-[0.8rem] rounded-md text-white"/>
                <div className="flex justify-between items-center px-2 ">
                    <div>
                    <label htmlFor="image-comment" className="cursor-pointer px-2">
                        <FontAwesomeIcon icon={faImage} className="h-5 w-5 text-white hover:text-purple-500 active:text-gray-400"/>
                    </label>
                    <input accept="image/*" onChange={handleFileUpload} className="hidden" id="image-comment" type="file"/>
                    </div>   

                    <button onClick={handleSubmit} className="text-[0.9rem]">
                        <FontAwesomeIcon icon={faPlay} className={commentInput || commentImage?"h-4 w-4 p-1 hover:text-gray-300 active:text-gray-300":"h-5 w-5 p-1 hidden"}/>
                    </button>
                </div>
                {commentImage &&
                    <div className="p-2 border-white border-dashed border bg-gray-600 flex justify-between">
                        <img src={commentImage} className="h-auto w-28"/>
                        <FontAwesomeIcon onClick={()=>{setCommentImage(null)}} icon={faClose} className="bg-white text-black hover:bg-gray-300 cursor-pointer w-3 h-3 rounded-full p-1"/>
                    </div>
                }
                </div>
                </div>


                {/* Comment List Display */}
                <div className={`md:flex flex-col gap-3 mt-4 md:h-[60vh] md:overflow-auto ${commentMobileToggle?'flex':'hidden'}`}>
                {commentData && commentData.length > 0 &&    
                commentData.map((commentItem,index)=>{
                    return(
                    <div className="flex flex-col" key={index}>
                 
                        <div className="flex gap-1">
                            <Link href={`/profile/${commentItem.accountID}`}>
                             <img src={commentItem.accountImage.secure_url} className="h-7 w-7 rounded-full hover:border hover:border-purple-700 active:border-purple-700"/>
                             </Link>
                        <div className="w-10/12 flex flex-col">
                            <div className="bg-purple-800 rounded-md break-words px-1 pb-2">
                            <Link href={`/profile/${commentItem.accountID}`} className="text-white hover:text-gray-300 text-[0.7rem] font-normal">{commentItem.firstname} {commentItem.lastname}</Link>
                            <div className="text-[0.8rem]"> {commentItem.commentInput}</div>
                            {commentItem.commentImage &&
                            <div>
                                <img onClick={()=>{setShowCommentImage({status:true , imageNO:index+1})}}  src={commentItem.commentImage.secure_url} className="cursor-pointer rounded-md h-48 w-48 hover:border-2 hover:border-white active:border-white" />
                            </div>
                            }
                             {/* image show card from Comment Image */}
                            {showCommentImage && showCommentImage.status && showCommentImage.imageNO === index+1 &&
                            <div className="overlay flex flex-col">
                            <div className="image-card w-auto h-auto p-3 md:w-auto bg-[rgba(0,0,0,0.7)] rounded-xl border-2 border-purple-700">
                            <div className="w-full h-8 text-white z-10">
                                <FontAwesomeIcon onClick={()=>{setShowCommentImage(null);}} icon={faClose} className="h-7 w-7 hover:text-purple-500 cursor-pointer"/>
                            </div>
                            <div className="p-3  flex justify-center">
                                <img className="max-h-[90vh] md:max-h-[60vh] md:max-w-[70vw] md:w-auto w-full" src={commentItem.commentImage.secure_url} alt="Post picture"/>
                            </div>
                            </div>
                            </div>
                            }
                            </div>
                            <div className="text-[0.7rem] flex gap-3">
                                <div>{commentItem.currentTime}  {commentItem.currentDate}</div>
                                {/* Reply Input Toggle */}
                            {replyToggle && replyToggle === index+1 ?
                            <div className="cursor-pointer" onClick={()=>setReplyToggle(null)}>Unreply</div>
                            :
                            <div className="cursor-pointer" onClick={()=>setReplyToggle(index+1)}>Reply</div>
                            }
                            </div>
                            {/* Reply Input */}
                            {replyToggle && replyToggle === index+1 && 
                            <div className="w-full" >
                                <ReplyForm handleReplyToggle={handleReplyToggle} tokenKey={props.tokenKey} index={index} accountData={props.accountData} commentItem={commentItem} postID={props.postID} handleRealtime={handleRealtime} handleReplyLoading={handleReplyLoading}/>
                            </div>
                            }
                            {/* Reply display Toggle */}
                            {commentItem && commentItem.replies?.length > 0 && 
                            <div className=" bg-stone-700 p-1 rounded-md cursor-pointer text-[0.75rem] hover:bg-stone-600 active:bg-stone-600" onClick={()=>setReplyToggleForDisplay(replyToggleForDisplay===index?false:index)}>{replyToggleForDisplay===index?'Hide all replies':'See all replies'}</div>
                            }
                        </div>
                        </div>
                  
                            {/* Reply displaying */}
                            <div className="flex flex-col mx-8 border-l-2 border-white">
                            {replyToggleForDisplay === index && commentItem.replies &&
                            commentItem.replies.map((item,index)=>{
                                return(
                                <div className="flex w-full my-2" key={index}>
                                    <div className="border-t-2 mt-4 border-white">
                                        &nbsp;&nbsp;&nbsp;&nbsp;
                                    </div>
                                    <Link href={`/profile/${item.accountID}`}>
                                        <img src={item.accountImage.secure_url} className="w-7 h-7 rounded-full hover:border hover:border-purple-700 active:border-purple-700"/>
                                    </Link>

                                    <div className="flex flex-col gap-1 ms-1">
                                    <div className="bg-purple-700 text-gray-100 rounded-md p-1 pb-2 flex flex-col gap-1 w-auto max-w-56 break-words">
                                        <Link href={`/profile/${item.accountID}`} className="text-white hover:text-gray-300 text-[0.65rem] font-normal">{item.firstname} {item.lastname}</Link>
                                        <div className="text-[0.75rem]">{item.replyInput}</div>
                                    {item.replyImage &&
                                    <div className="w-full">
                                        <img onClick={()=>{setShowReplyImage({status:true , imageNO:index+1});}} src={item.replyImage.secure_url} className="cursor-pointer rounded-md w-6/12 hover:border-2 hover:border-white active:border-white" />
                                    </div>
                                    }
                                    {/* image show card from Comment Image */}
                                    {showReplyImage && showReplyImage.status && showReplyImage.imageNO === index+1 &&
                                    <div className="overlay flex flex-col">
                                    <div className="image-card w-auto h-auto p-3 md:w-auto bg-[rgba(0,0,0,0.7)] rounded-xl border-2 border-purple-700">
                                    <div className="w-full h-8 text-white z-10">
                                        <FontAwesomeIcon onClick={()=>{setShowReplyImage(null);}} icon={faClose} className="h-7 w-7 hover:text-purple-500 cursor-pointer"/>
                                    </div>
                                    <div className="p-3  flex justify-center">
                                        <img className="max-h-[90vh] md:max-h-[60vh] md:max-w-[70vw] md:w-auto w-full" src={item.replyImage.secure_url} alt="Post picture"/>
                                    </div>
                                    </div>
                                    </div>
                                    }
                                    </div>
                                    <div className="text-[0.65rem]">
                                       {item.currentTime} - {item.currentDate}
                                    </div>
                                    </div>
                                </div>
                                )
                            })
                            }
                            </div>
 
                    </div>
                    )
                })}
                {commentData && commentData.length === 0 &&   
                <div className="flex flex-col text-[0.75rem] md:h-[50vh] h-[20vh] justify-center items-center">
                     <div>No comments yet</div>
                </div>
                }
            </div>

            </div>
            </div>
            </div>


        </form>

        {commentSubmitLoading &&
            <div className="loader-page-for-cover z-50 p-2 px-3 text-white shadow-md overflow-y-auto">
                <LoaderPage/>
            </div>    
        }
         {replySubmitLoading &&
            <div className="loader-page-for-cover z-50 p-2 px-3 text-white shadow-md overflow-y-auto">
                <LoaderPage/>
            </div>    
        }
        </div>
    </div>
    )
}