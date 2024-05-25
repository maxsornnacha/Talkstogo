import { useState,useEffect } from "react"
import axios from "axios"
import Link from "next/link"
import Swal from "sweetalert2"
import { io } from "socket.io-client"
const socket = io(process.env.API_SOCKET_URL)

export default function TalkingRoom({userData}){

    const [notifiedData,setNotifiedData] = useState(null)
    const [allRoomsRequestedLoading, setAllRoomsRequestedLoading] = useState(true);

    const fetchingRoomRequest=()=>{
        axios.get(`${process.env.API_URL}/all-room-requested/${userData.accountData._id}`,{
            headers:{
                Authorization: `Bearer ${userData.token_key}`
            }
        })
        .then((response)=>{
            setNotifiedData((response.data).reverse())
        })
        .catch((error)=>{
            setNotifiedData(null)
        })
        .finally(()=>{
            setAllRoomsRequestedLoading(false);
        })

    }



    useEffect(()=>{
      
        fetchingRoomRequest()

    },[userData])

    


    //กรณีมีคนส่งคำขอมาหรือยกเลิกมาแล้ว เราเป็น admin จะอัพเดตคำขอ อัตโนมัติ
    useEffect(()=>{
        const handleUpdateRoomRequest = async ({admins}) =>{
            const isAdmin = await admins.filter((admin)=>{
                return (admin.participant === userData.accountData._id)
            })

            if(isAdmin.length !== 0){
                fetchingRoomRequest()
            }
     
        }

        socket.on('roomRequest-admin-side',handleUpdateRoomRequest)
        
        return ()=>{
            socket.off('roomRequest-admin-side',handleUpdateRoomRequest)
        }
    },[])

      //กรณีมีคนส่งคำขอมาหรือยกเลิกมาแล้ว เราเป็น creator จะอัพเดตคำขอ อัตโนมัติ
      useEffect(()=>{
        const handleUpdateRoomRequest = async ({creator}) =>{
     
            const isCreator = await creator.filter((creator)=>{
                return (creator.participant === userData.accountData._id)
            })

            if(isCreator.length !== 0){
                fetchingRoomRequest()
            }
        }

        socket.on('roomRequest-creator-side',handleUpdateRoomRequest)
        
        return ()=>{
            socket.off('roomRequest-creator-side',handleUpdateRoomRequest)
        }
    },[])


    const handleAccept = (roomRequestedID,requesterID) =>{
        axios.put(`${process.env.API_URL}/accept-room-requested`,{
            roomRequestedID,requesterID
        },{
            headers:{
                Authorization: `Bearer ${userData.token_key}`
            }
        })
        .then((response)=>{
            //จะได้ขอมูลห้องแบบเดี่ยวที่อัพเดตแล้ว

            //เมื่อปฎิเสธแล้ว จะทำการอัพเดตไปให้ requester side อัตโนมัติ
            socket.emit('roomRequest-from-admin-requester-side',{
                id:requesterID,
                requestStatus:true
            })

             //ทำการอัดเดตข้อมูลอีกรอบไปที่ Navbar และ componentนี้ให้แก่ Admin ทุกคน เมื่อ ยอมรับคำขอ แล้ว
             //จะจัดการ real-time handle สำหรับการ ตอบรับคำขอทางด้าน admin side
             socket.emit('roomRequest-admin-side',{
                admins:response.data.admins
            })

            //ทำการอัดเดตข้อมูลอีกรอบไปที่ Navbar และ componentนี้ให้แก่ Creator ทุกคน เมื่อ ยอมรับคำขอ แล้ว
             //จะจัดการ real-time handle สำหรับการ ตอบรับคำขอทางด้าน Creator side
            socket.emit('roomRequest-creator-side',{
                creator:response.data.creator
            })

            //เมื่อ Admins กดยอมรับ จะทำการอัพเดตห้องแชทที่ได้ระบุไว้ ให้อัพเดตข้อมูล
            socket.emit('room-update-after-accepted',{
                roomID:roomRequestedID,
                roomData:response.data
            })

            //จะทำการเพิ่มห้องพูดคุยให้ทั้งใน room on main และ slug talkingroom ของ requester
            socket.emit('room-update-after-accepted-from-requester-side',{
                requesterID:requesterID,
                roomData:response.data
            })

        })
        .catch((error)=>{
            Swal.fire({
                icon:'error',
                title:'เกิดข้อผิดพลาด',
                text:error.response.data.error
            })
        })
    }

    const handleReject = (roomRequestedID,requesterID) =>{
        axios.delete(`${process.env.API_URL}/reject-room-requested`,{
            data:{roomRequestedID,requesterID}
        },{
            headers:{
                Authorization: `Bearer ${userData.token_key}`
            }
        })
        .then((response)=>{
            //จะได้ขอมูลห้องแบบเดี่ยวที่อัพเดตแล้ว
            
            
             //เมื่อปฎิเสธแล้ว จะทำการอัพเดตไปให้ requester side อัตโนมัติ
             socket.emit('roomRequest-from-admin-requester-side',{
                id:requesterID,
                requestStatus:false
            })

             //ทำการอัดเดตข้อมูลอีกรอบไปที่ Navbar และ componentนี้ให้แก่ Admin ทุกคน เมื่อ ยอมรับคำขอ แล้ว
             //จะจัดการ real-time handle สำหรับการ ตอบรับคำขอทางด้าน admin side
             socket.emit('roomRequest-admin-side',{
                admins:response.data.admins
            })

            //ทำการอัดเดตข้อมูลอีกรอบไปที่ Navbar และ componentนี้ให้แก่ Creator ทุกคน เมื่อ ยอมรับคำขอ แล้ว
            //จะจัดการ real-time handle สำหรับการ ตอบรับคำขอทางด้าน Creator side
             socket.emit('roomRequest-creator-side',{
                creator:response.data.creator
            })
        })
        .catch((error)=>{
            Swal.fire({
                icon:'error',
                title:'เกิดข้อผิดพลาด',
                text:error.response.data.error
            })
        })
    }

    if(allRoomsRequestedLoading){
    return(
    <>
    <div className="w-full text-center pt-1 pb-3 text-[1rem] font-normal"> Talkingroom Requests </div>
        <div className="w-full flex justify-center pt-2 items-center h-full">
        <div className="loader-event-dot"></div>
    </div>
    </>
    )
    }
    else{
    return(
    <div className="w-full">
           <div className="w-full text-center pt-1 pb-3 text-[1rem] font-normal"> Talkingroom Requests </div>
            {notifiedData &&
            notifiedData.map((data,index)=> { 
            return (
            <div key={index} className="py-2 px-2 bg-gray-700 my-2 mx-2 rounded-md"> 
                <div className="flex gap-1 items-center">
                <Link href={`/rooms/talking-room/${data.roomRequested.slug}`}>  
                <img src={data.roomRequested.roomIcon?data.roomRequested.roomIcon.secure_url:'/black-background.jpg'} className="w-8 h-8 rounded-full"/>
                </Link>

                <div>  
                    <Link href={`/rooms/talking-room/${data.roomRequested.slug}`} className="hover:text-purple-400 active:text-purple-400 text-[0.75rem] font-normal">Room : '{data.roomRequested.roomName}'</Link> 
                </div>
                </div>

                <div className="flex flex-wrap gap-1">
                    <div className="text-[0.7rem] flex gap-2 items-center">From : </div>
                    <Link href={`/profile/${data.requesterInfo.id}`} className="font-normal text-[0.7rem] flex items-center gap-1 hover:text-purple-400 active:text-purple-400">
                        <img src={data.requesterInfo.accountImage.secure_url} className="w-6 h-6 rounded-full"/>
                        {data.requesterInfo.firstname} {data.requesterInfo.lastname}
                    </Link>
                </div>

                <div className="flex gap-1 justify-end">
                    <button onClick={()=>handleAccept(data.roomRequested._id,data.requesterInfo._id)} className="text-[0.75rem] py-1 px-3 rounded-md bg-purple-600 hover:bg-purple-700 text-white shadow-md">Accept</button>
                    <button onClick={()=>handleReject(data.roomRequested._id,data.requesterInfo._id)} className="text-[0.75rem] py-1 px-3 rounded-md bg-stone-800 hover:bg-stone-700 text-white shadow-md">Reject</button>
                </div>
            </div>
            )})
            }
            
            {!notifiedData &&
            <div className="h-96 text-gray-200 flex justify-center items-center text-[0.75rem]"> 
                    No Talkingroom requests coming in yet
            </div>
            }
    </div>
    )
    }
}