import { useEffect, useState} from "react";
import Signin from "@/components/Accounts/Signin";
import { useRouter } from "next/router";
import UserDataFetching from "@/services/UserDataFetching";
import LoaderBeforeFetching from "@/components/loader/LoaderBeforeFethcing";
import Head from "next/head";


export default function Home() {
  const redirect = useRouter()
  const [loading ,setLoading] = useState(true);


  useEffect(()=>{
    const fetching=async ()=>{
      if(await UserDataFetching()){
          redirect.push('/')
      }else{
        setLoading(false)
      }
    }

    fetching()
  
  },[])

  if(loading){
  return(
    <div className={`block`} >
    <LoaderBeforeFetching/>
    </div>
  )
  }
  else{
  return (
    <div>
    <Head>
    <title>Login | TalksToGo</title>
    </Head>
    <div className={`md:hidden insert-picture-login text-gray-100 h-screen w-screen flex flex-col items-center`}>
          <div className="h-full">
            <Signin/>
          </div>
    </div>


    <div className="hidden md:block text-white ">
    <div className="flex justify-center self-center insert-picture-login h-screen shadow-md shadow-gray-500">
      <div className="flex w-full">
        <div className="m-10 w-full rounded-md flex justify-center items-center z-50">
        <Signin/>
        </div>
      </div>
    </div>
    </div>

    </div>
  )
  }  
}