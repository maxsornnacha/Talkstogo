import Link from "next/link"
import axios from "axios"
import { useState,useEffect } from "react"

export default function Search(props){
    const [inputValue,setInputValue] = useState('')
    const [accounts,setAccounts] = useState([])
    const [dataFiltered,setDataFiltered] = useState(null)
    const [loadingSearchingAccounts,setLoadingSearchingAccounts] = useState(true);

    const fetch = async () =>{
        axios.get(`${process.env.API_URL}/get-all-accounts`,{
            headers:{
                Authorization: `Bearer ${props.userData.token_key}`
            }
        })
            .then((response)=>{
                //Need to verify to find in searching account list
                setAccounts(response.data.filter((account)=>{
                    return (account.verified === true)
                }))
            })
            .catch((error)=>{
                console.log(error.response.data.error)
            })
            .finally(()=>{
                setLoadingSearchingAccounts(false);
            })
    }

    useEffect(()=>{
        fetch()
    },[])

   useEffect(()=>{

            setDataFiltered(accounts.filter((account)=>{

                return (
                (`${account.firstname} ${account.lastname}`).toLowerCase().includes(inputValue.toLowerCase())
                ||
                account.username.toLowerCase().includes(inputValue.toLowerCase())
                )
            }))

            if(inputValue === ''){
                setDataFiltered(null)
            }
   
    },[inputValue])

    if(loadingSearchingAccounts){
    return(
    <>
    <div className="w-full text-center pt-1 pb-3 text-[1rem] font-normal"> Searching accounts </div>
     <div className="w-full flex justify-center pt-2 items-center h-full">
        <div className="loader-event-dot"></div>
    </div>
    </>
    )
    }
    else{
    return (
    <div className="w-full">
            <div className=" w-full text-center pt-1 text-[1rem] font-normal"> Searching accounts </div>
            <div className="text-[0.75rem] m-2 mt-4">The account searching</div>
            <div className="w-full flex justify-center">
            <input value={inputValue} onChange={(event)=>setInputValue(event.target.value)} placeholder="Search the name and username" className="bg-stone-800 mb-3 py-1 px-2 text-white rounded-md text-[0.75rem] outline-none border-gray-700 focus:border-violet-800 border w-5/6"/>
            </div>


            {!dataFiltered &&
            <div className="h-96 text-gray-200 flex justify-center items-center text-[0.75rem]"> 
                Let's find some friends
            </div>
            }

            {dataFiltered && dataFiltered.length === 0 &&
            <div className="h-96 text-gray-200 flex justify-center items-center text-[0.75rem]"> 
                Not found
            </div>
            }

            <div className="flex flex-col my-2">
            {dataFiltered &&
            dataFiltered.map((accountFiltered, index)=>{
                    return(
                    <button onClick={()=>props.handleClick(false)} key={index}>
                    <Link href={`/profile/${accountFiltered.id}`}>
                    <div className="flex items-center gap-2  rounded-md p-2 hover:bg-gray-700">
                        <img src={accountFiltered.accountImage.secure_url} className="w-8 h-8 rounded-full"/>
                        <div>
                            <div className="text-[0.75rem] text-start font-normal">{accountFiltered.firstname} {accountFiltered.lastname}</div>
                            <div className="text-[0.7rem] text-start font-normal">Username: {accountFiltered.username}</div>
                        </div>
                    </div>
                    </Link>
                    </button>
                    )
                })}
            </div>
    </div>
    )
    }
}