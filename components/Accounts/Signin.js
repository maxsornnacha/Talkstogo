import { useState , useRef } from "react"
import axios from 'axios'
import Swal from "sweetalert2"
import { useRouter } from "next/router"
import Signup from "@/components/Accounts/Signup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose, faPerson } from "@fortawesome/free-solid-svg-icons";
import FileResizer from "react-image-file-resizer"
import { Cropper } from "react-cropper";
import "cropperjs/dist/cropper.css"

export default function Signin(props){
    const [loadingEvent,setLoadingEvent] = useState(false)
    const router = useRouter();


    const [signInInput,setSignInInput] = useState({
        emailInput:'',
        passwordInput:''
    })

    const {emailInput,passwordInput} = signInInput

    const handleEmailInput=(event)=>{
        setSignInInput((prev)=>{
           return({
            emailInput:event.target.value,
            passwordInput:prev.passwordInput
           }) 
        })
    }

    const handlePasswordInput=(event)=>{
        setSignInInput((prev)=>{
            return({
             emailInput:prev.emailInput,
             passwordInput:event.target.value
            }) 
         })
    }
    
    //check password , email and verified email 
    const [isWrongPassword , setIsWrongPassword] = useState(null)
    const [isWrongEmail , setIsWrongEmail] = useState(null)

    //Handle Verify Email Section 2/3
    //OTP CardDisplaying
    const [OTPverificationToggle, setOTPverificationToggle] = useState(false)
    //OTP input
    const [OTP, setOTP] = useState('')
    const [loadingOTP , setLoadingOTP] = useState(false)
    const [loadingSendingOTP , setLoadingSendingOTP] = useState(false)
    const [profileInputToggle , setProfileInputToggle] = useState(false)
    const [profileImageCopperToggle, setProfileImageCopperToggle] = useState(false)

    //OTP entering button
    const handleVerifyOTP=(event)=>{
        event.preventDefault();
        
        setLoadingOTP(true)
        axios.put(`${process.env.API_URL}/verify-otp-account`,{email:emailInput , OTP:OTP})
        .then((data)=>{
            Swal.fire({
                text: "Section 2 successfully completed",
                showConfirmButton: false,
                timer: 1500,
                position:"top"
            })
            .then(()=>{
            Swal.fire({
                text: "We are redirecting you to Section 3",
                showConfirmButton: false,
                timer: 1500,
                position:"top"
            }).then(()=>{
                setOTPverificationToggle(false);
                setProfileInputToggle(true);
            })
            })
        })
        .catch((error)=>{
            Swal.fire({
                title: "Error Verification",
                text: error.response.data.error.replace(/"/g, "")
            })
            .then(()=>{
                setOTP('')
            })
        })
        .finally(()=>setLoadingOTP(false))
    }


    //OTP request sent button
    const handleSendVerifyOTP=(event)=>{
        event.preventDefault();

        setLoadingSendingOTP(true)
        axios.post(`${process.env.API_URL}/send-otp-account`,{email:emailInput})
        .then((data)=>{
            Swal.fire({
                title:'Successful OTP sending',
                text: "OTP has been sent to your email address",
                showConfirmButton: false,
                timer: 1500,
                position:"top"
            })
        })
        .catch((error)=>{
            Swal.fire({
                title: "Error OTP sending",
                text: error.response.data.error.replace(/"/g, "")
            });
        })
        .finally(()=>{
            setLoadingSendingOTP(false)
        })
    }

    //Set Profile Picture Section 3
    const [accountImage,setAccountImage] = useState(null)
    const [accountImageCopped , setAccountImageCopped] = useState(null)
    const [loadingAccountImage , setLoadingAccountImage] = useState(false)
    const cropperRef = useRef();
    const onCrop = () => {
      const cropper = cropperRef.current?.cropper;
      setAccountImageCopped(cropper.getCroppedCanvas().toDataURL())
    };


    //Base64 convert Image and store in the var
    const handleFileUpload=(event)=>{
        try{
        const file = event.target.files[0]
        FileResizer.imageFileResizer(
            file, // Is the file of the image which will resized.
            720, // Is the maxWidth of the resized new image.
            720, // Is the maxHeight of the resized new image.
            "JPEG", // Is the compressFormat of the resized new image.
            100, // Is the quality of the resized new image.
            0, // Is the degree of clockwise rotation to apply to uploaded image.
            (url)=>{
                setAccountImage(url);
                setProfileImageCopperToggle(true);
            }, // Is the callBack function of the resized new image URI.
            "base64", // Is the output type of the resized new image.
          );
        }catch(error){
            console.log('ไม่พบ file')
            console.log(error)
        }
     }

     //Create a Profile Picture
     const submitCreateProfilePicture = (event)=>{
        event.preventDefault()
        //accountImage
        Swal.fire({
            imageUrl: accountImage?accountImage:"/defaultProfile.png",
            imageHeight: 200,
            imageHeight: 200,
            title: "Confirmation",
            text: "Would you like to select this profile picture?",
            showCancelButton:true
        }).then((status)=>{
            if(status.isConfirmed){
                setLoadingAccountImage(true)
                axios.put(`${process.env.API_URL}/add-profile-image`,{email:emailInput, accountImage:accountImage})
                .then(()=>{
                    Swal.fire({
                        text: "Section 3 successfully completed",
                        showConfirmButton: false,
                        timer: 1500,
                        position:"top"
                    }).then(()=>{
                        Swal.fire({
                            text: "We are redirecting you to Login Page",
                            showConfirmButton: false,
                            timer: 1500,
                            position:"top"
                        }).then(()=>{
                            setProfileInputToggle(false);
                        })
                    })
                })
                .catch((error)=>{
                    Swal.fire({
                        title: "Profile Image Creating Error ",
                        text: error.response.data.error.replace(/"/g, "")
                    });
                })
                .finally(()=>{
                    setLoadingAccountImage(false);
                })

            }
        })
     }


     //Login Process
    const handleSubmitForm=(event)=>{
        event.preventDefault()
        setLoadingEvent(true)
        axios.post(`${process.env.API_URL}/login-account`,{emailInput,passwordInput},{
            withCredentials: true,
        })
        .then(async (response)=>{  
            //login สำเร็จ
            Swal.fire({
                text: 'Login successfully , welcome to TalksToGo',
                showConfirmButton: false,
                timer: 1500,
                position: "top",
            })
            .then(()=>{
                router.push('/');
              })
               
        })
        .catch((error)=>{
            if(error.message === 'Network Error'){
                Swal.fire({
                    icon: 'error',
                    title: 'Network Error',
                    text:error
                })
            }
            else{

                if(error.response.data.error && error.response.data.error === 'email'){
                    setIsWrongEmail(true);
                    setIsWrongPassword(false);
                }
                else if(error.response.data.error && error.response.data.error === 'password'){
                    setIsWrongPassword(true);
                    setIsWrongEmail(false);
                }
                else if(error.response.data.error && error.response.data.error === 'unverified'){
                    //จำนำไปหน้า OTP verification
                    Swal.fire({
                        title: 'Verification Section 2/3',
                        text: 'Your email has not been verified, would you like to verify now?',
                        showCancelButton:true
                    })
                    .then((status)=>{
                        if(status.isConfirmed){
                            setOTPverificationToggle(true)
                        }
                    })
                }
                else{
                        Swal.fire({
                            icon: 'error',
                            title: 'Oops...',
                            text: error,
                        })
                }
            }
        })
        .finally(()=>setLoadingEvent(false))
    
    }



    //handle Signup 

    const [toggleSignUp,setToggleSign] = useState(false)
    const [cancelClick,setCancelClick] = useState(false)
  
  
    const handleCancel=(cancelResultFromChild)=>{
      setCancelClick(cancelResultFromChild)
    }
  
    const handleToggle=(toggleResultFromChild)=>{
      setToggleSign(false)
    }

    return (
    <div>
        <div>
            {!toggleSignUp && !cancelClick && !OTPverificationToggle && !profileInputToggle && !profileImageCopperToggle &&
           
           <div className="h-screen py-6 flex flex-col items-center ">
            <div className="mb-10 flex flex-col items-center gap-1">
            <FontAwesomeIcon icon={faPerson} className="w-20 h-20 rounded-md p-2 border-2 bg-purple-700 border-white "/>
            <div className="font-bold">TALKSTOGO</div>
            </div>
           <div className="relative py-3 sm:max-w-md sm:mx-auto w-[70vw]">
             <div className="absolute inset-0 bg-gradient-to-r from-purple-300 to-purple-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 rounded-md sm:rounded-3xl"></div>
             <div className="relative px-4 py-10 bg-[#383739] shadow-lg rounded-sm ">
               <div className="max-w-md mx-auto">
                 <div className="text-center">
                   <h1 className="text-[1.4rem] font-semibold text-white ">Login to your account</h1>
                 </div>
                 <div className="divide-y divide-white">
                   <div className="pt-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                     <div className="relative py-2">
                       <input
                         value={emailInput}
                         onChange={handleEmailInput}
                         autoComplete="off"
                         id="emailID"
                         name="email"
                         type="text"
                         className=" rounded-sm px-2 text-[0.8rem] peer placeholder-transparent h-10 w-full  text-white focus:outline-none focus:border-purple-600 bg-[#383739] border border-gray-500"
                       />
                       <label htmlFor="email" className=" text-[0.8rem] absolute left-0 -top-3.5 text-gray-200 peer-placeholder-shown:text-[0.8rem] peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-200">
                         Email Address
                       </label>
                     </div>
                     <div className="relative pt-2">
                       <input
                         value={passwordInput}
                         onChange={handlePasswordInput}
                         autoComplete="off"
                         id="passwordID"
                         name="password"
                         type="password"
                         className="rounded-sm px-2 text-[0.8rem] peer placeholder-transparent h-10 w-full  text-white focus:outline-none focus:border-purple-600 bg-[#383739] border border-gray-500"
                       />
                       <label htmlFor="password" className="text-[0.8rem] absolute left-0 -top-3.5 text-gray-200 peer-placeholder-shown:text-[0.8rem] peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-200">
                         Password
                       </label>
                     </div>
                     {isWrongEmail && <div className="text-red-400 text-[0.75rem] font-semibold ">Email is wrong</div>}
                     {isWrongPassword && <div className="text-red-400 text-[0.75rem] font-semibold">Password is wrong</div>}
                     <div className="relative">
                       <button disabled={loadingEvent?true:false} onClick={handleSubmitForm} className="bg-purple-700 hover:bg-purple-600 text-white rounded-md h-10 w-full flex justify-center items-center text-[1rem] font-semibold">
                         {!loadingEvent ? 'Continue' : <div className="loader-event-dot text-[2px] w-2"></div>}
                       </button>
                     </div>
                     <div className="w-full">
                       <button className="text-white hover:text-purple-500 font-medium text-[0.8rem]" onClick={() => { setToggleSign(true); setCancelClick(true); }}>
                         Create a new account
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
      
         }
        </div>
            

        {toggleSignUp && cancelClick &&
                <div>
                <Signup cancel={handleCancel} toggle={handleToggle}/>
                </div> 
        }

        {OTPverificationToggle &&
        <div className="sign-form-up xl:w-[30vw] lg:w-[40vw] md:w-[50vw] h-[50vh] px-1 z-50 bg-[#383739] text-white ">

            
            <div className="my-5">
                 <FontAwesomeIcon onClick={()=>{setOTPverificationToggle(false);}} icon={faClose} className="w-6 h-6 cursor-pointer hover:text-purple-700"/>
            </div>

                    <div className="font-semibold my-5 w-full text-center text-[1.4rem]">
                        <div className="text-center">Email Verification</div>
                        <p className="text-[0.8rem] font-normal text-gray-400">We have sent a code to your email {emailInput}</p>
                    </div>

                    <div className="py-2 text-[0.8rem] mx-2">
                        <input value={OTP} onChange={(event)=>setOTP(event.target.value)} type="text" placeholder="OTP code" className={`rounded-md bg-[#383739] border border-gray-600  text-white focus:border focus:border-purple-700  py-2 px-2 mb-4 outline-none w-full `}/>
                    </div>

                    <div className="w-full px-2">
                        <button onClick={handleVerifyOTP} className="flex flex-row items-center justify-center text-center w-full border rounded-xl outline-none h-12 bg-purple-700 hover:bg-purple-600 border-none text-white text-sm shadow-sm ">
                        {!loadingOTP ? 'Verify account' : <div className="loader-event-dot text-[2px] w-2"></div>}
                        </button>
                    </div>

                    <div className="py-4 text-gray-400 flex items-center w-full justify-center gap-1 ">
                        <div className="text-[0.8rem]">Didn't recieve code?</div>
                        <button onClick={handleSendVerifyOTP}  className=" text-purple-300 hover:text-purple-200 active:text-purple-200 font-bold text-[0.8rem]">
                        {!loadingSendingOTP ? 'Send OTP' : <div className="loader-event-dot text-[2px] w-2"></div>}
                        </button>
                    </div>  
        </div>
        }

        {profileInputToggle && !profileImageCopperToggle &&
        <div className="sign-form-up  w-[30vw] h-auto z-50 bg-[#383739] text-white">
                <div className="py-3 bg-[#383739] border-b border-gray-600 text-white text-center text-[1rem] font-semibold">
                    Section 3
                </div>
                <div className="font-semibold my-4">
                </div>
                <div className=" text-white w-full flex flex-col items-center pb-2">
                <label htmlFor="account-picture" className="cursor-pointer text-white py-2 px-2" >
                    <img src={accountImage?accountImage:'/defaultProfile.png'} htmlFor="account-picture" className="rounded-full h-56 w-56"  alt="profile's Image"/>
                </label>
                <label htmlFor="account-picture" className="w-full text-center" >
                <span className="hover:text-purple-500 font-semibold cursor-pointer text-[0.8rem]">Click here to select your profile picture</span>
                </label>    
                <input type="file" id="account-picture" hidden={true} onChange={handleFileUpload}/>
                </div>
                <div className="flex px-2">
                <button disabled={loadingAccountImage?true:false} onClick={submitCreateProfilePicture} className="w-full flex justify-center items-center bg-purple-600 hover:bg-purple-700 active:bg-purple-700 text-white mt-3 mb-10  h-11  font-semibold text-[1rem]">
                    {!loadingAccountImage ? '+ Create a Profile picture' : <div className="loader-event-dot text-[2px] w-2"></div>} 
                </button>
                </div>
        </div>
        }

        {profileImageCopperToggle &&
        <div className="sign-form-up  w-[40vw] h-auto z-50 bg-[#383739] border border-gray-600 text-white">
              <div className="py-4 bg-[#383739] border border-gray-600 flex items-center justify-center">
                    <Cropper
                    src={accountImage}
                    style={{ height: "70%", width: "70%" }}
                    // Cropper.js options
                    initialAspectRatio={16 / 16}
                    guides={false}
                    crop={onCrop}
                    ref={cropperRef}
                    />
                </div>

                <div className="flex justify-between w-full gap-10 px-2">
                    <button onClick={()=>{setProfileImageCopperToggle(false);}} className="font-semibold hover:text-purple-700">Cancel</button>
                    <button onClick={()=>{setAccountImage(accountImageCopped); setProfileImageCopperToggle(false);}} className=" text-white bg-purple-800 rounded-md hover:bg-purple-700 active:bg-purple-700 mt-3 py-2 mb-4  font-semibold  px-10">Select</button>
                </div>
        </div>
        }
        
    
    </div>
    )
}