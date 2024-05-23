import { useState,useEffect } from "react"
import { io } from "socket.io-client"
const socket = io(process.env.API_SOCKET_URL)
import axios from "axios"


export default function Messenger({messages,userData,handleChatroomToggle,closeMessanger}){
    const [allMessages,setAllMessages] = useState(messages)
    const [allChatAccounts,setAllChatAccounts] = useState([])
    const [inputValue,setInputValue] = useState('')
    const [dataFiltered,setDataFiltered] = useState(null)
    const [allMessagesLoading , setAllMessagesLoading] = useState(true);
    const [allChatAccountsLoading , setAllChatAccountsLoading] = useState(true);


    //เมื่อทำการเปิดแชทจะอัพเดตข้อมูล
    useEffect(()=>{
        if(userData){
        const fetchingAllMessages = ()=>{
            axios.get(`${process.env.API_URL}/all-messages/${userData.accountData._id}`,{
                headers:{
                    Authorization: `Bearer ${userData.token_key}`
                  }
            })
        .then((response)=>{
            //สามารถเขียน Logic ตรงนี้เพื่อกรองหาแชทที่ไม่ได้อ่าน
            if(response.data && userData){
                const  filteredIsnotRead = (response.data).filter((chatBox,index)=>{

                    const filter = chatBox.messages.filter((message) => {
                        return message.senderID !== userData.accountData._id && message.isRead === false
                    });

                    return (filter.length > 0)
                })
                setAllMessages(response.data)
                socket.emit('allMessages',{data:response.data, newUnreadMessages:filteredIsnotRead.length, userID:userData.accountData._id})
            }
           
        })
        .catch((error)=>{
            console.log(error)
        })
        .finally(()=>{
            setAllMessagesLoading(false);
        })
        }

        fetchingAllMessages()
    }

    },[userData])


    useEffect(()=>{
        const fetchingAccounts = ()=>{

                axios.post(`${process.env.API_URL}/all-messages-accounts`,{
                    allMessages,userID:userData.accountData._id
                },{
                    headers:{
                        Authorization: `Bearer ${userData.token_key}`
                      }
                })
                .then((response)=>{
                    setAllChatAccounts(response.data)
                })
                .catch((error)=>{
                        console.log(error)
                }) 
                .finally(()=>{
                    setAllChatAccountsLoading(false);
                })
    }

    fetchingAccounts()
    },[allMessages])

    useEffect(()=>{

        setDataFiltered(allChatAccounts.filter((account)=>{

            return (
            (`${account.firstname} ${account.lastname}`).toLowerCase().includes(inputValue.toLowerCase())
            ||
            account.username.toLowerCase().includes(inputValue.toLowerCase())
            )
        }))

        if(inputValue === ''){
            setDataFiltered(null)
        }

    },[inputValue])
    
    useEffect(()=>{
        socket.on('allMessages',({data,userID}) =>{
           if(userID === userData.accountData._id){
            setAllMessages(data)
           } 
        })
    },[])

    if(allMessagesLoading || allChatAccountsLoading){
    return(
    <>
    <div className="w-full text-center pt-1 pb-3 text-[1rem] font-normal"> Messages </div>
    <div className="w-full flex justify-center pt-2 items-center h-full">
        <div className="loader-event-dot"></div>
    </div>
    </>
    )
    }
    else{
    return (
    <div className="w-full">
        <div className=" w-full text-center pt-1 pb-3 text-[1rem] font-normal"> Messages </div>
        

        <div className="w-full flex justify-center">
           <input value={inputValue} onChange={(event)=>setInputValue(event.target.value)} placeholder="Search the message" className="bg-stone-800 mb-3 py-1 px-2 text-white rounded-md text-[0.75rem] outline-none border-gray-700 focus:border-violet-800  border w-5/6"/>
        </div>

    {allMessages && !dataFiltered &&
    allMessages.slice().sort((a,b)=>{
         const aTime = new Date(a.updatedAt)
         const bTime = new Date(b.updatedAt)
        return bTime-aTime
    }).map((messenger,index)=>{
       return(
        <div key={index}>
               {messenger.participants.map((user,index)=>{

                return (<div key={index}>

                {allChatAccounts && allChatAccounts.length > 0 && messenger.messages.length > 0 &&  allChatAccounts.map((account,index)=>{
                return(
                account._id === user &&
                <div key={index}>
                <button onClick={()=>{handleChatroomToggle(true,index); closeMessanger(false,account)}} className={`hover:bg-gray-700 w-full py-3 flex gap-2 p-2 ${!(messenger.messages[messenger.messages.length-1].isRead) && !(messenger.messages[messenger.messages.length-1].senderID === userData.accountData._id)?'bg-violet-800 hover:bg-violet-700 text-white font-normal':''}`} key={index}>
                <div>
                    <img src={account.accountImage} className="h8 w-8 rounded-full"/>
                </div>
                <div className="flex flex-col">
                    <div className={`text-start text-[0.75rem] ${!(messenger.messages[messenger.messages.length-1].isRead) && !(messenger.messages[messenger.messages.length-1].senderID === userData.accountData._id)?'font-medium':'font-normal'}`}>{account.firstname} {account.lastname}</div>
                    <div className={`text-start text-[0.7rem] flex gap-1 ${!(messenger.messages[messenger.messages.length-1].isRead) && !(messenger.messages[messenger.messages.length-1].senderID === userData.accountData._id)?'font-medium':'font-normal'}`}>
                        <div>
                        {messenger.messages[messenger.messages.length-1].senderID === userData.accountData._id?
                        'Me :'
                        :
                        account.firstname+' :'
                        }
                        </div>
                        <div>
                            {messenger.messages[messenger.messages.length-1].content.length>10?messenger.messages[messenger.messages.length-1].content.substring(0,10)+'...':messenger.messages[messenger.messages.length-1].content}
                            {messenger.messages[messenger.messages.length-1].content === '' && messenger.messages[messenger.messages.length-1].image ?'Sent a picture':''}
                        </div>
                    </div>
                </div>
                </button>
                </div>
                )
                })}
                </div>
                )
            })}
        </div>
       )
    })}


{allMessages && dataFiltered &&
    allMessages.slice().sort((a,b)=>{
         const aTime = new Date(a.updatedAt)
         const bTime = new Date(b.updatedAt)
        return bTime-aTime
    }).map((messenger,index)=>{
       return(
        <div key={index}>
               {messenger.participants.map((user,index)=>{

                return (<div key={index}>

                {allChatAccounts && allChatAccounts.length > 0 && messenger.messages.length > 0 &&  dataFiltered.map((account,index)=>{
                return(
                account._id === user &&
                <div>
                <button onClick={()=>{handleChatroomToggle(true,index); closeMessanger(false,account)}} className={`hover:bg-gray-700 w-full py-3 flex gap-2 p-2 ${!(messenger.messages[messenger.messages.length-1].isRead) && !(messenger.messages[messenger.messages.length-1].senderID === userData.accountData._id)?'bg-violet-800 hover:bg-violet-700 text-white':''}`} key={index}>
                <div>
                    <img src={account.accountImage} className="h-8 w-8 rounded-full"/>
                </div>
                <div className="flex flex-col">
                    <div className={`text-start text-[0.75rem] ${!(messenger.messages[messenger.messages.length-1].isRead) && !(messenger.messages[messenger.messages.length-1].senderID === userData.accountData._id)?'font-semibold':'font-normal'}`}>{account.firstname} {account.lastname}</div>
                    <div className={`text-start text-[0.7rem] flex gap-1 ${!(messenger.messages[messenger.messages.length-1].isRead) && !(messenger.messages[messenger.messages.length-1].senderID === userData.accountData._id)?'font-semibold':'font-normal'}`}>
                        <div>{messenger.messages[messenger.messages.length-1].senderID === userData.accountData._id?
                        'Me :'
                        :
                        account.firstname+' :'
                        }</div>
                        <div>
                            {messenger.messages[messenger.messages.length-1].content.length>10?messenger.messages[messenger.messages.length-1].content.substring(0,10)+'...':messenger.messages[messenger.messages.length-1].content}
                            {messenger.messages[messenger.messages.length-1].content === '' && messenger.messages[messenger.messages.length-1].image ?'Sent a picture':''}
                        </div>
                    </div>
                </div>
                </button>
                </div>
                )
                })}
                </div>
                )
            })}
        </div>
       )
    })}

    {allMessages && allMessages.length === 0 && !dataFiltered &&
     <div className="h-96 text-gray-200 flex justify-center items-center text-[0.75rem]"> 
            No messages coming in yet
    </div>
    }

    {dataFiltered && dataFiltered.length === 0 &&
    <div className="h-96 text-gray-200 flex justify-center items-center text-[0.75rem]"> 
                 Not found
    </div>
    }

    </div>
    )
    }
}