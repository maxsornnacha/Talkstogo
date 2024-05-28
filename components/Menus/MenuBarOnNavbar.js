import Link from "next/link"
import { faChevronUp, faHouse, faUserGroup, faVolumeHigh } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import CurrentContactWith from "../Chats/CurrentContactWith"
import CurrentTalkingRooms from "../TalkingRooms/CurrentTalkingRooms"
import Signout from "../Accounts/Signout"
import { useState } from "react"

export default function MenuBarOnNavbar(props){
    const [currentContactLoading , setCurrentContactLoading] = useState(true)
    const [CurrentRoomLoading , setCurrentoomLoading] = useState(true)

    const CurrentContactWithLoading = ()=>{
        setCurrentContactLoading(false);
    }

    const CurrentTalkingRoomLoading = ()=>{
        setCurrentoomLoading(false);
    }


    return(
    <>
  <div className={`${props.menuToggle?'h-screen':'h-0'} duration-300 flex flex-col items-start text-white bg-[#161617]  font-semibold`}>

        <div className="p-2 pt-4">
            <FontAwesomeIcon icon={faChevronUp} className="hover:text-purple-500 active:text-purple-500 w-5 h-5 cursor-pointer" onClick={()=>{props.handleCloseMenuToggle();}}/>
        </div>
        
        <div className="flex w-full p-2 hover:bg-gray-700 hover:text-white hover:rounded-md">
        <Link href={`/profile/${props.userData.accountData.id}`}  className="flex items-center gap-1 hover:overflow-auto w-full font-normal">

            <img src={props.userData?props.userData.accountData.accountImage.secure_url:'/defaultProfile.png'} alt="home" className="h-8 w-8  cursor-pointer rounded-full"/>
            <div className="text-[0.75rem]">
            <div>{props.userData.accountData.firstname} {props.userData.accountData.lastname}</div>
            <div className="text-[0.65rem]">Username : {props.userData.accountData.username}</div>
            </div>
        </Link>
        </div>

        <div className="flex py-2 w-full  hover:bg-gray-700 hover:text-white font-normal hover:rounded-md">
        <Link href={`/`}  className="text-[0.8rem] flex w-full items-center gap-1 ps-3 ">
        <FontAwesomeIcon icon={faHouse} className="w-5 h-5 text-white"/>
        <button  className=" text-[0.8rem] w-full text-start">
            Home
        </button>
        </Link>
        </div>

      
        <div className="flex w-full py-2 hover:bg-gray-700 hover:text-white font-normal hover:rounded-md">
        <Link href={`/friends/${props.userData.accountData.id}`} className="text-[0.8rem] flex w-full items-center gap-1 ps-3 ">
        <FontAwesomeIcon icon={faUserGroup} className="w-5 h-5 text-white"/>
        <button  className="w-full text-start text-[0.8rem]">
             Friends
        </button>
        </Link>
        </div>
   
        <div className="flex w-full py-2 hover:bg-gray-700 hover:text-white font-normal hover:rounded-md">
        <Link href={`/rooms/${props.userData.accountData.id}`}  className="text-[0.8rem] flex w-full items-center gap-1 ps-3 ">
        <FontAwesomeIcon icon={faVolumeHigh} className="w-5 h-5 text-white"/>
        <button className="w-full text-start text-[0.8rem]">
            Talkingrooms
        </button>
        </Link>
        </div>

        <div className="px-1 cursor-pointer w-full hover:bg-gray-700">
        <Signout userData={props.userData}/>
        </div>


        <div className="mt-3 w-full">
        <div className="flex w-full p-2">
        <div  className="w-full text-start text-[1rem]">
        <div>Latest contacts</div>  
        </div>
        </div>
        <div style={{zIndex:9999}} className={`flex flex-col items-start w-full`}>
        <CurrentContactWith userData={props.userData} CurrentContactWithLoading={CurrentContactWithLoading}/>
        </div>
        </div>


        <div className="mt-3 w-full">
        <div className="flex w-full p-2">
        <div  className="w-full text-start text-[1rem]">
        <div>Latest talkingrooms</div>
        </div>
        </div>
        <div className=" pb-6  flex flex-col items-start w-full">
        <CurrentTalkingRooms userData={props.userData} CurrentTalkingRoomLoading={CurrentTalkingRoomLoading}/>
        </div>
        </div>

    </div>
    </>
    )
}