import { faCheck } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import axios from "axios"
import { useEffect, useState } from "react"
import { io } from "socket.io-client"
const socket = io(process.env.API_SOCKET_URL)



export default function LikeSystem(props){
    const [isLiked,setIsLiked] = useState(false)
    useEffect(()=>{
        if(props.post.likes.length > 0){
                props.post.likes.some((object)=>{
                    if(object.accountID === props.accountID){
                        setIsLiked(true)
                    }
                })
        }
    },[props.post])


    const handleLike=(event)=>{
        event.preventDefault()

        if(!isLiked){
            axios.put(`${process.env.API_URL}/like-increasing`,{accountID:props.accountID,postID:props.postID},{
                headers:{
                    Authorization: `Bearer ${props.userData.token_key}`
                  }
            })
            .then((response)=>{
                socket.emit('like-update',{post:response.data , senderID:props.accountID})
                props.handleCloseMenuToggle()
            })
            .catch((error)=>{
                console.log(error.response.data.error)
            })

        }else{
            axios.delete(`${process.env.API_URL}/like-decreasing`,{
                data:{accountID:props.accountID,postID:props.postID},
                headers:{
                    Authorization: `Bearer ${props.userData.token_key}`
                  }
            }
            )
            .then((response)=>{
                socket.emit('like-update',{post:response.data , senderID:props.accountID})
                props.handleCloseMenuToggle()
            })
            .catch(()=>{
                console.log(error.response.data.error) 
            })
        }

    }

    useEffect(()=>{
        const handleUpdateLike = ({post , senderID}) =>{
            if(post.likes.length > 0 && senderID === props.accountID){
                post.likes.some((object)=>{
                    if(object.accountID === props.accountID){
                        setIsLiked(true)
                    }else{
                        setIsLiked(false)
                    }
                })
            }

            else if(post.likes.length === 0 && senderID === props.accountID){
                setIsLiked(false)
            }
        }

        socket.on('like-update',handleUpdateLike)

        return ()=>{
            socket.off('like-update',handleUpdateLike)
        }

    },[props.accountID])

    return(
    <>
    <button onClick={handleLike} className=" py-1 flex-1 text-[0.75rem] font-normal hover:bg-stone-700 w-full">
    {isLiked && <FontAwesomeIcon icon={faCheck} className="px-1 text-green-400"/>}
    Like
    </button>
    </>
    )
}