import Postform from "./PostForm"
import { useState,useEffect } from "react"
import LikeSystem from "../Likes/LikeSystem"
import axios from "axios"
import Link from "next/link"
import { io } from "socket.io-client"
import CommentForm from "./CommentForm"
const socket = io(process.env.API_SOCKET_URL)
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBars, faComment, faPerson, faThumbsUp } from "@fortawesome/free-solid-svg-icons"
import Navbar from "../Navbars/NavbarOther"
import Swal from "sweetalert2"
import EditForm from "./EditForm"
import MenuOnRight from "../Menus/MenuOnRight"






export default function WorldPost(props){

    AWS.config.update({
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        region: process.env.S3_BUCKET_REGION
    });

    const [toggleForm,setToggleForm] = useState(false)
    const [posts,setPosts] = useState([])
    const [likeCount,setLikeCount] = useState(null)
    const [toggleComment,setToggleComment] = useState(false)


    //Handle update post after created
    useEffect(()=>{

        const handleCreatePost = ({post})=>{
            setPosts((prev)=>{
                return [post,...prev]
            })
        }

        socket.on('create-post',handleCreatePost)

        return ()=>{
            socket.off('create-post',handleCreatePost)
        }

    },[])

    //Handle Like update
    useEffect(()=>{
        const handleLikeUpdate = ({post})=>{
            setPosts((prev)=>{
                return prev.map((prevPost)=>{
                    if(prevPost._id === post._id){
                        return post
                    }else{
                        return prevPost
                    }
                })
                
            })
        }

        socket.on('like-update',handleLikeUpdate)

        return ()=>{
            socket.off('like-update',handleLikeUpdate)
        }
    },[])

    useEffect(()=>{
        const fetch=()=>{
            axios.get(`${process.env.API_URL}/display-post`,{
                headers:{
                    Authorization: `Bearer ${props.userData.token_key}`
                  }
            })
            .then((response)=>{
                setPosts(response.data.reverse())
            })
            .catch((error)=>{
                console.log(error.response.data.error)
            })
            .finally(()=>{
                props.WorldPostLoadingStatus();
            })
        }

        fetch()
       
    },[])



    const handleToggleCancel=(toggleData)=>[
        setToggleForm(toggleData)
    ]

    const handleToggleCommentCancel=(toggleData)=>{
        setToggleComment(toggleData)

    }

    useEffect(()=>{
        
        const handleCommentData = ({commentData,postID}) => {
            setPosts((prev) =>{
                return prev.map((post,index) =>{
                     if(postID === post.postID){
                         return {...post, comments: commentData,}
                     }else{
                         return post
                     }   
            })
        });
        };
    
        // Add the event listener
        socket.on('commentData', handleCommentData);
    
        // Clean up the event listener when the component unmounts
        return () => {
            socket.off('commentData', handleCommentData);
        };
      
    },[])


     //Reply
     useEffect(() => {

        const handleOnReply = ({postUpdated}) => {
              setPosts(()=>{
                const result = posts.map((post)=>{
                    if(post.postID === postUpdated.postID){
                        return postUpdated
                    }else{
                        return post
                    }
              })

                return result
              })
          }
          
          socket.on('replyData', handleOnReply);

        // Clean up the event listener when the component unmounts
        return () => {
             socket.off('replyData', handleOnReply);
        };

    
    }, [posts]);


    //Handle Deleting Posts
    const handleDeletePost = (post , index, event)=>{
        event.preventDefault()
        const postID = post._id;
        const postImage = post.image;
        const commentImages = post.comments.filter(comment => comment.commentImage).map(comment => comment.commentImage);
        const replyImages = post.comments.flatMap(comment => comment.replies).filter(reply => reply.replyImage).map(reply => reply.replyImage);
        Swal.fire({
            icon:'warning',
            text:'Are you sure you want to delete your post ?',
            showCancelButton:true,
            confirmButtonText:'Yes, delete it!'
        })
        .then((result)=>{
            if(result.isConfirmed) {
                axios.delete(`${process.env.API_URL}/delete-post`,{
                    data:{
                        postID:postID,
                        postImage:postImage,
                        commentImages:commentImages,
                        replyImages:replyImages
                    },
                    headers:{
                        Authorization: `Bearer ${props.userData.token_key}`
                    }
                })
                .then((response)=>{
                    Swal.fire({
                        text:'Your post has been successfully deleted',
                        showConfirmButton:false,
                        timer: 1500,
                        position:"top"
                    })
                    .then(async ()=>{

                        if(post.video){
                            const deleteParams = {
                                Bucket: process.env.S3_BUCKET_NAME_VIDEO,
                                Key: post.video.Key
                            };
                            const s3 = new AWS.S3();
                            await s3.deleteObject(deleteParams).promise();
                        }

                        setShowMenuToggle(null);
                        socket.emit('delete-post',{postID:postID})
                    })
                })
                .catch((error)=>{
                    Swal.fire({
                        title:'Error deleting post',
                        text:error.response.data.error,
                    })
                 })     
        
            }
        })
    }

    //Handle deleting the post in real time
    useEffect(()=>{
        const handleDeletePost = ({postID , index})=>{
            setPosts((prev)=>{
                return prev.filter((post)=>{
                    return post._id !== postID
                })
            })

            if(postID === toggleComment){
                setToggleComment(false)
            }

        }

        socket.on('delete-post',handleDeletePost)

        return ()=>{
            socket.off('delete-post',handleDeletePost)
        }
    },[])


    //Close Menu Toggle after Liked
    const handleCloseMenuToggle = ()=>{
        setShowMenuToggle(null)
    }

    //Menu Toggle For each post
    const [showMenuToggle, setShowMenuToggle] = useState(null)


    //Handle Edit
    const [toggleEdit , setToggleEdit] = useState(null);

    //Close Menu Toggle after opening a edit card
    const toggleCancelEdit =()=>{
        setToggleEdit(null);
    }

    //Handle Update the edited post after edited
    useEffect(()=>{
        const handleEditPost = ({post})=>{
            setPosts((prev)=>{
                return prev.map((prevPost)=>{
                    if(prevPost._id === post._id){
                        return post
                    }else{
                        return prevPost
                    }
                })
            })

            window.location.reload();
        }

        socket.on('edited-post',handleEditPost)

        return () => {
            socket.off('edited-post',handleEditPost)
        }
    },[posts])



    return(
    <div className={`h-screen w-full flex flex-col`}>
        <div className="h-[47px]">
        {/* Navbar */}
        <Navbar userData={props.userData}/>
        
        {/* Topic Name */}
        <div className="md:bg-[rgba(0,0,0,0)] bg-[#161617] px-2 md:px-0 md:absolute top-1 md:left-[315px]">
               <h1 className="text-[1rem] text-purple-400 text-start md:pb-1 md:pt-2"># Global posts</h1>
        </div>
        </div>

        
        <div className="flex-1 flex">
        
        <div className="flex-1 flex flex-col h-[92dvh] md:h-[92vh]">
        {/* Input form */}
        <div className="h-[40px] bg-[#161617] flex w-full">
        <div className="flex px-2 gap-2 w-full  items-center ">
                <button onClick={()=>setToggleForm(true)} className={`py-1 px-2 w-11/12 bg-stone-900 border border-gray-600 hover:bg-stone-800 outline-none rounded-md text-start font-normal text-gray-300  text-[0.8rem] hidden md:block`}>What are you thinking? Click here to share your thoughts here !</button> 
                <button onClick={()=>setToggleForm(true)} className={`py-1 px-2 w-11/12 bg-stone-900 border border-gray-600 hover:bg-stone-800 outline-none rounded-md text-start font-normal text-gray-300  text-[0.8rem] md:hidden`}>Let's share your thoughts here !</button>     
                </div>  
        </div>

        <div className="flex-1 flex flex-col h-[87dvh] md:h-[87vh] w-full overflow-auto">

            {/* Post Card */}
            {posts.length !== 0? 
            posts.map((item,index)=>{
                
                return(
                <div className="mx-2 h-auto py-4 flex" key={item.postID}>
    
                {/* Section 1 */}
                {/* Profile image */}
                 <div className="flex flex-col">
                <Link href={`/profile/${item.accountID}`}>
                 <img className=" rounded-full h-8 w-8 inline-block me-1" src={item.accountImage.secure_url} alt="Profile picture"/>
                 </Link>
                 </div>
                
                {/* Section 2 */}
                <div className="flex-1 break-all relative bg-stone-80 md:me-10">
                {/* Profile name*/}
                <div className="flex justify-between items-center bg-stone-900 p-1">
                 <Link href={`/profile/${item.accountID}`}>
                 <div className="flex items-center">
                 <p className="inline-block text-white hover:text-gray-200 font-semibold  text-[0.75rem]">
                    <span className="font-semibold">{item.firstname} {item.lastname}</span>
                    <span> - {item.currentTime} &nbsp;{item.currentDate}</span>
                 </p> 
                </div>
                 </Link>
                {/* Comment and Like button */}
                <div className="text-white  flex flex-row justify-end py-2">
                    <FontAwesomeIcon icon={faBars} onClick={()=>{setShowMenuToggle(showMenuToggle && showMenuToggle.status && showMenuToggle.menuNO === index+1?null:{status:true, menuNO:index+1});}} 
                    className={`w-4 h-4 cursor-pointer ${showMenuToggle && showMenuToggle.status && showMenuToggle.menuNO === index+1?'text-purple-400':'text-white'} hover:text-purple-400 active:text-purple-400`}
                    />
                 {/* Menu Setting Display */}
                 {showMenuToggle && showMenuToggle.status && showMenuToggle.menuNO === index+1 &&
                 <div className="flex flex-col bg-stone-800 absolute right-6 top-1">
                 <div className="flex flex-row w-32 items-center text-white">
                    <LikeSystem key={index} userData={props.userData} accountID={props.userData.accountData.id} postID={item.postID} post={posts[index]} handleCloseMenuToggle={handleCloseMenuToggle}/>
                 </div>
                 <span onClick={()=>{setToggleComment(item.postID); setShowMenuToggle(null);}} className="text-[0.75rem] text-center font-normal cursor-pointer hover:bg-stone-600  py-1">
                     Comment
                 </span>
                 {item.accountID === props.userData.accountData.id &&
                <div onClick={()=>{setToggleEdit(item.postID); setShowMenuToggle(null);}} className="text-[0.75rem] font-normal text-center py-1 cursor-pointer hover:bg-stone-600">
                        Edit
                </div>
                }
                {item.accountID === props.userData.accountData.id &&
                <div onClick={(event)=>{handleDeletePost(item,index,event)}} className="text-[0.75rem] font-normal text-center py-1 cursor-pointer hover:bg-stone-600">
                        Delete 
                </div>
                }
                 </div> 
                }
                </div>
                </div>

                
                <div onClick={()=>{setToggleComment(item.postID);}} className="cursor-pointer hover:bg-stone-600 bg-stone-800">
                {/* Post content */}
                 <p  className="cursor-pointer pb-3 text-white font-normal text-[0.75rem] pt-3 px-3">
                    {item.content}            
                 </p>
                 {/* Post Image */}
                 {item.image &&
                   <img className="h-60 w-60 px-3 pb-3 rounded-2xl" src={item.image.secure_url}  alt="Post picture"/>
                 }
                 {/* Post Video */}
                 {item.video &&
                 <div className="px-3 pb-3">
                   <video height={100} width={300} className="bg-stone-900">
                   <source src={`${item.video.Location}#t=0.1`}  type="video/mp4" />
                   Your browser does not support the video tag.
                  </video>
                </div>
                 }

                {/*showing the number of Likes and Comments Icon*/}
                <div className="flex">
                  <div className={item.likes.length+(likeCount && likeCount[item.postID] || 0)=== 0 ?'hidden':'flex items-center py-2'}>
                    <FontAwesomeIcon className="inline-block h-4 w-5 ms-2 me-1 text-purple-400 " alt="like" icon={faThumbsUp} />
                    <p className="text-white  text-[0.85rem]">{item.likes.length+(likeCount && likeCount[item.postID] || 0)} 
                     </p>
                  </div>
                  <div className={item.comments.length === 0 ?'hidden':'flex items-center py-2'}>
                    <FontAwesomeIcon className="inline-block h-4 w-4 ms-2 me-1 text-purple-400 " alt="like" icon={faComment} />
                    <p className="text-white  text-[0.85rem]">
                         {item.comments.length} 
                     </p>
                  </div>
                </div>

                </div>
                </div>


                  </div>  
            )
            })
            :
            <div className="h-screen flex flex-col text-white font-normal items-center gap-20 justify-center mx-5 text-center text-[0.9rem]">
                <div>You don't have a post on the feed yet, so let's share your thoughts.</div>
            </div>
            }          
        </div>
        </div>

        {/* Section 2 */}
        <div className="w-[250px] hidden  text-[0.8rem] text-white border-l border-stone-600 lg:flex flex-col">
               <MenuOnRight/>
        </div>

        </div>
        


        {toggleForm  &&
        <div className="overlay z-[100]">
        <Postform toggleCancel={handleToggleCancel} accountData={props.userData.accountData} tokenKey={props.userData.token_key}/>
        </div> 
        }

        {posts.map((item, index) =>{
        return (
        <div key={index}>
            {toggleComment === item.postID &&
                <div className="overlay z-[100]">
                    <CommentForm post={posts[index]} postID={item.postID} postComments={item.comments}  toggleCancel={handleToggleCommentCancel} accountData={props.userData.accountData} tokenKey={props.userData.token_key} key={item.postID}/>
                </div>
            }

            {toggleEdit === item.postID &&
                <div className="overlay z-[100]">
                    <EditForm userData={props.userData} post={posts[index]} toggleCancelEdit={toggleCancelEdit} key={item.postID}/>
                </div>
            }
        </div>
        )
        })

        }
    </div>
    )
}