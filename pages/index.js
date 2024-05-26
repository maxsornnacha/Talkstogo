import WorldPost from "@/components/Posts/WorldPost"
import { useRouter } from "next/router"
import { useEffect,useState } from "react"
import UserDataFetching from '@/services/UserDataFetching'
import MenuBarOn from "@/components/Menus/MenuBarOnLeft"
import RoomsOnMain from "@/components/TalkingRooms/RoomsOnMain"
import LoaderBeforeFetching from "@/components/loader/LoaderBeforeFethcing"
import Head from "next/head"


export default function main(){
    const redirect = useRouter()
    const [userData,setUserData] = useState(null)
    const [roomOnMainLoading,setRoomOnMainLoading] = useState(true);
    const [MenuBarOnLoading, setMenuBarOnLoading] = useState(true);
    const [WorldPostLoading, setWorldPostLoading] = useState(true);

    useEffect(() => {
      const fetchData = async () => {
        setUserData(await UserDataFetching());   

      if(!(await UserDataFetching())){
          redirect.push('/login')
        }
      };

      fetchData();
    }, []);

    const WorldPostLoadingStatus = () => {
        setWorldPostLoading(false);
    }

    const MenuBarOnLoadingStatus =() => {
      setMenuBarOnLoading(false);
    }

    const RoomsOnMainLoadingStatus = () => {
      setRoomOnMainLoading(false);
    }


  //เช็คว่าได้ Login เข้ามารึยัง
  if(!userData){
    return(
      <div className='block' >
       <LoaderBeforeFetching/>
      </div>
    )
  }
  else{
  if(userData){
    return (
      <>
      <Head>
        <title>Home | TalksToGo</title>
      </Head>
      <div className={`${!roomOnMainLoading && !MenuBarOnLoading && !WorldPostLoading ?'flex':'hidden'} main`} >

          <div className='w-[70px] bg-[#050111]'>
          <RoomsOnMain userData={userData} RoomsOnMainLoadingStatus={RoomsOnMainLoadingStatus}/>
          </div>

          <div className="hidden md:block text-white h-screen overflow-hidden hover:overflow-y-auto bg-[#161617]">
          <MenuBarOn userData={userData} MenuBarOnLoadingStatus={MenuBarOnLoadingStatus}/>
          </div>
      
          <div className="bg-[#383739] flex-1">
          <WorldPost userData={userData} WorldPostLoadingStatus={WorldPostLoadingStatus}/>
          </div>

      </div> 


      <div className={`${!roomOnMainLoading && !MenuBarOnLoading && !WorldPostLoading ?'hidden':'block'}`} >
      <LoaderBeforeFetching/>
      </div>
    </>
    );
  }  
  }

}