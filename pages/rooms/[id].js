import MenuBarOn from "@/components/Menus/MenuBarOnLeft"
import Navbar from "@/components/Navbars/NavbarOther"
import { useState,useEffect } from "react"
import { useRouter } from "next/router"
import axios from "axios"
import Link from "next/link"
import UserDataFetching from "@/services/UserDataFetching"
import Notfound from "@/components/404"
import RoomsOnMain from "@/components/TalkingRooms/RoomsOnMain"
import FriendInvite from "@/components/TalkingRooms/FriendInvite"
import { io } from "socket.io-client"
import LoaderBeforeFetching from "@/components/loader/LoaderBeforeFethcing"
import Head from "next/head"
const socket = io(process.env.API_SOCKET_URL)

export default function Rooms(){
    const [userLogin,setUserLogin] = useState(null)
    const [accountData,setAccountData] = useState(null)
    const [talkingrooms,setTalkingrooms] = useState(null)
    const [inputValue,setInputValue] =  useState('')
    const [dataFiltered,setDataFiltered] = useState(null)
    const [invite,setInvite] = useState(false)
    const [indexOfInvite,setIndexOfInvite] = useState(null)

    const [menuBarOnLeftLoading,setMenuBarOnRightLoading] = useState(true);
    const [roomOnMainLoading , setRoomOnMainLoading] = useState(true);
    const [singleAccountDataLoading , setSingleAccountDataLoading] = useState(true);
    const [allTalkingroomsLoading , setAllTalkingRoomsLoading] = useState(true);

    const MenuBarOnLoadingStatus=()=>{
        setMenuBarOnRightLoading(false);
      }
  
      const RoomsOnMainLoadingStatus=()=>{
        setRoomOnMainLoading(false);
      }

    const router = useRouter()
    const {id} = router.query

     //fetching my account Data
     useEffect(() => {
        const fetchData = async () => {
          setUserLogin(await UserDataFetching());   

        if(!(await UserDataFetching())){
            router.push('/')
          }
        };
        fetchData();
      }, [id]);
   
    const fetchData = async () => {
        await axios.get(`${process.env.API_URL}/single-account-data/${id}`,{
            headers:{
                Authorization: `Bearer ${userLogin.token_key}`
            }
        })
        .then( (response)=>{
        setAccountData(()=>{
            return {'accountData':response.data}
        })

      })
      .catch((error)=>{
        console.log(error)
      })
      .finally(()=>{
        setSingleAccountDataLoading(false);
      })
    };

    
    useEffect(() => {
        if(userLogin){
        if (id === userLogin.accountData.id) {
            fetchData();
        }else{
            setSingleAccountDataLoading(false);
            setAllTalkingRoomsLoading(false);
        }
        }
      
        },[userLogin]);

      
      
      useEffect(()=>{

        const fetchTalkingRooms =()=>{
            if(accountData){
            axios.post(`${process.env.API_URL}/all-talkingrooms`,{userID:(accountData.accountData._id)},{
                headers:{
                    Authorization: `Bearer ${userLogin.token_key}`
                }
            })
            .then((response)=>{
                setTalkingrooms(response.data)
            })
            .catch((error)=>{
                console.log(error.response.data)
            })
            .finally(()=>{
                setAllTalkingRoomsLoading(false);
            })
            }
         }
    
        fetchTalkingRooms()
        
    },[accountData])


    const handleSearch = async (event)=>{
        event.preventDefault()
        await setDataFiltered((talkingrooms).filter((room)=>{

            return (
            (`${room.roomName}`).toLowerCase().includes(inputValue.toLowerCase())
            )
        }))
        if(inputValue === ''){
            setDataFiltered(null)
        }
    }

    //จัดการการปิด Invitation card
     const handleCloseInviteCard = (status)=>{
        setInvite(status)
      }

    //เมื่อมีการแก้ไขข้อมูลห้องพูดคุย
       useEffect(()=>{
        const handleUpdateRoomAfterCreatingChatroomOrTalkingroom = ({roomUpdated}) =>{
            setTalkingrooms((prev)=>{
                return prev.map((room)=>{
                    if(room._id === roomUpdated._id){
                        return roomUpdated
                    }
                    return room
                })
            })
        }

        socket.on('new-talkingroom-or-chatroom-created',handleUpdateRoomAfterCreatingChatroomOrTalkingroom)

        return ()=>{
          socket.off('new-talkingroom-or-chatroom-created',handleUpdateRoomAfterCreatingChatroomOrTalkingroom)
        }

      },[talkingrooms])

       //เมื่อห้องถูกลบแล้ว ห้องพูดคุยที่ถูกลบจะทำการถูกกรองออกไป
       useEffect(()=>{
        const handleRoomDeleted = ({roomDeleted}) =>{
            setTalkingrooms((prev)=>{
                return prev.filter((room)=>{
                    return room._id!== roomDeleted._id
                })
            })
        }
        socket.on('room-deleting',handleRoomDeleted)

        return ()=>{
          socket.off('room-deleting',handleRoomDeleted)
        }  
      },[talkingrooms])

         //คนที่ถูกไล่ออกจากห้องพูดคุย จะลบห้องพูดคุยในนี้ไปด้วย
         useEffect(()=>{
            const handleRoomDeletedForUserKickedOut = ({roomDeleted , userKickedOut}) =>{
                if(userKickedOut === userLogin.accountData._id){
                    setTalkingrooms((prev)=>{
                        return prev.filter((room)=>{
                            return room._id !== roomDeleted._id
                        })
                    })
                }
    
            }
            socket.on('room-deleted-on-roomOnMain-for-userKickedOut',handleRoomDeletedForUserKickedOut)
    
            return ()=>{
                socket.off('room-deleted-on-roomOnMain-for-userKickedOut',handleRoomDeletedForUserKickedOut)
            }
    
          },[talkingrooms , userLogin])

       //คนที่ถูกยอมรับเข้าห้องพูดคุย จะเพิ่มพูดคุยในนี้ให้
       useEffect(()=>{
        const handleRoomAddAcceptedRoomForRequester = ({ requesterID, roomData }) =>{
            if(requesterID === userLogin.accountData._id){
                setTalkingrooms((prev)=>{
                    return [roomData, ...prev];
                })
            }

        }
        socket.on('room-update-after-accepted-from-requester-side',handleRoomAddAcceptedRoomForRequester)

        return ()=>{
            socket.off('room-update-after-accepted-from-requester-side',handleRoomAddAcceptedRoomForRequester)
        }

      },[talkingrooms , userLogin])
      
      if(!singleAccountDataLoading && !allTalkingroomsLoading){
        //เช็คว่าล็อคอินรึยัง ล็อคอินตรงกันมั้ย
        if( id === userLogin.accountData.id ){

            return(
                <>
                <Head>
                    <title>Talkingrooms | TalksToGo</title>
                </Head>
                <div className="bg-[#383739] w-full">
                <div className={`w-full ${!roomOnMainLoading && !menuBarOnLeftLoading && !singleAccountDataLoading && !allTalkingroomsLoading?'flex':'hidden'}`}>
                
                <div className="w-[70px] bg-[#050111]">
                <RoomsOnMain userData={userLogin} RoomsOnMainLoadingStatus={RoomsOnMainLoadingStatus}/>
                </div>
      
                <div className="hidden md:block text-white h-screen overflow-hidden hover:overflow-y-auto bg-[#161617]">
                <MenuBarOn userData={userLogin} MenuBarOnLoadingStatus={MenuBarOnLoadingStatus}/>
                </div>
      
              <div className="flex-1">
                <Navbar userData={userLogin}/>
            
            {accountData &&
            <div className="text-white">
                
                <div className="bg-[#161617] px-2 h-[40px] text-[1rem] flex justify-between items-center">
                <div># Talkingrooms</div>
                <div className="justify-center hidden md:flex">
                        <input placeholder="Search the name or username" value={inputValue} onChange={(event)=>setInputValue(event.target.value)} type="text" className="px-2 py-1 bg-stone-800 rounded-l-2xl w-56  text-[0.75rem] outline-none border border-gray-600 focus:border-purple-700"/>
                        <button onClick={handleSearch} className="rounded-r-2xl px-3 text-[0.75rem] bg-purple-600 text-white  hover:bg-purple-700 py-1">Search</button>
                </div>
                </div>

                <div className="justify-center flex md:hidden p-2">
                        <input placeholder="Search the name or username" value={inputValue} onChange={(event)=>setInputValue(event.target.value)} type="text" className="px-2 py-1 bg-gray-900 rounded-l-2xl  w-full text-[0.75rem] outline-none border border-gray-600 focus:border-purple-700"/>
                        <button onClick={handleSearch} className="rounded-r-2xl px-3 text-[0.75rem] bg-purple-600 text-white  hover:bg-purple-700 py-1">Search</button>
                </div>
            
                {/* responsive on Ipad and PC for not searched*/}
                {talkingrooms && !dataFiltered && talkingrooms.length !== 0 &&
                <div className="hidden max-h-[85vh] h-auto overflow-y-auto md:grid grid-cols-12">
                {
                talkingrooms.map((room,index)=>{
                return (
                <div className="md:col-span-6 lg:col-span-3 m-2 break-words rounded-lg bg-stone-800 border border-gray-600 max-h-56" key={index}>
                    <div className="flex bg-[#050111]">
                    {/* Room icon and name */}
                    <div className="flex-1 flex items-center gap-1 p-2 break-all">
                    {room.roomIcon ?
                    <Link href={`/rooms/talking-room/${room.slug}`}>
                    <img src={room.roomIcon.secure_url} className="h-12 w-12 rounded-full"/>
                    </Link>
                    :
                    <Link href={`/rooms/talking-room/${room.slug}`} className="bg-[#383739] rounded-full h-12 w-12">&nbsp;&nbsp;&nbsp;</Link>
                    }
                    <Link href={`/rooms/talking-room/${room.slug}`} className="text-[0.8rem] text-start hover:text-purple-400">
                        {room.roomName.length > 15 ? room.roomName.slice(0,15)+'...':room.roomName}
                    </Link>
                    </div>
                    </div>

                    {/* Room description */}
                    <div className="flex flex-col justify-between rounded-b-md h-36 w-full ">
                        <div className="flex flex-col h-24 p-1">
                        <div className="text-[0.75rem] py-1">Description :</div>
                        <div className="text-[0.7rem] break-all self-start ps-2">
                            {room.roomDescription.length === 0 ?'No description':room.roomDescription}
                        </div>
                        </div>
                        {/* entering and inviting button*/}
                        <div className="flex-1 flex justify-center items-center gap-1 px-2">
                            <button onClick={()=>{setIndexOfInvite(index+1); setInvite(true);}} className="bg-indigo-600 hover:bg-indigo-700 rounded-md w-full text-[0.75rem] py-2">Invite</button>
                            {invite && indexOfInvite && indexOfInvite === index+1 && 
                                        
                                        <div className="overlay z-40">
                                            <FriendInvite userData={userLogin} roomYouAreIn={room} handleCloseInviteCard={handleCloseInviteCard}/>
                                       </div>
                            }
                            <Link  href={`/rooms/talking-room/${room.slug}`} className="text-center bg-purple-600 hover:bg-purple-700 py-2 rounded-md w-full text-[0.75rem]">Enter</Link>
                        </div>  
                    </div> 
                </div>
                )
                })
                }
                </div>
                }
            
                {/* responsive on Ipad and PC after searching*/}
                {talkingrooms && dataFiltered && dataFiltered.length !== 0 &&
                 <div className="hidden max-h-[85vh] h-auto overflow-y-auto md:grid grid-cols-12">
                {
                dataFiltered.map((room,index)=>{
                return (
                    <div className="md:col-span-6 lg:col-span-3 m-2 break-words rounded-lg bg-stone-800 border border-gray-600 max-h-56" key={index}>
                    <div className="flex bg-[#050111]">
                    {/* Room icon and name */}
                    <div className="flex-1 flex items-center gap-1 p-2 break-all">
                    {room.roomIcon ?
                    <Link  href={`/rooms/talking-room/${room.slug}`}>
                    <img src={room.roomIcon} className="h-12 w-12 rounded-full"/>
                    </Link>
                    :
                    <Link href={`/rooms/talking-room/${room.slug}`} className="bg-[#383739] rounded-full h-12 w-12">&nbsp;&nbsp;&nbsp;</Link>
                    }
                    <Link href={`/rooms/talking-room/${room.slug}`} className="text-[0.8rem]  text-start hover:text-purple-400">
                        {room.roomName.length > 15 ? room.roomName.slice(0,15)+'...':room.roomName}
                    </Link>
                    </div>
                    </div>

                    {/* Room description */}
                    <div className="flex flex-col justify-between rounded-b-md h-36 w-full ">
                        <div className="flex flex-col h-24 p-1">
                        <div className="text-[0.75rem] py-1">Description :</div>
                        <div className="text-[0.7rem] break-all self-start ps-2">
                            {room.roomDescription.length === 0 ?'No description':room.roomDescription}
                        </div>
                        </div>
                        {/* entering and inviting button*/}
                        <div className="flex-1 flex justify-center items-center gap-1 px-2">
                            <button onClick={()=>{setIndexOfInvite(index+1); setInvite(true);}} className="bg-indigo-600 hover:bg-indigo-700 rounded-md w-full text-[0.75rem] py-2">Invite</button>
                            {invite && indexOfInvite && indexOfInvite === index+1 && 
                                        
                                        <div className="overlay z-40">
                                            <FriendInvite userData={userLogin} roomYouAreIn={room} handleCloseInviteCard={handleCloseInviteCard}/>
                                       </div>
                            }
                            <Link  href={`/rooms/talking-room/${room.slug}`} className="text-center bg-purple-600 hover:bg-purple-700 py-2 rounded-md w-full text-[0.75rem]">Enter</Link>
                        </div>  
                    </div>
                </div>
                )
                })
                }
                </div>
                }
            
             
                {/* responsive on Mobile for not searched*/}
                {talkingrooms && !dataFiltered && talkingrooms.length !== 0 &&
                 <div className="md:hidden h-[80dvh] overflow-y-auto">
                {
                talkingrooms.map((room,index)=>{
                return (
                <div className="w-full bg-stone-800 border border-gray-600 text-white p-2 my-1" key={index}>      
                <div className=" flex justify-between w-full ">
                        {/* room icon and name */}
                        <div className="flex-1 flex items-center gap-2">
                        <img src={room.roomIcon?room.roomIcon.secure_url:'/black-background.jpg'} className="h-10 w-10 rounded-full"/>
                        <div className="flex flex-col">
                        <div className="text-[0.75rem] break-words">
                           {room.roomName.length > 15 ? room.roomName.slice(0,15)+'...':room.roomName}
                        </div>
                        <div className="text-[0.7rem] break-all text-gray-300">
                           Description: {room.roomDescription.length === 0 ? 'No description':(room.roomDescription.length > 17 ? room.roomDescription.slice(0,17)+'...':room.roomDescription)}
                        </div>
                        </div>

                        </div>

                        <div className="flex flex-col justify-center items-center gap-1 pe-2">
                            <button onClick={()=>{setIndexOfInvite(index+1); setInvite(true);}} className="bg-indigo-600 hover:bg-indigo-700 rounded-md w-full text-[0.75rem] py-1 px-5">Invite</button>
                            {invite && indexOfInvite && indexOfInvite === index+1 && 
                                        
                                        <div className="overlay z-40">
                                            <FriendInvite userData={userLogin} roomYouAreIn={room} handleCloseInviteCard={handleCloseInviteCard}/>
                                       </div>
                            }
                            <Link  href={`/rooms/talking-room/${room.slug}`} className="text-center bg-purple-600 hover:bg-purple-700 rounded-md w-full text-[0.75rem] py-1 px-5">Enter</Link>
                        </div>

                </div>
                </div>
                )
                })
                }
                </div>
                }
              
                
                {/* responsive on Mobile after being searched*/}
                {talkingrooms && dataFiltered && dataFiltered.length !== 0 &&
                <div className="md:hidden  h-[80dvh] overflow-y-scroll">
                {dataFiltered.map((room,index)=>{
                return (
                    <div className="w-full bg-stone-800 border border-gray-600 text-white p-2 my-1" key={index}>      
                    <div className=" flex justify-between w-full ">
                            {/* room icon and name */}
                            <div className="flex-1 flex items-center gap-2">
                            <img src={room.roomIcon?room.roomIcon.secure_url:'/black-background.jpg'} className="h-10 w-10 rounded-full"/>
                            <div className="flex flex-col">
                            <div className="text-[0.75rem] break-words">
                               {room.roomName.length > 15 ? room.roomName.slice(0,15)+'...':room.roomName}
                            </div>
                            <div className="text-[0.7rem] break-all text-gray-300">
                               Description: {room.roomDescription.length === 0 ? 'No description':(room.roomDescription.length > 17 ? room.roomDescription.slice(0,17)+'...':room.roomDescription)}
                            </div>
                            </div>
    
                            </div>
    
                            <div className="flex flex-col justify-center items-center gap-1 pe-2">
                                <button onClick={()=>{setIndexOfInvite(index+1); setInvite(true);}} className="bg-indigo-600 hover:bg-indigo-700 rounded-md w-full text-[0.75rem] py-1 px-5">Invite</button>
                                {invite && indexOfInvite && indexOfInvite === index+1 && 
                                            
                                            <div className="overlay z-40">
                                                <FriendInvite userData={userLogin} roomYouAreIn={room} handleCloseInviteCard={handleCloseInviteCard}/>
                                           </div>
                                }
                                <Link  href={`/rooms/talking-room/${room.slug}`} className="text-center bg-purple-600 hover:bg-purple-700 rounded-md w-full text-[0.75rem] py-1 px-5">Enter</Link>
                            </div>
    
                    </div>
                    </div>
                )
                })
                }
                </div>
                }
            
                    {/* responsive all  ค้นหาไม่เจอ */}
                {dataFiltered && dataFiltered.length === 0 &&
                    <div className="h-[83vh]">  
                    <div className="flex justify-center items-center text-white h-[83vh]">
                        <div className="text-[0.8rem]">Not found the room being searched</div>
                    </div>
                    </div>
                }
                
            
                {talkingrooms && talkingrooms.length === 0 && !dataFiltered &&
                         <div className="col-span-12">
                           <div className='flex justify-center items-center text-white h-[83vh]'>
                                <div className='text-[0.8rem]'>There is still no Talkingrooms being joined</div>
                         </div>
                         </div>
                }
            
                </div>
          
            }
            
            </div>
            </div>

        <div className={`${!roomOnMainLoading && !menuBarOnLeftLoading && !singleAccountDataLoading && !allTalkingroomsLoading?'hidden':'block'}`} >
        <LoaderBeforeFetching/>
        </div>

            </div>
            </>
            )

        }else{
            return <Notfound/>
        }
    }else{
    return(
        <div className={`block`} >
        <LoaderBeforeFetching/>
        </div> 
    )
    }

}