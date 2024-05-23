import { faArrowLeft, faCamera, faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import FileResizer from "react-image-file-resizer"
import Swal from "sweetalert2";
import axios from "axios";
import { io } from "socket.io-client"
import LoaderPage from "../loader/LoaderPage";
const socket = io(process.env.API_SOCKET_URL)



export default function EditForm({post,toggleCancelEdit,userData}){
    const [postContent , setPostContent] = useState(post.content)
    const [postImage, setPostImage] = useState(post.image)
    const [contentEditToggle, setContentEditToggle] = useState(false);
    const [imageEditToggle, setImageEditToggle] = useState(false);

    const [editPostLoading , setEditPostLoading] = useState(false);

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
                setPostImage(url)
            }, // Is the callBack function of the resized new image URI.
            "base64", // Is the output type of the resized new image.
          );
     }


     const handleEditPost =(event)=>{
        event.preventDefault();
        Swal.fire({
            text:'Are you sure you want to edit this post ?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, edit it!'
        })
        .then((result)=>{
            if(result.isConfirmed){
                setEditPostLoading(true);
                axios.put(`${process.env.API_URL}/edit-post`,{
                    postID:post._id,
                    content:postContent,
                    image:postImage
                },{
                    headers:{
                        Authorization: `Bearer ${userData.token_key}`
                      }
                })
                .then((response)=>{
                    Swal.fire({
                        text:'Your post has been edited successfully',
                        showConfirmButton: false,
                        timer:2000,
                        position:"top"
                    })
                    .then(()=>{
                        socket.emit('edited-post',{post:response.data});
                        toggleCancelEdit();
                    })
                })
                .catch((error)=>{
                    Swal.fire({
                        title:'Error post editing',
                        text:error.response.data.error
                    })
                })
                .finally(()=>{
                    setEditPostLoading(false);
                })
            }
        })

     }

    return(
    <>
        <div className={`post-edit-card ${!editPostLoading && 'z-20'}  bg-[#333] text-white flex flex-col px-2`}>
            {/* Head */}
            <div className="mb-4">
            <FontAwesomeIcon className="cursor-pointer w-6 h-6 absolute hover:text-purple-500 active:text-purple-500" icon={faArrowLeft} onClick={()=>{toggleCancelEdit();}}/>
            <div className="text-[1.0rem] font-bold text-center">Editing post</div>
            </div>

            {/* Context */}
            <div className="flex flex-col">
                <label className="text-[0.8rem] font-semibold">Content</label>
                <button className="bg-purple-700 hover:bg-purple-800 active:bg-purple-800 text-[0.8rem] py-1" onClick={()=>{setContentEditToggle(contentEditToggle?false:true);}}>Edit</button>
                {contentEditToggle &&
                <textarea onChange={(event)=>{setPostContent(event.target.value)}} type="text" value={postContent} className={`bg-stone-800 outline-none border border-gray-600 focus:border-purple-700 ${postContent.length>200?'h-[30vh]':'h-[10vh]'} text-[0.75rem] p-2`}/>
                }
            </div>
            <div className="flex flex-col pt-2">
                <label className="text-[0.8rem] font-semibold">Image</label>
                <button className="bg-purple-700 text-[0.8rem] hover:bg-purple-800 active:bg-purple-800 py-1" onClick={()=>{setImageEditToggle(imageEditToggle?false:true);}}>Edit</button>
                {imageEditToggle &&
                <div>
                <div className="bg-stone-800 py-1 flex justify-center border border-dashed">
                {postImage ?
                <div className="relative">
                <FontAwesomeIcon icon={faClose} onClick={()=>{setPostImage(null);}} className="absolute right-0 cursor-pointer hover:bg-purple-600 hover:text-white bg-white text-black w-3 h-3 rounded-full p-1"/>
                <label htmlFor="post-image-file" className="cursor-pointer">
                <img src={postImage} className="w-56 h-56"/>
                </label>
                </div>
                :
                <label htmlFor="post-image-file" className="text-[0.8rem] font-semibold h-56 w-56 bg-stone-900 hover:bg-stone-700 cursor-pointer rounded-md flex flex-col justify-center items-center">
                    <FontAwesomeIcon icon={faCamera} className="w-8 h-8 text-white"/>
                    <div>+ Upload Image</div>
                </label>
                }   
                </div>
                <input accept="image/*" onChange={handleFileUpload} type="file" id="post-image-file" className="hidden"/>
                </div>
                }
            </div>
            <div className="w-full pt-4">
                <button onClick={handleEditPost} className="w-full hover:bg-gray-600 active:bg-gray-600 bg-stone-900 py-2 text-[0.9rem] font-bold">Change</button>
            </div>
        </div>

        {editPostLoading &&
            <div className="loader-page-for-cover z-20 p-2 px-3 text-white shadow-md overflow-y-auto">
                <LoaderPage/>
            </div>    
        }
    </>
    ) 
}