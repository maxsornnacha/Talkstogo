import { useState,useEffect, useRef } from "react"
import axios from "axios"
import { io } from 'socket.io-client'
import Link from "next/link"
import { isURL,convertTime } from "@/modules/modules"
const socket = io(process.env.API_SOCKET_URL)
import Swal from "sweetalert2"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft, faCheck, faClose, faImage, faPlus, faSpinner  } from "@fortawesome/free-solid-svg-icons"
import FileResizer from "react-image-file-resizer"
import { faFileImage } from "@fortawesome/free-regular-svg-icons"

export default function ChatroomProfile({senderData,getterData,handleCloseChat,userData}){
    const [sender,setSender] = useState(null)
    const [getter,setGetter] = useState(null)
    const [inputMsg,setInputMsg] = useState('')
    const [msgData,setMsgData] = useState([])
    const [roomID,setRoomID] = useState(null)

    const [allMessagesLoading , setAllMessagesLoading] = useState(true);
      const [sendingMsgLoading , setSendingMsgLoading] = useState(false);

     //จัดการ real-time handling
    //เริ่มทำการสร้างห้องโดยใช้ id ของทั้ง 2 accounts เป็นอ้างอิงเลขห้องแชท
    useEffect(()=>{
        socket.emit('joinRoom',{  
            senderID:senderData.accountData._id,
            getterID:getterData._id,
        })
        socket.on('joinRoom',({roomID})=>{
            setRoomID(roomID)
        })
    },[sender,getter])

      //ดึงข้อมูล ข้อความทั้งหมด  + เปลี่ยนข้อความเป็น อ่านแล้ว เมื่อ message getter เข้าร่วมห้องแชท
      useEffect(()=>{
        fetching()
        setGetter(getterData)
        setSender(senderData)
    },[])
    //update chat to current scrolling part
    const chatboxRef = useRef(null);

     // useEffect to scroll down when the component mounts or when new messages are added
     useEffect(() => {
    // Function to scroll to the bottom
    const scrollToBottom = () => {
      if (chatboxRef.current) {
        chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
      }
    };  
    // Scroll to the bottom when the component mounts
    scrollToBottom();
    // Scroll to the bottom whenever msgData changes (new messages are added)
    scrollToBottom();
    }, [msgData]);


    const fetching=()=>{
        axios.post(`${process.env.API_URL}/get-message`,{
            senderID:senderData.accountData._id,
            getterID:getterData._id,
        },{
            headers:{
                Authorization: `Bearer ${userData.token_key}`
            }
        })
        .then((response)=>{
            setMsgData(response.data.messages)
        })
        .catch((error)=>{
           console.log(error)
        })
        .finally(()=>{
            setAllMessagesLoading(false);
        })
    }

     
     //ต้องแยกเพราะ userData ที่ emit ไปจะเป็น คนละ getter Data
    //จัดการการ อ่านข้อความ เมื่อส่งข้อความ แล้วอีกฝ่ายอยู่ในอยู่ในแชท
    const handleReadMessageWhenSendingMsg= async (data)=>{
   
        axios.post(`${process.env.API_URL}/read-message`,{
            senderID:senderData.accountData._id,
            getterID:getterData._id,
        },{
            headers:{
                Authorization: `Bearer ${userData.token_key}`
              }
        })
        .then((response)=>{
            setMsgData(response.data.messages);
             //ทำการส่ง message realtime ผ่าน socket โดยใช้ roomIDเป็นตัวแบ่งห้อง
             if(roomID || data){
             socket.emit('updateMsg',{roomIDGet:roomID?roomID:data,messagesAll:response.data.messages})          
             }

            //เรียกใช้งาน อัพเดตแชท ใน meesenger
            //อัพเดตไปที่ messenger
            axios.get(`${process.env.API_URL}/all-messages/${getterData._id}`,{
                headers:{
                    Authorization: `Bearer ${userData.token_key}`
                }
            })
            .then((response)=>{
                //สามารถเขียน Logic ตรงนี้เพื่อกรองหาแชทที่ไม่ได้อ่าน
                if(response.data && getterData){
                    const  filteredIsnotRead = (response.data).filter((chatBox,index)=>{
    
                        const filter = chatBox.messages.filter((message) => {
                            return message.senderID !== getterData._id && message.isRead === false
                        });
    
                        return (filter.length > 0)
                    })
                    socket.emit('allMessages',{data:response.data, newUnreadMessages:filteredIsnotRead.length, userID:getterData._id})
                }
            })
            .catch((error)=>{
                console.log(error)
            })
        })
        .catch((error)=>{
            console.log(error)
        })
       
   
    }

    //ต้องแยกเพราะ userData ที่ emit ไปจะเป็น คนละ sender Data
    const handleReadMessageWhenJoining = ()=>{
        axios.post(`${process.env.API_URL}/read-message`,{
            senderID:senderData.accountData._id,
            getterID:getterData._id,
        },{
            headers:{
                Authorization: `Bearer ${userData.token_key}`
            }
        })
        .then((response)=>{
            setMsgData(response.data.messages);
             //ทำการส่ง message realtime ผ่าน socket โดยใช้ roomIDเป็นตัวแบ่งห้อง
             if(roomID || data){
             socket.emit('updateMsg',{roomIDGet:roomID?roomID:data,messagesAll:response.data.messages})          
             }

        //เรียกใช้งาน อัพเดตแชท ใน meesenger

        //อัพเดตไปที่ messenger เมื่อข้อความถูกส่งเฉยๆ
        axios.get(`${process.env.API_URL}/all-messages/${senderData.accountData._id}`,{
            headers:{
                Authorization: `Bearer ${userData.token_key}`
              }
        })
        .then((response)=>{
            //สามารถเขียน Logic ตรงนี้เพื่อกรองหาแชทที่ไม่ได้อ่าน
            if(response.data && getterData){
                console.log(response.data)
                const  filteredIsnotRead = (response.data).filter((chatBox,index)=>{

                    const filter = chatBox.messages.filter((message) => {
                        return message.senderID !== senderData.accountData._id && message.isRead === false
                    });
                  

                    return (filter.length > 0)
                })
                socket.emit('allMessages',{data:response.data, newUnreadMessages:filteredIsnotRead.length, userID:senderData.accountData._id})
            }
        })
        .catch((error)=>{
            console.log(error)
        })
           
        })
        .catch((error)=>{
            console.log(error)
        })
    }

    //อ่านเมื่อมีการส่งข้อความ แล้วฝั่ง message getter ได้อยู่ในห้องแชทอยู่
   
    //จะทำงาน เมื่ออีกฝ่ายเข้าห้อง
    useEffect(()=>{
        if(roomID){
            handleReadMessageWhenJoining()

           const handleUpdate = ({messagesAll})=>{
            setMsgData(messagesAll);
           }

            //จะทำงาน เมื่อส่งข้อความแล้ว อีกฝ่ายได้อยู่ใน chatRoom
             socket.on('updateMsg', handleUpdate)

             return ()=>{
                socket.off('updateMsg', handleUpdate)
             }
        }
    },[roomID])

    //จัดการการส่งข้อความลงใน DB
    const handleSendMsg=(event)=>{
        event.preventDefault()
        setSendingMsgLoading(true);
        axios.put(`${process.env.API_URL}/send-message`,{
            senderID:senderData.accountData._id,
            getterID:getterData._id,
            message:inputMsg,
            image:imgInput
        },{
            headers:{
                Authorization: `Bearer ${userData.token_key}`
            }
        })
        .then((response)=>{
            setInputMsg('')
            setImgInput(null)
    
            //ทำการส่ง message realtime ผ่าน socket โดยใช้ roomIDเป็นตัวแบ่งห้อง
            socket.emit('sendMsg',{roomIDGet:roomID,message:response.data[response.data.length-1]})
            socket.emit('notify-navbar',{getterID:getterData._id , type:'message'})
        })
        .catch((error)=>{
            console.log(error)
            Swal.fire({
                title:'Error message sending',
                text:error.response.data.error
            })
        })
        .finally(()=>{
            setSendingMsgLoading(false);
        })
    }

    useEffect(()=>{
    const handleMessage = async ({roomIDGet, message }) => {
   
            await setMsgData((prev) => {

              return [...prev, message];
            });
            //ทำการใช้งาน อ่านข้อความ เพื่อเช็คว่าอีกฝั่งอยู่ในแชทรึป่าว
            await handleReadMessageWhenSendingMsg(roomIDGet) 
          };  

        socket.on('message', handleMessage);
        
         // Cleanup function to remove the event listener when the component unmounts
        return () => {
         socket.off('message', handleMessage);    
    };
    },[])


    //แก้อยู่ตรงนี้นะ 
    useEffect(() => {
        const handleUpdateMsg = ({ messagesAll }) => {
            setMsgData(messagesAll);
        };
      
        socket.on('updateMsg', handleUpdateMsg);
      
        return () => {
          socket.off('updateMsg', handleUpdateMsg);
        };
      }, []);

    const handleCloseChatToggle=()=>{
        setSender(null)
        setGetter(null)
        setInputMsg('')
        setMsgData([])
        setRoomID(null); 
        handleCloseChat(false); 
    }

     //จัดการส่งไฟล์รูปภาพ
     const [imgInput,setImgInput] = useState(null)
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
                 setImgInput(url)
             }, // Is the callBack function of the resized new image URI.
             "base64", // Is the output type of the resized new image.
           );
         }catch(error){
             console.log('ไม่พบ file')
             console.log(error)
         }
      }

    const handleDoubleClickCopy=(message)=>{
        navigator.clipboard.writeText(message)
            .then(() => {
                Swal.fire({
                    text:"Successfully copied to clipboard", 
                    showConfirmButton: false,
                    timer: 1500,
                    position:"top"
                  })
            })
            .catch((error) => {
                console.log(error)
                Swal.fire({
                    title:'Error copying',
                    text:"Unsuccessfully copied to clipboard",
                    showConfirmButton: false,
                    timer: 1500,
                    position:"top"
                  })
            });
    }
    
    
    return(
  
    <div className="w-full m-0 p-0 chat-card-profile">
        <div className="bg-[#202022] w-full">
    {getter && sender &&
            // Topic name
            <div className="flex items-center h-[7vh]">
            <div className="flex items-center gap-1">
            <button className="pe-2" onClick={handleCloseChatToggle} >
                <FontAwesomeIcon icon={faArrowLeft} className='w-5 h-5 text-gray-100 hover:text-purple-400 p-2 '/>
            </button>
                <Link href={`/profile/${getter.id}`}>
                 <img src={getter.accountImage.secure_url} className="w-8 h-8 rounded-full"/>  
                </Link>
                <div>
                <Link href={`/profile/${getter.id}`}>
                    <div className="text-white hover:text-purple-400 text-[0.8rem] font-normal">{getter.firstname} {getter.lastname}</div>
                    <div className="text-white hover:text-purple-400 text-[0.7rem] font-normal">Username : {getter.username}</div>
                </Link>
                </div>
            </div>
            </div>  
    }

            {msgData && getter && sender && !allMessagesLoading &&
            <div ref={chatboxRef} className={`${imgInput && !sendingMsgLoading?'md:h-[68vh] h-[62dvh]':'md:h-[86vh] h-[83dvh]'} bg-[#1e1e1f] overflow-y-auto  w-full`}>
            <div className="flex flex-col pb-5 px-1 w-full">
            {msgData.map((data)=>{
                return (
                data.senderID !== senderData.accountData._id ?
                // the other person chat
                <div className="flex gap-2 mt-2" key={data._id}>
                <div className =' bg-[#1e1e1f] text-white mt-4 pt-4 bg  flex items-end'>
                    <Link href={`/profile/${getter.id}`}>
                    <img src={getter.accountImage.secure_url} className="rounded-full inline w-8 h-8" alt="profile picture"/>
                    </Link>
                </div>
                <div onDoubleClick={()=>handleDoubleClickCopy(data.content)} className="max-w-56 w-auto px-5 bg-gray-700 text-white text-[0.8rem] pt-4 break-words  rounded-xl">
                {data.image ?<Link href={data.image.secure_url} target="blank"><img src={data.image.secure_url} className={`h-32 w-32 ${data.content.includes(process.env.CLIENT_URL)?'rounded-full':'rounded-xl'}`}/></Link>:''}
                    {isURL(data.content)?<a className="text-green-400 hover:text-white" target="_blank"  href={data.content}>{data.content}</a>:data.content}
                <div className="bg-gray-00 text-white text-end pt-3 text-[0.7rem]">{convertTime(data.timestamp)}</div>
                </div>
                </div>
                : //your chat
                <div className="flex justify-end  col-span-10 bg-[#1e1e1f] mt-2" key={data._id}>
                <div onDoubleClick={()=>handleDoubleClickCopy(data.content)} className="max-w-56 w-auto px-5 bg-purple-500 text-white text-start text-[0.8rem] pt-4 break-words rounded-xl">
                {data.image ?<Link href={data.image.secure_url} target="blank"><img src={data.image.secure_url} className={`h-32 w-32 ${data.content.includes(process.env.CLIENT_URL)?'rounded-full':'rounded-xl'}`}/></Link>:''}
                    {isURL(data.content)?<a className="text-green-400 hover:text-white" target="_blank"  href={data.content}>{data.content}</a>:data.content}
                <div className="bg-purple-500 text-white text-end pt-3 text-[0.7rem]">{data.isRead && <FontAwesomeIcon icon={faCheck} className="text-green-300 h-3 w-3"/>} {convertTime(data.timestamp)}</div>
                </div>
                <div className =' bg-[#1e1e1f] text-white ms-2 mt-4 pt-4 bg col-span-2 flex items-end'>
                    <Link href={`/profile/${sender.accountData.id}`}>
                    <img src={sender.accountData.accountImage.secure_url} className="rounded-full inline w-8 h-8"  alt="profile's picture"/>
                    </Link>
                </div>
                </div>
                )
            })}
            </div>
            </div>
            }

            {allMessagesLoading &&
            <div className="h-[86vh]">
                <div className="flex justify-center items-center w-full h-full">
                    <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 text-stone-500 motion-safe:animate-spin"/>
                </div>
            </div>
            }

            { //In case we have input an image
            imgInput && !sendingMsgLoading &&
            <div className="w-full h-[18vh] bg-stone-700 relative">
            <div className="w-full flex items-end  pt-2">
                <FontAwesomeIcon onClick={()=>setImgInput(null)} icon={faClose} className="top-3 left-[105px] cursor-pointer w-3 h-3 p-1 bg-white hover:bg-purple-600 hover:text-white rounded-full absolute"/>
            </div>
            <img src={imgInput} className="w-28 h-28 rounded-md m-2"/>
            </div>
            }
            
            {/* Send messages or message sending */}
            <div className="h-[7vh] flex justify-start items-center gap-1 px-2">
            <input value={inputMsg} onChange={(event)=>setInputMsg(event.target.value)} type="text" className={`${inputMsg !== '' || imgInput?'w-5/6':'w-full'} p-2 text-[0.8rem] bg-stone-800 border rounded-md border-gray-600 focus:border-purple-600 outline-none text-white`} placeholder="Message"/> 
            {!sendingMsgLoading &&
            <span>
            <label htmlFor="photoChat">
                <FontAwesomeIcon icon={faPlus} className="h-4 w-4 p-2 cursor-pointer bg-gray-700 text-white hover:bg-gray-600 hover:text-white rounded-md" alt="Image Input"/>
            </label>
            <input onChange={handleFileUpload} type="file" name="photoChat" id='photoChat' hidden={true}/>
            </span>
            }
            {sendingMsgLoading ?
            <div className="bg-purple-900  w-20 ms-1 py-4 rounded-md flex justify-center items-center">
                <div className="loader-event text-[3px] w-96">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
            </div>
            :
            <button hidden={inputMsg !== '' || imgInput?false:true} onClick={handleSendMsg}  className={`bg-purple-600 hover:bg-purple-700 px-5 py-2 ms-1 text-white text-[0.8rem] rounded-md`}>Send</button>
            }
            </div>
    </div>
    </div>
    )
}