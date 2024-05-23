import { faPerson } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function LoaderBeforeFetching(){
    return (
     <div className="h-screen bg-[#383739] flex flex-col justify-center items-center gap-10">
    <div className="flex justify-center items-end gap-4">
    <FontAwesomeIcon icon={faPerson} className="text-[5rem] h-28 w-28 bg-purple-500 p-2 rounded-full text-white animate-spin"/>
    <div className="text-white"><div className="loader-progress"></div></div>
    </div>
    <div className="text-white text-[1rem] animate-bounce hidden md:block">We are loading the webpage, please wait a few second</div>
    </div>
    )
}