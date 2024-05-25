import axios from 'axios'
import { useState,useEffect } from "react"
import { useRouter } from 'next/router'
import Navbar from '@/components/Navbars/NavbarOther'
import Link from 'next/link'
import LikeSystem from '@/components/Likes/LikeSystem'
import UserDataFetching from '@/services/UserDataFetching'
import MenuBarOn from '@/components/Menus/MenuBarOnLeft'
import AddFriends from '@/components/Friends/AddFriends'
import Chatroom from '@/components/Chats/ChatsProfile'
import { io } from 'socket.io-client'
import CommentForm from '@/components/Posts/CommentForm'
import RoomsOnMain from '@/components/TalkingRooms/RoomsOnMain'
import AllFriendList from '@/components/Friends/AllFriendList'
import Notfound from '@/components/404'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBars, faClose, faComment, faThumbsUp } from "@fortawesome/free-solid-svg-icons"
const socket = io(process.env.API_SOCKET_URL)
import Swal from "sweetalert2"
import EditForm from '@/components/Posts/EditForm'
import LoaderBeforeFetching from '@/components/loader/LoaderBeforeFethcing'
import Head from 'next/head'
import AWS from 'aws-sdk'



export default function Profile(){

  AWS.config.update({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: process.env.S3_BUCKET_REGION
  });

  const router = useRouter()
  const {id}= router.query
  const [toggle,setToggle] = useState('profile')
  const [accountData,setAccountData]= useState(null)
  const [posts,setPosts] = useState(null)
  const [accountLogin,setAccountLogin] = useState(null)
  const [likeCount,setLikeCount] = useState(null)
  const [toggleComment,setToggleComment] = useState(false)
  const [numberOfFriends,setNumberOfFriends] = useState(0)
  const [chatroomToggle,setChatroomToggle] = useState(false)
  const [talkingrooms,setTalkingrooms] = useState(null)


  const [roomOnMainLoading,setRoomOnMainLoading] = useState(true);
  const [MenuBarOnLoading, setMenuBarOnLoading] = useState(true);
  const [singleAccountLoading ,setSingleAccountLoading] = useState(true);
  const [displayPostLoading, setDisplayPostLoading] = useState(true);
  const [allFriendGetLoading, setAllFriendGetLoading] = useState(true);
  const [allTalkingroomLoading, setAllTalkingRoomLoading] = useState(true);
  

  const RoomsOnMainLoadingStatus = () => {
    setRoomOnMainLoading(false);
  }

  const MenuBarOnLoadingStatus =() => {
    setMenuBarOnLoading(false);
  }
  

  const fetchData = async () => {
    await axios.get(`${process.env.API_URL}/single-account-data/${id}`,{
      headers:{
        Authorization: `Bearer ${accountLogin.token_key}`
      }
    })
    .then( (response)=>{
    if(response.data){
      setAccountData(response.data)
    }else{
      setAccountData('notfound')
    }
  }).catch((error)=>{
    console.log(error)
  }).finally(()=>{
      setSingleAccountLoading(false);
  })
};

  const fetchPostOfTheAccount = async ()=>{
    await axios.get(`${process.env.API_URL}/display-post-profile/${id}`,{
      headers:{
        Authorization: `Bearer ${accountLogin.token_key}`
      }
    })
    .then( (response)=>{
      setPosts(response.data.reverse())
  }).catch((error)=>{
      setPosts(null)
  }).finally(()=>{
      setDisplayPostLoading(false);
  })
  }

  const fetchAccount = async ()=>{
    if(await UserDataFetching()){
      setAccountLogin(await UserDataFetching())
    }else{
      router.push('/')
    }

  }

  const friendNumberUpdate=()=>{
    axios.get(`${process.env.API_URL}/all-friends-get/${accountData._id}`,{
      headers:{
        Authorization: `Bearer ${accountLogin.token_key}`
      }
    })
    .then((response)=>{
      setNumberOfFriends((response.data).length)
    })
    .catch((error)=>{
        setNumberOfFriends(0)
    })
    .finally(()=>{
      setAllFriendGetLoading(false);
    })
}

//Fetching all Talkingrooms of the account
useEffect(()=>{
const fetchTalkingRooms =()=>{
  if(accountData){
  axios.post(`${process.env.API_URL}/all-talkingrooms`,{userID:(accountData._id)},{
    headers:{
      Authorization: `Bearer ${accountLogin.token_key}`
    }
  })
  .then((response)=>{
      setTalkingrooms(response.data)
  })
  .catch((error)=>{
      console.log(error.response.data)
  })
  .finally(()=>{
    setAllTalkingRoomLoading(false);
  })
  }
}

fetchTalkingRooms()

},[accountData])

    useEffect(()=>{
      if(id){
        fetchAccount();
      }
    },[id])

    useEffect(() => {
      if (id && accountLogin) {
        fetchData();
        fetchPostOfTheAccount();
      }
      setToggle('profile')
      setChatroomToggle(false)
      },[id,accountLogin]);

      useEffect(()=>{
        if(accountData){
          friendNumberUpdate();
        }
      },[accountData])

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


  const handleToggleCommentCancel=(toggleData)=>{
    setToggleComment(toggleData)

}

useEffect(()=>{
        
  const handleCommentData = ({commentData,postID}) => {
      setPosts((prev) =>{
          return prev.map((post) =>{
               if(postID === post.postID){
                   return {...post, comments:commentData,}
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

  const handleChatroomToggle=(data)=>{
    setChatroomToggle(data)
}
  
  const handleCloseChat=(data)=>{
    setChatroomToggle(data)
  }

  //show Profile Image
  const [showProfileImage , setShowProfileImage] = useState(false);

  //Menu Toggle For each post
  const [showMenuToggle, setShowMenuToggle] = useState(null)


  //Handle updating Post after created
    useEffect(()=>{
      const handleCreatePost = ({post})=>{
        if(accountData.id === post.accountID){
          setPosts((prev)=>{
            return [post,...prev]
          })
        }
      }

      socket.on('create-post',handleCreatePost)

      return ()=>{
          socket.off('create-post',handleCreatePost)
      }

  },[accountData])

  //Handle Deleting Posts
  const handleDeletePost = (post , event)=>{
    event.preventDefault()
    const postID = post._id
    const postImage = post.image;
    const commentImages = post.comments.filter(comment => comment.commentImage).map(comment => comment.commentImage);
    const replyImages = post.comments.flatMap(comment => comment.replies).filter(reply => reply.replyImage).map(reply => reply.replyImage);
    Swal.fire({
        text:'are you sure you want to delete the post?',
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
                  Authorization: `Bearer ${accountLogin.token_key}`
                }
            })
            .then((response)=>{
                Swal.fire({
                    text:'Your post has been successfully deleted',
                    showConfirmButton:false,
                    timer: 1500,
                    position:"top"
                })
                .then(async()=>{

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
                 console.log(error.response.data.error)
             })     
    
        }
    })
}

  //Handle deleting the post in real time
  useEffect(()=>{
    const handleDeletePost = ({postID})=>{
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
       }

       socket.on('edited-post',handleEditPost)

       return () => {
           socket.off('edited-post',handleEditPost)
       }
   })


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

  if(singleAccountLoading || displayPostLoading || allFriendGetLoading || allTalkingroomLoading){
    return(
    <div className='block'>
      <LoaderBeforeFetching/>
    </div>
    )
  }else{
  if(accountData !== null && typeof accountData === 'object' ) {
    if(accountLogin){
    return(
      <>
      <Head>
        <title>{accountData.username} | TalkToGo</title>
      </Head>
      <div className={`${roomOnMainLoading || MenuBarOnLoading || singleAccountLoading || displayPostLoading || allFriendGetLoading || allTalkingroomLoading ? 'hidden':'block'}`}>
      <div className={` bg-[#383739] flex`}>

            {/* section1 Talkingrooms*/}
          <div className="w-[70px] bg-[#050111]">
          <RoomsOnMain userData={accountLogin} RoomsOnMainLoadingStatus={RoomsOnMainLoadingStatus}/>
          </div>
  
              {/* section2  Menu*/}
          <div className="hidden md:block text-white h-screen overflow-hidden hover:overflow-y-auto bg-[#161617]">
          <MenuBarOn userData={accountLogin} MenuBarOnLoadingStatus={MenuBarOnLoadingStatus}/>
          </div>

          <div className='flex-1'>
          {!chatroomToggle &&
          <>
           <Navbar userData={accountLogin}/>
          </>
          }

        <div className='flex bg-[#383739]'>
            {/* section4 Option:All posts*/}
         {toggle === 'posts' && posts && !chatroomToggle && accountData &&
            <div className='lg:w-9/12 w-full'>  
              <div className="p-2 bg-[#161617] md:bg-[rgba(0,0,0,0)] md:absolute top-1 left-[104px] md:left-[305px]">
                 <h1 className="text-[1rem] text-white font-normal"># {accountData.firstname === accountLogin.accountData.firstname?'My':accountData.firstname+"'s"} posts</h1>
               </div>
               <div className='bg-[#161617]  flex'>
               <button onClick={()=>{setToggle('profile'); setChatroomToggle(false)}} className={`${toggle === 'profile' && !chatroomToggle && 'text-white border-b-2 border-purple-400'} transition duration-500 hover:border-b-2 hover:border-purple-400 flex-1 py-2 px-2 shadow-md text-white bg-stone-800 text-[0.8rem]`}>
                Profile
                </button>
               <button onClick={()=>{setToggle('posts'); setChatroomToggle(false)}} className={`${toggle === 'posts' && !chatroomToggle && 'text-white border-b-2 border-purple-400'} transition duration-500  hover:border-b-2 hover:border-purple-400 flex-1 py-2 px-2 shadow-md text-white bg-stone-800 text-[0.8rem]`}>
                Posts
                </button>
                <button onClick={()=>{setToggle('friends'); setChatroomToggle(false)}} className={`${toggle === 'friends' && !chatroomToggle && 'text-white border-b-2 border-purple-400'} transition  duration-500   hover:border-b-2 hover:border-purple-400 flex-1 py-2 px-2 shadow-md text-white bg-stone-800 text-[0.8rem]`}>
                Friends
                </button>
              </div>
  
              {/* Post Card */}
            <div className=' flex flex-col md:h-[88vh] h-[82dvh] bg-[#383739] overflow-auto'>
            {toggle === 'posts' && posts && posts.length > 0 &&
            posts.map((item,index)=>{
           return(
           <div key={item.postID}>
            <div className="mx-2 h-auto py-4 flex">
    
          {/* Section 4.1 */}
          {/* Profile image */}
          <div className="flex flex-col">
          <Link href={`/profile/${item.accountID}`}>
            <img className=" rounded-full h-9 w-9 inline-block me-1" src={item.accountImage.secure_url} alt="Profile picture"/>
          </Link>
          </div>
    
            {/* Section 4.2 */}
            <div className="flex-1 break-all relative bg-stone-800 md:me-10">
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
            <div className="flex flex-col bg-stone-800 py-2 absolute right-6">
             <div className="flex flex-row w-32 items-center text-white">
            <LikeSystem key={index} userData={accountLogin} accountID={accountLogin.accountData.id} postID={item.postID} post={posts[index]} handleCloseMenuToggle={handleCloseMenuToggle}/>
              </div>
            <span onClick={()=>{setToggleComment(item.postID); setShowMenuToggle(null);}} className="text-[0.75rem] text-center font-normal cursor-pointer hover:bg-stone-600  py-1">
               Comment
            </span>
            {item.accountID === accountLogin.accountData.id &&
             <div onClick={()=>{setToggleEdit(item.postID); setShowMenuToggle(null);}} className="text-[0.75rem] font-normal text-center py-1 cursor-pointer hover:bg-stone-600">
                Edit
            </div>
              }
            {item.accountID === accountLogin.accountData.id &&
              <div onClick={(event)=>{handleDeletePost(item,event)}} className="text-[0.75rem] font-normal text-center py-1 cursor-pointer hover:bg-stone-600">
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
                   <source src={`${item.video.Location}#t=0.1`} type="video/mp4" />
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
           </div>
           )
            })
            }

          {toggle === 'posts' && posts && posts.length< 1 &&
             <div className='flex-col gap-5 text-[0.85rem] text-gray-300 self-center h-full w-10/12 flex items-center justify-center'>
              {accountData._id === accountLogin.accountData._id ?
              <div className='text-center'>
                  You don't have any posts yet. Let's post something on the main page.
              </div>
              :
              <div className='text-center'>
                "{accountData.firstname} {accountData.lastname}" does not have any posts yet.
              </div>
              }
              </div>
          }
          </div>    
       </div>
      } 

      {posts.map((item, index) =>{
        return (
        <>
          {toggleComment === item.postID &&
            <div className="overlay z-[100]">
                <CommentForm tokenKey={accountLogin.token_key} post={posts[index]} postID={item.postID} postComments={item.comments}  toggleCancel={handleToggleCommentCancel} accountData={accountLogin.accountData} key={item.index}/>
            </div>
          }
          {toggleEdit === item.postID &&
                <div className="overlay z-[100]">
                    <EditForm userData={accountLogin} post={posts[index]} toggleCancelEdit={toggleCancelEdit} key={item.postID}/>
                </div>
          }
        </>
        )
      })
      }


        {/* section4 Option: All friends*/}
              {toggle === 'friends' && !chatroomToggle &&
              <div className='lg:w-9/12 w-full'>  
              <div className="p-2 bg-[#161617] md:bg-[rgba(0,0,0,0)] md:absolute top-1 left-[104px] md:left-[305px]">
                 <h1 className="text-[1rem] text-white font-normal"># {accountData.firstname === accountLogin.accountData.firstname?'My':accountData.firstname+"'s"} friends</h1>
               </div>
               <div className='bg-[#161617]  flex'>
               <button onClick={()=>{setToggle('profile'); setChatroomToggle(false)}} className={`${toggle === 'profile' && !chatroomToggle && 'text-white border-b-2 border-purple-400'} transition duration-500  hover:border-b-2 hover:border-purple-400 flex-1 py-2 px-2 shadow-md text-white bg-stone-800 text-[0.8rem]`}>
                Profile
                </button>
               <button onClick={()=>{setToggle('posts'); setChatroomToggle(false)}} className={`${toggle === 'posts' && !chatroomToggle && 'text-white border-b-2 border-purple-400'} transition duration-500  hover:border-b-2 hover:border-purple-400 flex-1 py-2 px-2 shadow-md text-white bg-stone-800 text-[0.8rem]`}>
                Posts
                </button>
                <button onClick={()=>{setToggle('friends'); setChatroomToggle(false)}} className={`${toggle === 'friends' && !chatroomToggle && 'text-white border-b-2 border-purple-400'} transition duration-500  hover:border-b-2 hover:border-purple-400 flex-1 py-2 px-2 shadow-md text-white bg-stone-800 text-[0.8rem]`}>
                Friends
                </button>
              </div>

              <div className='md:h-[88vh] h-[82dvh] overflow-y-scroll '>
                    <AllFriendList accountLogin={accountLogin} accountID={accountData._id}  />
              </div>
              </div>
            }

              {/* section4 option: Profile Info */}
            {accountData && toggle === 'profile' && !chatroomToggle &&
            <div className='lg:w-9/12 w-full'>  
            <div className="p-2 bg-[#161617] md:bg-[rgba(0,0,0,0)] md:absolute top-1 left-[104px] md:left-[305px]">
               <h1 className="text-[1rem] text-white font-normal"># {accountData.firstname === accountLogin.accountData.firstname?'My':accountData.firstname+"'s"} profile</h1>
             </div>
             <div className='bg-[#161617]  flex'>
             <button onClick={()=>{setToggle('profile'); setChatroomToggle(false)}} className={`${toggle === 'profile' && !chatroomToggle && 'text-white border-b-2 border-purple-400'} transition duration-500  hover:border-b-2 hover:border-purple-400 flex-1 py-2 px-2 shadow-md text-white bg-stone-800 text-[0.8rem]`}>
              Profile
              </button>
             <button onClick={()=>{setToggle('posts'); setChatroomToggle(false)}} className={`${toggle === 'posts' && !chatroomToggle && 'text-white border-b-2 border-purple-400'} transition duration-500  hover:border-b-2 hover:border-purple-400 flex-1 py-2 px-2 shadow-md text-white bg-stone-800 text-[0.8rem]`}>
              Posts
              </button>
              <button onClick={()=>{setToggle('friends'); setChatroomToggle(false)}} className={`${toggle === 'friends' && !chatroomToggle && 'text-white border-b-2 border-purple-400'} transition duration-500  hover:border-b-2 hover:border-purple-400 flex-1 py-2 px-2 shadow-md text-white bg-stone-800 text-[0.8rem]`}>
              Friends
              </button>
            </div>
            <div className={`w-full md:h-[88vh] h-[82dvh] pb-3 bg-[#383739] border-gray-500 text-white`}>
                  <div onClick={()=>{setShowProfileImage(true);}} className='flex-1 flex bg-stone-900 h-44 px-2 pt-28 items-center gap-1'>
                    <img src={accountData.accountImage?accountData.accountImage.secure_url:'/defaultProfile.png'} className='cursor-pointer h-24 w-24 rounded-full'/>
                  <div className='pt-2 flex flex-col'>
                     <div className='text-[0.9rem]'>{accountData.firstname} {accountData.lastname}</div>
                     <div className='text-[0.8rem]'>{accountData.username}</div>
                  </div>
                  </div>
              <div className='flex flex-col justify-center flex-1 gap-1 py-4 px-2 mt-4 text-[0.9rem]'>
                   <div className='bg-stone-800 p-2'>
                     Friends : {numberOfFriends < 2?`${numberOfFriends} friend`:`${numberOfFriends} friends`} 
                   </div>
                   {posts &&
                   <div className='bg-stone-800 p-2'>
                     Posts : {posts.length < 2 ? `${posts.length} post`:`${posts.length} posts`}
                    </div>
                  }
                  {talkingrooms &&
                    <div className='bg-stone-800 p-2'>
                      Talkingrooms : {talkingrooms.length < 2 ? `${talkingrooms.length} room`:`${talkingrooms.length} rooms`}
                    </div>
                  }
              </div>
              {accountLogin.accountData.id !== accountData.id &&
                <div className='text-center mx-2 font-semibold'>
                <AddFriends userData={accountLogin}  accountData={accountData} handleChatroomToggle={handleChatroomToggle} senderID={accountLogin.accountData._id} getterID={accountData._id}/>
                </div>
              }   
            </div>
            </div>
            }

            {/* section4 option: Chat */}
            {chatroomToggle &&
            <div className='lg:w-9/12 w-full h-screen'>
            <Chatroom userData={accountLogin} handleCloseChat={handleCloseChat}  senderData={accountLogin} getterData={accountData}/>
            </div>
           }
  
  
            {/* section5 Profile Info */}
            {accountData &&
            <div className={`w-3/12 hidden ${!chatroomToggle?'h-[88vh]':'h-screen'} pb-3 bg-[#383739] border-l border-gray-500 text-white lg:block`}>
                  <div onClick={()=>{setShowProfileImage(true);}} className='flex-1 flex bg-stone-900 h-44 px-2 pt-28 items-center gap-1'>
                    <img src={accountData.accountImage?accountData.accountImage.secure_url:'/defaultProfile.png'} className='cursor-pointer h-20 w-20 rounded-full'/>
                  <div className='pt-2 flex flex-col'>
                     <div className='text-[0.9rem] lg:break-words lg:w-20 xl:break-normal xl:w-auto'>{accountData.firstname} {accountData.lastname}</div>
                     <div className='text-[0.8rem]'>{accountData.username}</div>
                  </div>
                  </div>
              <div className='flex flex-col justify-center flex-1 gap-1 py-4 px-2 mt-4 text-[0.9rem]'>
                   <div className='bg-stone-800 p-2'>
                     Friends : {numberOfFriends < 2?`${numberOfFriends} friend`:`${numberOfFriends} friends`} 
                   </div>
                   {posts &&
                   <div className='bg-stone-800 p-2'>
                     Posts : {posts.length < 2 ? `${posts.length} post`:`${posts.length} posts`}
                    </div>
                  }
                  {talkingrooms &&
                    <div className='bg-stone-800 p-2'>
                      Talkingrooms : {talkingrooms.length < 2 ? `${talkingrooms.length} room`:`${talkingrooms.length} rooms`}
                    </div>
                  }
              </div>
              {accountLogin.accountData.id !== accountData.id && 
                <div className='text-center mx-2 font-semibold'>
                <AddFriends userData={accountLogin}  accountData={accountData} handleChatroomToggle={handleChatroomToggle} senderID={accountLogin.accountData._id} getterID={accountData._id}/>
                </div>
              }   
            </div>
            }
            </div>
      </div>
         {/* image show card from Profile Image */}
         {showProfileImage  && accountData &&
                <div className="overlay flex flex-col">
                    <div className="image-card w-auto h-auto p-3 md:w-auto bg-[rgba(0,0,0,0.7)] rounded-xl">
                    <div className="w-full h-8 text-white z-10">
                    <FontAwesomeIcon onClick={()=>{setShowProfileImage(false);}} icon={faClose} className="h-7 w-7 hover:text-gray-400 cursor-pointer"/>
                    </div>
                    <div className="p-3">
                    <img className="h-56 w-56 rounded-md" src={accountData.accountImage.secure_url} alt="Post picture"/>
                    </div>
                    </div>
                </div>
          }
      </div>
      </div>   


      <div className={`${roomOnMainLoading || MenuBarOnLoading || singleAccountLoading || displayPostLoading || allFriendGetLoading || allTalkingroomLoading ? 'block':'hidden'}`}>
       <LoaderBeforeFetching/>
      </div>
      </>
      )
     }else{
      return(
        <div className={`block`} >
        <LoaderBeforeFetching/>
        </div>
      )
     }
    
  }else if(accountData === 'notfound'){
      return <Notfound/>
  }
  }

}
