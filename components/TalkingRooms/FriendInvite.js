import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft, faLink } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { io } from 'socket.io-client'
import Link from "next/link"
import { createRoomID } from "@/modules/modules";
import Swal from "sweetalert2";
import LoaderPage from "../loader/LoaderPage";
const socket = io(process.env.API_SOCKET_URL)

export default function FriendInvite({userData , handleCloseInviteCard , roomYouAreIn}){

    const [friendData,setFriendData] = useState(null)
    const [inputValue,setInputValue] = useState('')
    const [dataFiltered,setDataFiltered] = useState(null)

    const [allFriendLoading , setAllFriendLoading] = useState(true);
    const [sendMsgLoading , setSendMsgLoading] = useState(false);


    //handleCopyLink
    const handleCopyLink=(link)=>{
        navigator.clipboard.writeText(`${process.env.CLIENT_URL}/rooms/talking-room/${roomYouAreIn.slug}`)
        .then(()=>{
          Swal.fire({
            text:"Successfully copied", 
            showConfirmButton: false,
            timer: 1500,
            position:"top"
          })
        })
        .catch((error) => {
          Swal.fire({
            title: "Error friend inviting",
            text: error || "An error has occurred ! failed to copy the link"
          })
          });
      }

      //ทำการดึงบัญชีข้อมูลเพื่อนทั้งหมด
      useEffect(()=>{

        const fetching= ()=>{
          axios.get(`${process.env.API_URL}/all-friends-get/${userData.accountData._id}`,{
            headers:{
              Authorization: `Bearer ${userData.token_key}`
            }
          })
          .then((response)=>{
              setFriendData(response.data)
          })
          .catch((error)=>{
              console.log(error)
          })
          .finally(()=>{
              setAllFriendLoading(false)
          })
      }
      
      fetching()

      },[userData])

        //จัดการการส่งข้อความลงใน DB
    const handleSendMsg=(getterID)=>{

      //สร้าง roomID ไว้สำหรับทั้ง 2 คนโดยเฉพาะ
      const roomID = createRoomID(userData.accountData._id,getterID)
      
      setSendMsgLoading(true);

      axios.put(`${process.env.API_URL}/send-message`,{
          senderID:userData.accountData._id,
          getterID:getterID,
          message:`${process.env.CLIENT_URL}/rooms/talking-room/${roomYouAreIn.slug}`,
      },{
        headers:{
          Authorization: `Bearer ${userData.token_key}`
        }
      })
      .then(async (response)=>{
          //ทำการส่ง message realtime ผ่าน socket โดยใช้ roomIDเป็นตัวแบ่งห้อง
          await socket.emit('sendMsg',{roomIDGet:roomID,message:response.data[response.data.length-1]})
          socket.emit('notify-navbar',{getterID:getterID , type:'message'})
          
          //อัพเดตไปที่ messenger และ navbar เมื่อลิงค์ถูกส่ง
           await axios.get(`${process.env.API_URL}/all-messages/${getterID}`,{
            headers:{
              Authorization: `Bearer ${userData.token_key}`
            }
           })
            .then((response)=>{
                //สามารถเขียน Logic ตรงนี้เพื่อกรองหาแชทที่ไม่ได้อ่าน
                if(response.data && getterID){
                    const  filteredIsnotRead = (response.data).filter((chatBox,index)=>{
    
                        const filter = chatBox.messages.filter((message) => {
                            return message.senderID !== getterID && message.isRead === false
                        });
                      
    
                        return (filter.length > 0)
                    })
                    socket.emit('allMessages',{data:response.data, newUnreadMessages:filteredIsnotRead.length, userID:getterID})
                }
            })
            .catch((error)=>{
                console.log(error)
            })


          //แจ้งเตือนว่าส่งข้อความเรียบร้อย
          await Swal.fire({
            text:"Successfully invited", 
            showConfirmButton: false,
            timer: 1500,
            position:"top"
          })
        })
      .catch(async (error)=>{
        await Swal.fire({
          title: "Error friend inviting",
          text:"An error has occurred ! failed to send message"
        })
      })
      .finally(()=>{
        setSendMsgLoading(false);
      })

    }

    //ค้นหารายชื่อเพื่อน
    useEffect(()=>{
      if(friendData){
      setDataFiltered(friendData.filter((account)=>{

          return (
          (`${account.firstname} ${account.lastname}`).toLowerCase().includes(inputValue.toLowerCase())
          ||
          account.username.toLowerCase().includes(inputValue.toLowerCase())
          )
      }))

      if(inputValue === ''){
          setDataFiltered(null)
      }
    }

  },[inputValue])

    return (
    <>
        <div className={`invite-card ${!sendMsgLoading && 'z-20'} bg-stone-800 text-white`}>
        <div className="flex flex-col justify-between h-full w-full">
          <div className="flex flex-col p-2 w-full">
          <FontAwesomeIcon onClick={()=>handleCloseInviteCard(false)}  icon={faArrowLeft} className="mx-2 w-5 h-5 cursor-pointer hover:text-purple-500 fixed"/>
              <div className="text-center w-full pb-3 text-[1rem] font-bold">
                  Inviting friends 
              </div>
              <div>
            </div>
          </div>
    
          <div className="flex items-center w-full p-2">
                 {/* ต้องแก้เมื่ออัพ ลงเว็บไซด์ */}
                 <div className="flex flex-col justify-center items-center">
                 <FontAwesomeIcon icon={faLink} onClick={handleCopyLink} className="w-4 h-4 p-3 bg-stone-900 cursor-pointer  hover:bg-purple-600 text-white rounded-full">คัดลอกลิงค์</FontAwesomeIcon>
                 <button className="text-[0.75rem] hover:text-purple-500" onClick={handleCopyLink}>Copy the link</button>
                 </div>
          </div>

          <div className="w-full h-full flex flex-col  items-center my-2">
                 <div className="w-full flex justify-center">
                 <input onChange={(event)=>setInputValue(event.target.value)} className="rounded-md outline-none bg-stone-800 border border-gray-600 focus:border-purple-700 p-1 py-2 text-[0.8rem] w-5/6" 
                 placeholder={`Invite your friends to # ${roomYouAreIn.roomName}`}/>
                 </div>
              {!allFriendLoading &&
              <>
              {friendData && !dataFiltered &&
                 <div className="flex flex-col gap-4  w-full p-4 h-[60vh] mt-4 overflow-y-scroll">
                    {friendData.map((friend,index)=>{
                      return (
                      <div className="flex items-center justify-between" key={index}>
                        <Link href={`/profile/${friend.id}`} className="flex items-center gap-2 text-[0.75rem]">
                          <img src={friend.accountImage.secure_url} className="w-8 h-8 rounded-full hover:border hover:border-purple-700 active:border-purple-700"/>
                          <div className="hover:text-purple-500">{friend.firstname} {friend.lastname}</div>
                        </Link>

                        <div>
                          <button onClick={()=>{handleSendMsg(friend._id);}} className="text-[0.8rem] py-2 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700">Invite</button>
                        </div>
                        
                      </div>
                      )
                    })}
                 </div>
                }

                {friendData && dataFiltered && dataFiltered.length !== 0 &&
                 <div className="flex flex-col gap-4  w-full p-4 h-[60vh] mt-4 overflow-y-scroll">
                    {dataFiltered.map((friend,index)=>{
                      return (
                      <div className="flex items-center justify-between" key={index}>
                        <Link href={`/profile/${friend.id}`} className="flex items-center gap-1 text-[0.75rem]">
                          <img src={friend.accountImage} className="w-8 h-8 rounded-full"/>
                          <div className="hover:text-purple-600">{friend.firstname} {friend.lastname}</div>
                        </Link>

                        <div>
                          <button onClick={()=>{handleSendMsg(friend._id);}} className="text-[0.8rem] py-2 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700">Invite</button>
                        </div>
                        
                      </div>
                      )
                    })}
                 </div>
                }

                {friendData && dataFiltered && dataFiltered.length === 0 &&
                <div className="flex h-[60vh] justify-center items-center text-[0.8rem]">
                   <div>Not found any friends</div>
                </div>
                }
                </>
                }

                {allFriendLoading &&
                 <div className="w-full flex justify-center pt-2 items-center h-full">
                     <div className="loader-event-dot"></div>
                 </div>
                }
          </div>

        

         
        </div>

      
        </div>
        {sendMsgLoading &&
         <div className="loader-page-for-cover z-50 p-2 px-3 text-white shadow-md overflow-y-auto">
         <LoaderPage/>
        </div>  
         }
      </>
    )
}