import { useState,useEffect,useRef } from "react"
import axios from "axios"
import { io } from 'socket.io-client'
import Link from "next/link"
const socket = io(process.env.API_SOCKET_URL)
import { isURL , convertTime } from "@/modules/modules"
import Swal from "sweetalert2"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck, faClose, faPlus, faSpinner } from "@fortawesome/free-solid-svg-icons"
import FileResizer from "react-image-file-resizer"

export default function Chatroom({senderData,getterData,handleCloseChat,userData}){
    const [sender,setSender] = useState(senderData)
    const [getter,setGetter] = useState(getterData)
    
    const [isDragging,setIsDragging] = useState(false)
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [position, setPosition] = useState({ x: 0, y: 0 });


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

    
      //handle Dragging
      useEffect(() => {
        const handleMouseMove = (e) => {
          if (isDragging) {
            const x = e.clientX - offset.x;
            const y = e.clientY - offset.y;
            setPosition({ x, y });
          }
        };
    
        const handleMouseUp = () => {
          setIsDragging(false);
        };
    
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
      }, [isDragging, offset]);

      const handleMouseDown = (e) => {
        setIsDragging(true);
        setOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
      };


      //handle message fetching and real-time sending
      const [inputMsg,setInputMsg] = useState('')
      const [msgData,setMsgData] = useState([])
      const [roomID,setRoomID] = useState(null)

      const [allMessagesLoading , setAllMessagesLoading] = useState(true);
      const [sendingMsgLoading , setSendingMsgLoading] = useState(false);

        //update chat to current scrolling part
    const chatRef = useRef(null);

    useEffect(() => {
        const scrollToBottom = () => {
          if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
          }
        };
      
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

    useEffect(()=>{
        fetching()
    },[])

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

            //อัพเดตไปที่ messenger เมื่อข้อความถูกส่งเฉยๆ
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

       //จัดการแก้ไขเป็นอ่านแล้ว เมื่อมีคูสนทนาอยู่ในแชท 
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
        <div 
        className={`chat-card p-0 m-0 bg-[#050111] text-white`}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        >

            <div id="movableCard"
             className={`w-full flex justify-end h-[45px] rounded-xl bg-[#050111]  ${isDragging?'cursor-grabbing':'cursor-grab'}`}
             onMouseDown={handleMouseDown}
             >
                  <div className="py-2 flex w-full gap-1 items-center ps-3  ">
                <Link href={`/profile/${getter.id}`}>
                 <img src={getter.accountImage.secure_url} className="w-7 h-7 rounded-full"/>
                </Link>
                <div className="flex flex-col">
                    <Link href={`/profile/${getter.id}`} className="hover:text-purple-300 text-[0.75rem]">
                        {getter.firstname} {getter.lastname}
                    </Link>
                    <Link href={`/profile/${getter.id}`} className="hover:text-purple-300 text-[0.65rem]">
                        Username: {getter.username}
                    </Link>
                </div>
                </div>
                <button onClick={()=>handleCloseChat(false)} >
                    <FontAwesomeIcon icon={faClose} className='w-5 h-5 hover:text-purple-500 p-1'/>
                </button>            
            </div>
           

            <div ref={chatRef} className="md:h-[370px] h-[90vh]  bg-stone-900 w-full scrollbar-hide overflow-y-scroll">
            <div className="flex flex-col pb-5 px-1">
            
            {msgData && !allMessagesLoading &&
            <div  className="bg-stone-900  w-full">
            <div className="flex flex-col pb-5 px-1 w-full">
            {msgData.map((data)=>{
                return (
                data.senderID !== senderData.accountData._id ?
                // the other person
                <div className="flex gap-2 mt-2" key={data._id}>
                <div className ='bg-stone-900 text-white flex items-end'>
                    <Link href={`/profile/${getter.id}`}>
                    <img src={getter.accountImage.secure_url} className="rounded-full inline w-6 h-6 "  alt="profile's picture"/>
                    </Link>
                </div>
                <div onDoubleClick={()=>handleDoubleClickCopy(data.content)} className="max-w-56 w-auto px-2 bg-gray-700  text-white text-[0.75rem] font-normal pt-4 break-words rounded-md">
                {data.image ?<Link href={data.image.secure_url} target="blank"><img src={data.image.secure_url} className={`h-32 w-32 ${data.content.includes(process.env.CLIENT_URL)?'rounded-full':'rounded-xl'}`}/></Link>:''}
                        {isURL(data.content)?<a className="text-green-500 hover:text-white text-[0.75rem]" target="_blank"  href={data.content}>{data.content}</a>:data.content}
                <div className="text-white text-end pt-3 text-[0.65rem]"> {convertTime(data.timestamp)}</div>
                </div>
                </div>
                : //Me
                <div className="flex justify-end col-span-10 bg-stone-900 mt-2" key={data._id}>
                <div onDoubleClick={()=>handleDoubleClickCopy(data.content)} className="max-w-56 w-auto px-5 bg-purple-600 text-white text-[0.75rem] font-normal pt-4 break-words rounded-md">
                        {data.image ?<Link href={data.image.secure_url} target="blank"><img src={data.image.secure_url} className={`h-32 w-32 ${data.content.includes(process.env.CLIENT_URL)?'rounded-full':'rounded-xl'}`}/></Link>:''}
                        {isURL(data.content)?<a className="text-green-400 hover:text-white text-[0.75rem]" target="_blank"  href={data.content}>{data.content}</a>:data.content}
                    <div className="text-white text-end pt-3 text-[0.65rem]">{data.isRead?<FontAwesomeIcon icon={faCheck} className="text-green-300 h-3 w-3"/>:'Unread'} {convertTime(data.timestamp)}</div>
                </div>
                <div className =' bg-stone-900 text-black ms-2 mt-4 pt-4 bg col-span-2 flex items-end'>
                    <Link href={`/profile/${sender.accountData.id}`}>
                    </Link>
                </div>
                </div>
                )
            })}
            </div>
            </div>
            }

            {allMessagesLoading &&
            <div className="md:h-[370px] h-[90vh]">
                <div className="flex justify-center items-center w-full h-full">
                    <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 text-stone-500 motion-safe:animate-spin"/>
                </div>
            </div>
            }
       
                
            </div>
            </div>

            { //กรณีถ้าเราได้ส่งรูปภาพ
            imgInput && !sendingMsgLoading &&
            <div className="w-full bg-[#2d2d2e]">
            <div className="w-full relative top-7 left-32">
                <FontAwesomeIcon onClick={()=>setImgInput(null)} icon={faClose} className="cursor-pointer w-3 h-3 p-1 bg-white text-black hover:bg-purple-600 hover:text-white rounded-full"/>
            </div>
            <div className="flex  w-full">
                <img src={imgInput} className="w-32 h-32 ms-4 py-2 rounded-3xl"/>
            </div>
            </div>
            }
    
            <div className="h-[45px] flex justify-start items-center pt-3 w-full px-1 bg-[#050111]">
            <input value={inputMsg} onChange={(event)=>setInputMsg(event.target.value)} type="text" className="w-5/6 py-2 text-white bg-stone-800 border border-gray-600 focus:border-purple-700 mx-1 ps-2 text-[0.75rem] outline-none  rounded" placeholder="message"/> 
            {!sendingMsgLoading &&
            <span>
            <label htmlFor="photoChat" >
                <FontAwesomeIcon icon={faPlus} className="h-3 w-3 p-3 mt-1 cursor-pointer bg-gray-700 text-white hover:bg-gray-600 hover:text-white rounded-md" alt="Image Input"/>
            </label>
            <input onChange={handleFileUpload} type="file" name="photoChat" id='photoChat' hidden={true}/>
            </span>
            }
            {sendingMsgLoading ?
            <div className="bg-purple-900  px-5 ms-1 py-4 rounded-md flex justify-center items-center">
                <div className="loader-event text-[2px] w-96">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
            </div>
            :
            <button onClick={handleSendMsg} className={`bg-purple-600 hover:bg-purple-700 text-[0.75rem] px-3 ms-1 py-2  rounded-md  ${inputMsg==='' && !imgInput?'hidden':''}`}>Send</button>
            }
            {inputMsg==='' && !imgInput &&
            <button disabled className="bg-purple-900 flex-1 h-9 mx-1 rounded-md"></button>
            }
            </div>
  
        </div>
    )
}