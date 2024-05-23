import axios from "axios"
import { useEffect, useState } from "react"
import Swal from "sweetalert2"
import { io } from "socket.io-client"
const socket = io(process.env.API_SOCKET_URL)

export default function Requests({accountID,roomID , userData}){
    const [requestStatus,setRequestStatus] = useState(false)
    const [loading , setLoading] = useState(true);

    //เช็คว่า User นี้ได้ส่งคำขอไปแล้วรึยีง
    useEffect(()=>{
        axios.get(`${process.env.API_URL}/get-room-request/${accountID}`,{
            headers:{
                Authorization: `Bearer ${userData.token_key}`
              }
        })
        .then((response)=>{
            setRequestStatus(response.data)
        })
        .catch((error)=>{
            setRequestStatus(false)
        })
        .finally(()=>{
            setLoading(false);
        })
    },[])
    
    //จัดการ ขอเข้าร่วมกลุ่ม
    const handleRequestToTheRoom=(event)=>{
        axios.put(`${process.env.API_URL}/room-request`,{
            accountID,roomID
        },{
            headers:{
                Authorization: `Bearer ${userData.token_key}`
              }
        })
        .then((response)=>{
            //console.log('ส่งคำขอสำเร็จ')
            //จัดการ real-time handle สำหรับการ ส่งคำขอ requester side
            socket.emit('roomRequest-requester-side',{
                id:accountID,
                requestStatus:true
            })

            socket.on('roomRequest-requester-side',({id,requestStatus})=>{
                if(id === accountID){
                    setRequestStatus(requestStatus)
                }
            })

            //จัดการ real-time handle สำหรับการ ส่งคำขอ admin side
            socket.emit('roomRequest-admin-side',{
                admins:response.data.admins
            })

            //จัดการ real-time handle สำหรับการ ส่งคำขอ creator side
            socket.emit('roomRequest-creator-side',{
                creator:response.data.creator
            })
        })
        .catch((error)=>{
            Swal.fire({
               title: "Error room requesting",
               text: error.response.data.error
         });
        })
    }


    const handleCancelTheRequest=()=>{
        axios.delete(`${process.env.API_URL}/delete-room-request`,{
            data:{accountID,roomID}
        },{
            headers:{
                Authorization: `Bearer ${userData.token_key}`
              }
        })
        .then((response)=>{
            //console.log('ยกเลิกคำขอสำเร็จ')
            //จัดการ real-time handle สำหรับการ ยกเลิกคำขอ requester side
            socket.emit('roomRequest-requester-side',{
                id:accountID,
                requestStatus:false
            })

            socket.on('roomRequest-requester-side',({id,requestStatus})=>{
                if(id === accountID){
                    setRequestStatus(requestStatus)
                }
            })

             //จัดการ real-time handle สำหรับการ ส่งคำขอ admin side
             socket.emit('roomRequest-admin-side',{
                admins:response.data.admins
            })
        })
        .catch((error)=>{
            Swal.fire({
               title: "Error room accepting",
               text: error.response.data.error
         });
        })
    }


    //เมื่อ admin รับหรือปฎิเสธเข้าร่วมกลุ่ม จะอัพเดตไปที่หน้านี้ 
    useEffect(()=>{
        const handleAcceptOrRejectFromAdmin = ({id,requestStatus}) =>{
            if(id === accountID){
                if(requestStatus){
                    setRequestStatus(requestStatus)
                    Swal.fire({
                        text: "You are permitted to join the room",
                        showConfirmButton: false,
                        timer: 1500,
                        position:'top'
                      }).then(()=>{
                        //จะ refresh อีกรอบ
                        location.reload(true)
                      })
                }else{
                    setRequestStatus(requestStatus)
                    Swal.fire({
                        icon: "error",
                        text: "You got rejected, please try again",
                        showConfirmButton: false,
                        timer: 1500,
                        position:'top'
                      })
                }
            }
        }

        socket.on('roomRequest-from-admin-requester-side',handleAcceptOrRejectFromAdmin)

        return ()=>{
            socket.off('roomRequest-from-admin-requester-side',handleAcceptOrRejectFromAdmin)
        }
    },[])
 
    if(loading){
    return (
    <div>
        <div className="loader-event-dot"></div>
    </div>
    )
    }
    else{
    return (
        <div>
        { (!requestStatus) &&
        <button onClick={handleRequestToTheRoom} className="rounded-md  hover:bg-blue-700 text-[1rem] md:text-[1.2rem] bg-blue-600 py-2 px-5">
            Request to join
        </button>
        }
         { requestStatus &&
        <button onClick={handleCancelTheRequest} className="rounded-md  hover:bg-blue-700 text-[1rem] md:text-[1.2rem] bg-blue-600 py-2 px-5">
            Pending
        </button>
        }
        </div>
    )
    }
}