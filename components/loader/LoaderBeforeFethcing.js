import { faPerson } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function LoaderBeforeFetching(){
    return (
     <div className="h-screen bg-[#383739] flex flex-col justify-center items-center">
    <div className="flex justify-center items-end gap-2">
    <FontAwesomeIcon icon={faPerson} className="text-[5rem] h-28 w-28 rounded-xl border-2 bg-purple-600 p-2 pt-3 text-white animate-bounce"/>
    </div>
    <div className="text-white text-[1.5rem] animate-bounce font-normal">TALKSTOGO</div>
    </div>
    )
}