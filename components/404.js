import { faPerson } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Head from "next/head";
import Link from "next/link";


export default function Notfound(){

    return(
    <>
    <Head>
        <title>Not Found | TalkToGo</title>
    </Head>
    <div className="bg-[#383739] h-screen">
            <div className="h-full text-white font-bold flex flex-col gap-2 justify-center items-center">
                 <Link href={'/'}>
                 <FontAwesomeIcon icon={faPerson} className="text-[5rem] h-28 w-28 bg-purple-500 hover:bg-purple-600 p-2 rounded-md text-white"/>
                </Link>
                <div className="text-[1.2rem]">404 Not Found</div>
                <p className="text-[0.9rem]">There is no this page on TalkToGo</p>
            </div>
    </div>
    </>
    )
}