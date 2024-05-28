import { faArrowLeft, faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";


export default function MemberCard({handleCloseMemberCard , admins , participants , creator, userData , creatorStatus , participantStatuses , adminStatuses}){
    
    return (
    <div className="member-card bg-stone-800 text-white ">

        <div className="flex w-full flex-col p-2 relative">
        <FontAwesomeIcon onClick={()=>handleCloseMemberCard(false)} icon={faArrowLeft} className="fixed mx-2 w-5 h-5 cursor-pointer hover:text-violet-500"/>
         <div className="text-[1rem] font-bold text-center pb-10">All members</div>

         <div className="overflow-y-auto h-[80vh]  md:h-[75vh]">

         <div className="mb-5">
            <div className="text-[0.8rem] font-semibold mb-4">Leader - {creator.length}</div>
   
            {creator && 
          creator.map((creator,index)=>{
          return (
          <div key={index} className="flex items-center pb-3 relative">
              <Link href={`/profile/${creator.id}`} className={`me-2 ms-2`}>
              <div><img src={creator.accountImage.secure_url} className="w-7 h-7 rounded-full"/></div>
              </Link>
              <FontAwesomeIcon icon={faCircle} className={`absolute left-[27px] bottom-3 border-2 rounded-full border-stone-800 ${creatorStatus[index] === 'online'?'text-green-400':'text-red-500'} w-2 h-2`}/> 
              {creatorStatus[index] === 'online' && <div className="animate-ping bg-green-400 w-2 h-2 rounded-full absolute left-[29px] top-[17px]"></div>}
              <Link href={`/profile/${creator.id}`}>
              <div className="text-[0.75rem] hover:text-purple-500">{creator.firstname} {creator.lastname}</div>
              </Link>
          </div>
          )
          })
          }
         </div>

         {creator && creator.length === 0 &&
          <div className="flex items-center justify-center h-20">
                <div className="text-[0.8rem] text-gray-400">There is no leader in this room.</div>
          </div>
          }


         <div className="mb-5">
            <div className="text-[0.8rem] font-semibold mb-4">Admins - {admins.length}</div>
   
            {admins && 
          admins.map((admin,index)=>{
          return (
          <div key={index} className="flex items-center pb-3 relative ">
              <Link href={`/profile/${admin.id}`} className={`me-2 ms-2`}>
              <div><img src={admin.accountImage.secure_url} className="w-7 h-7 rounded-full"/></div>
              </Link>
              <FontAwesomeIcon icon={faCircle} className={`absolute left-[27px] bottom-3 border-2 rounded-full border-stone-800 ${adminStatuses[index] === 'online'?'text-green-400':'text-red-500'} w-2 h-2`}/> 
              {adminStatuses[index] === 'online' && <div className="animate-ping bg-green-400 w-2 h-2 rounded-full absolute left-[29px] top-[17px]"></div>}
              <Link href={`/profile/${admin.id}`}>
              <div className="text-[0.75rem] hover:text-purple-500">{admin.firstname} {admin.lastname}</div>
              </Link>
          </div>
          )
          })
          }
         </div>

         {admins && admins.length === 0 &&
          <div className="flex items-center justify-center h-20">
                <div className="text-[0.8rem] text-gray-400">There is no admin in this room.</div>
          </div>
          }

         <div className="mb-5">
            <div className="text-[0.8rem] font-semibold mb-4">Normal member - {participants.length}</div>

            {participants && participants.length !== 0 &&
          participants.map((participant,index)=>{
          return (
          <div key={index} className="flex items-center pb-3 relative">
              <Link href={`/profile/${participant.id}`} className={`me-2 ms-2`}>
              <div><img src={participant.accountImage.secure_url} className="w-7 h-7 rounded-full"/></div>
              </Link>
              <FontAwesomeIcon icon={faCircle} className={`absolute left-[27px] bottom-3 border-2 rounded-full border-stone-800 ${participantStatuses[index] === 'online' ?'text-green-400':'text-red-500'}  w-2 h-2`}/> 
              {participantStatuses[index] === 'online' && <div className="animate-ping bg-green-400 w-2 h-2 rounded-full absolute left-[29px] top-[17px]"></div>}
              <Link href={`/profile/${participant.id}`}>
              <div className="text-[0.75rem] hover:text-purple-500">{participant.firstname} {participant.lastname}</div>
              </Link>
          </div>
          )
          })
          }

          {participants && participants.length === 0 &&
          <div className="flex items-center justify-center h-20">
                <div className="text-[0.8rem] text-gray-400">There is no normal member in this room.</div>
          </div>
          }
         </div>
         </div>


         </div>
    </div>
    )
}