import AllFriendList from "@/components/Friends/AllFriendList"
import MenuBarOn from "@/components/Menus/MenuBarOnLeft"
import RoomsOnMain from "@/components/TalkingRooms/RoomsOnMain"
import Navbar from "@/components/Navbars/NavbarOther"
import { useState,useEffect } from "react"
import { useRouter } from "next/router"
import axios from "axios"
import UserDataFetching from "@/services/UserDataFetching"
import Notfound from "@/components/404"
import LoaderBeforeFetching from "@/components/loader/LoaderBeforeFethcing"
import Head from "next/head"

export default function Friends(){
    const [userLogin,setUserLogin] = useState(null)
    const [accountData,setAccountData] = useState(null)
    const [allFriendsData,setAllFriendsData] = useState([])
    const [inputValue,setInputValue] = useState('')
    const [dataFiltered,setDataFiltered] = useState(null)

    const router = useRouter()
    const {id} = router.query


    const [menuBarOnLeftLoading,setMenuBarOnRightLoading] = useState(true);
    const [roomOnMainLoading , setRoomOnMainLoading] = useState(true);
    const [singleAccountDataLoading , setSingleAccountDataLoading] = useState(true);

    const MenuBarOnLoadingStatus=()=>{
      setMenuBarOnRightLoading(false);
    }

    const RoomsOnMainLoadingStatus=()=>{
      setRoomOnMainLoading(false);
    }

      //fetching my account Data
        useEffect(() => {
          const fetchData = async () => {
            setUserLogin(await UserDataFetching());   
  
          if(!(await UserDataFetching())){
              router.push('/')
            }
          };
          fetchData();
        }, [id]);
  
   
    const fetchData = async () => {
        await axios.get(`${process.env.API_URL}/single-account-data/${id}`,{
          headers:{
            Authorization: `Bearer ${userLogin.token_key}`
        }
        })
        .then( (response)=>{
        setAccountData(()=>{
            return {'accountData':response.data}
        })
        })
        .catch((error)=>{
          console.log(error)
        })
        .finally(()=>{
          setSingleAccountDataLoading(false);
        })
    };

      useEffect(() => {
        if(userLogin){
            if (id === userLogin.accountData.id) {
            fetchData();
            }else{
              setSingleAccountDataLoading(false);
            }
        }
      
        },[userLogin]);

        const friendDataUpdate=(data)=>{
          setAllFriendsData(data)
        }
      
        //filter for searching
      const handleSearch=async (event)=>{
          event.preventDefault()
          await setDataFiltered((allFriendsData).filter((account)=>{

              return (
              (`${account.firstname} ${account.lastname}`).toLowerCase().includes(inputValue.toLowerCase())
              ||
              account.username.toLowerCase().includes(inputValue.toLowerCase())
              )
          }))
          if(inputValue === ''){
              setDataFiltered(null)
          }
     
  }


  if(!singleAccountDataLoading){
    //เช็คว่าล็อคอินรึยัง ล็อคอินตรงกันมั้ย
    if(id === userLogin.accountData.id ){
      return(
      <>
      <Head>
        <title>Friends | TalksToGo</title>
      </Head>
      <div className="bg-[#383739]">
      <div className={`${!roomOnMainLoading && !menuBarOnLeftLoading && !singleAccountDataLoading?'flex':'hidden'}`}>
          <div className="w-[70px] bg-[#050111]">
          <RoomsOnMain userData={userLogin} RoomsOnMainLoadingStatus={RoomsOnMainLoadingStatus}/>
          </div>

          <div className="hidden md:block text-white h-screen overflow-hidden hover:overflow-y-auto bg-[#161617]">
          <MenuBarOn userData={userLogin} MenuBarOnLoadingStatus={MenuBarOnLoadingStatus}/>
          </div>

        <div className="flex-1">
          <Navbar userData={userLogin}/>
        
        {accountData &&
        <div className="text-white">
            <div className="bg-[#161617] px-2 h-[40px] text-[1rem] flex justify-between items-center">
              <div># Friends </div>

              <div className="justify-center hidden md:flex">
                <input placeholder="Search the name or username" value={inputValue} onChange={(event)=>setInputValue(event.target.value)} type="text" className="px-2 py-1 bg-stone-800 rounded-l-2xl w-56  text-[0.75rem] outline-none border border-gray-600 focus:border-purple-700"/>
                <button onClick={handleSearch} className="rounded-r-2xl px-3 text-[0.75rem] bg-purple-600 text-white  hover:bg-purple-700 py-1">Search</button>
              </div>

            </div>

            <div className="justify-center flex md:hidden p-2">
                <input placeholder="Search the name or username" value={inputValue} onChange={(event)=>setInputValue(event.target.value)} type="text" className="px-2 py-1 bg-gray-900 rounded-l-2xl  w-full text-[0.75rem] outline-none border border-gray-600 focus:border-purple-700"/>
                <button onClick={handleSearch} className="rounded-r-2xl px-3 text-[0.75rem] bg-purple-600 text-white  hover:bg-purple-700 py-1">Search</button>
            </div>

            <div className="h-[80dvh] overflow-y-auto">
            <AllFriendList dataFiltered={dataFiltered} friendDataUpdate={friendDataUpdate} handleDataFiltered={dataFiltered}  accountLogin={userLogin} accountID={accountData.accountData._id} /> 
            </div>
        </div>
        }
        </div>
    </div>

    <div className={`${!roomOnMainLoading && !menuBarOnLeftLoading && !singleAccountDataLoading?'hidden':'block'}`} >
      <LoaderBeforeFetching/>
    </div>
    
    </div>
    </>
    )

    }else{
      return <Notfound/>
    }
}
else{
    return (
      <div className='block' >
      <LoaderBeforeFetching/>
      </div> 
    )
}

}