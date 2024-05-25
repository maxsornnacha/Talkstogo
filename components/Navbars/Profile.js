import Signout from "../Accounts/Signout"
import Link from "next/link"

export default function Profile(props){

    return (
    <div className="w-full"> 
         <div className=" w-full text-center pb-2 text-[1rem] font-normal"> Profile </div>         

         <div className="flex w-full p-1 px-2 hover:bg-gray-700 hover:text-white hover:rounded-md">
        <Link href={`/profile/${props.userData.accountData.id}`}  className=" text-[1.0rem] flex items-center gap-1 hover:overflow-auto w-full text-start">
        <img src={props.userData?props.userData.accountData.accountImage.secure_url:'/defaultProfile.png'} alt="home" className="h-8 w-8  cursor-pointer  rounded-full"/>
         <div className="text-[0.75rem] font-normal">{props.userData.accountData.firstname} {props.userData.accountData.lastname}</div>
        </Link>
        </div>
        {props.userData &&
        <div className="w-full p-1 px-2 hover:bg-gray-700 hover:text-white  hover:rounded-md  ">
            <Signout isInRoom={props.isInRoom} room={props.room} userData={props.userData}/>
        </div>
        }
    </div>
    )
}