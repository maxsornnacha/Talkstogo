import Link from "next/link"
import { useState,useEffect } from "react"
import AddFriendsList from "../Friends/AddFriendsForFriendRequestMenu"
import { io } from "socket.io-client"
const socket = io(process.env.API_SOCKET_URL)

export default function FriendRequest(props){
    const [friendRequestData,setFriendRequestData] = useState([])
    const [friendRequestDataLoading ,setFriendRequestDataLoading] = useState(true);
    


    useEffect(()=>{
        //console.log('Is socket connected?', socket.connected);
        socket.on(`friendRequestList`,({data,getterID})=>{
        if(getterID === props.userData.accountData._id){
            setFriendRequestData(data)
            setFriendRequestDataLoading(false);
        }
        })

        return () => {
            socket.off('friendRequestList');
        };
    },[props])

    if(friendRequestDataLoading){
    return(
    <>
    <div className="w-full text-center pt-1 pb-3 text-[1rem] font-normal"> Friend Requests </div>
    <div className="w-full flex justify-center pt-2 items-center h-full">
        <div className="loader-event-dot"></div>
    </div>
    </>
    )
    }
    else if(!friendRequestDataLoading){
    return (
    <div className="w-full">
            <div className="w-full text-center pt-1 pb-3 text-[1rem] font-normal"> Friend Requests </div>
    
    {friendRequestData.length !== 0 &&
    friendRequestData.map((accountRequester,index)=>{
    return(
    <div key={index}>
     <div className="bg-gray-700 text-white m-2 p-2 rounded-md">
        <Link href={`/profile/${accountRequester.id}`}  className="flex gap-2 items-center hover:text-violet-400 active:text-violet-400">
        <div><img src={accountRequester.accountImage} className="w-8 h-8 rounded-full"/></div>
        <div className="flex flex-col">
            <div className="text-[0.75rem] font-normal">{accountRequester.firstname} {accountRequester.lastname}</div>
            <div className="text-[0.7rem] font-normal">Username: {accountRequester.username}</div>
        </div>
        </Link>
    <div className="text-end">
        <AddFriendsList userData={props.userData} senderID={props.userData.accountData._id} getterID={accountRequester._id}/>
    </div>
    </div>
    </div>
    )})
    }

    {friendRequestData.length === 0 && !friendRequestDataLoading &&
    <div className="h-96 text-gray-200 flex justify-center items-center text-[0.75rem]"> 
        <div>No friend requests coming in yet</div>
    </div>
    }
    </div>
    )
    }
}