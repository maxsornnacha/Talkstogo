import axios from "axios"
import { useState,useEffect } from "react"
import AddFriends from "./AddFriends"
import Link from "next/link"
import Chatroom from "../Chats/Chats"
import { useToggle } from "../Chats/ToggleChatContext"



export default function AllFriendList({accountID,friendDataUpdate,accountLogin,dataFiltered}){
    const [friendData,setFriendData] = useState([])
    const [chatroomToggle,setChatroomToggle] = useState(false)
    const [msgNumber,setMsgNumber] = useState(null)
    const {isToggled3, setToggle3} = useToggle()
    const [allFriendGetLoading , setAllFriendGetLoading] = useState(true);

    
    const fetching= ()=>{
        axios.get(`${process.env.API_URL}/all-friends-get/${accountID}`,{
            headers:{
                Authorization: `Bearer ${accountLogin.token_key}`
              }
        })
        .then((response)=>{
            setFriendData(response.data)
            friendDataUpdate(response.data)
        })
        .catch((error)=>{
            console.log(error);
        })
        .finally(()=>{
            setAllFriendGetLoading(false)
        })
    }

    useEffect(()=>{
            fetching()
    },[])


      const handleChatroomToggle=(data,index)=>{
         setChatroomToggle(data)
         setMsgNumber(index)
         setToggle3()
        }

      const handleCloseChat=(data)=>{
        setChatroomToggle(data)
      }


 
    return (
    <div className="h-auto">
    <div className={`w-full grid grid-cols-12 ${allFriendGetLoading?'hidden':'grid'}`}>
    
        {friendData && friendData.length > 0 && !dataFiltered &&
        friendData.map((friendAccountData,index)=>{
        return(
        <div key={index} className="py-2 bg-stone-800 border border-gray-600 text-white rounded-md m-1 lg:col-span-4 xl:col-span-3 col-span-12">
             {/* responsive design for notebook and pc*/}
             <Link href={`/profile/${friendAccountData.id}`} className="flex">
            <div className="flex justify-center">
                <img src={friendAccountData.accountImage} className="h-9 w-9 md:rounded-full m-2  rounded-t-md hidden md:block" />
            </div>
            <div className="flex flex-col justify-center">
            <div className="text-[0.8rem] font-normal w-full break-words  hidden md:block">{friendAccountData.firstname} {friendAccountData.lastname}</div>
            <div className="text-[0.75rem] hidden md:block">{friendAccountData.username}</div>
            </div>
            </Link>
            {!(accountLogin.accountData._id === friendAccountData._id) &&
            <div className="justify-end items-end hidden md:flex lg:h-20 md:h-14 p-1">
                <AddFriends userData={accountLogin} accountData={friendAccountData} index={index} handleChatroomToggle={handleChatroomToggle} senderID={accountLogin.accountData._id} getterID={friendAccountData._id} />
            </div>
            }
            {accountLogin.accountData._id === friendAccountData._id &&
            <div className="md:flex md:h-10 lg:h-20 hidden text-[0.8rem] py-4 justify-center w-full">
                This is yourself
            </div>
            }
         
            
             {/* responsive design for mobile */}
            <div className="flex justify-between md:hidden h-auto px-1 py-2">
            <Link href={`/profile/${friendAccountData.id}`} className="flex items-center gap-1 w-7/12 ">
                <img src={friendAccountData.accountImage} className="w-8 h-8 rounded-full" />
                <div className="flex flex-col">
                <div className="text-[0.75rem] text-start font-semibold w-full break-words ">{friendAccountData.firstname} {friendAccountData.lastname}</div>
                <div className="text-[0.7rem] text-start">Username : {friendAccountData.username}</div>
                </div>
            </Link>
            {!(accountLogin.accountData._id === friendAccountData._id) &&
            <div className="flex justify-center w-5/12"><AddFriends userData={accountLogin} accountData={friendAccountData} index={index} handleChatroomToggle={handleChatroomToggle} senderID={accountLogin.accountData._id} getterID={friendAccountData._id} /></div>
            }
            </div>
           
        {chatroomToggle && index === msgNumber && isToggled3 &&
            <div>
                <Chatroom userData={accountLogin}  handleCloseChat={handleCloseChat} senderData={accountLogin} getterData={friendAccountData}/>
            </div>
         }
        </div>
        )
        })
        }

        {/* You dont have friends yet */}
        {friendData && friendData.length === 0 && !dataFiltered &&
             <div className="col-span-12 w-full ">
               <div className='w-full text-gray-200 flex justify-center items-center h-[77vh]'>
                    <div className='text-[0.85rem] text-gray-200'>There are no any friends.</div>
             </div>
             </div>
        }


        {/* Searched friend list*/}
        {dataFiltered &&
         dataFiltered.map((friendAccountData,index)=>{
            return(
            
                <div key={index} className="py-2 bg-stone-800 border border-gray-600 text-white rounded-md m-1 lg:col-span-4 xl:col-span-3 col-span-12">
             {/* responsive design for notebook and pc*/}
             <Link href={`/profile/${friendAccountData.id}`} className="flex">
            <div className="flex justify-center">
                <img src={friendAccountData.accountImage} className="h-9 w-9 md:rounded-full m-2  rounded-t-md hidden md:block" />
            </div>
            <div className="flex flex-col justify-center">
            <div className="text-[0.8rem] font-normal w-full break-words  hidden md:block">{friendAccountData.firstname} {friendAccountData.lastname}</div>
            <div className="text-[0.75rem] hidden md:block">{friendAccountData.username}</div>
            </div>
            </Link>
            {!(accountLogin.accountData._id === friendAccountData._id) &&
            <div className="justify-end items-end hidden md:flex lg:h-20 md:h-14 p-1">
                <AddFriends userData={accountLogin} accountData={friendAccountData} index={index} handleChatroomToggle={handleChatroomToggle} senderID={accountLogin.accountData._id} getterID={friendAccountData._id}  />
            </div>
            }
            {accountLogin.accountData._id === friendAccountData._id &&
            <div className="md:flex md:h-10 lg:h-20 hidden text-[0.8rem] py-4 justify-center w-full">
                This is yourself
            </div>
            }
            
               
                 {/* responsive design for mobile*/}
            <div className="flex justify-between md:hidden h-auto px-1 py-2">
            <Link href={`/profile/${friendAccountData.id}`} className="flex items-center gap-1 w-7/12 ">
                <img src={friendAccountData.accountImage} className="w-8 h-8 rounded-full" />
                <div className="flex flex-col">
                <div className="text-[0.75rem] text-start font-semibold w-full break-words ">{friendAccountData.firstname} {friendAccountData.lastname}</div>
                <div className="text-[0.7rem] text-start">Username : {friendAccountData.username}</div>
                </div>
            </Link>
            {!(accountLogin.accountData._id === friendAccountData._id) &&
            <div className="flex justify-center w-5/12"><AddFriends accountData={friendAccountData} index={index} handleChatroomToggle={handleChatroomToggle} senderID={accountLogin.accountData._id} getterID={friendAccountData._id} /></div>
            }
            </div>
               
            {chatroomToggle && index === msgNumber &&
                <div>
                    <Chatroom userData={accountLogin}   handleCloseChat={handleCloseChat} senderData={accountLogin} getterData={friendAccountData} />
                </div>
             }
            </div>
            )
            })
        }

        {dataFiltered && dataFiltered.length === 0 &&
        <div className="col-span-12">  
        <div className="flex justify-center items-center h-[77vh]">
            <div className="text-[0.85rem] text-gray-200">Not found the friend being searched</div>
        </div>
        </div>
        }
    </div>

    <div className={`${allFriendGetLoading?'flex':'hidden'} h-screen justify-center items-center`}>
    <div className="loader-event-dot"></div>
    </div>
    </div>
    )
}