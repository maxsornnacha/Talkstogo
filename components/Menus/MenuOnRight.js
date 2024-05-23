import { faQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { Tooltip } from "react-tooltip"
import 'react-tooltip/dist/react-tooltip.css'



export default function MenuOnRight(){
return (
<div className="text-[0.8rem] text-white lg:flex flex-col px-2 py-4">
        <div className="flex justify-between items-center">
            <div className="text-[1rem] font-semibold">TalkToGo</div>
            <Link href={`${process.env.HELP_URL}`} rel="noopener noreferrer" target="_blank">
            <FontAwesomeIcon id="help" icon={faQuestion} className="w-3 h-3 p-2 rounded-md bg-stone-900 hover:bg-stone-800 active:bg-stone-800 outline-none"/>
            </Link>
            <Tooltip 
            anchorSelect={`#help`} place='left' style={{fontSize:'0.7rem' , position:'fixed' , backgroundColor:'black', zIndex:'1000'}}
            >
            Need some help ?
            </Tooltip>
        </div>
        

        <div className=" py-20">
            &nbsp;&nbsp;&nbsp;Welcome to TalkToGo, hope you find friends and then talk to them.
        </div>
</div>
)
}