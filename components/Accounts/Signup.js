import { useEffect, useState, useRef } from "react"
import FileResizer from "react-image-file-resizer"
import Swal from "sweetalert2"
import axios from "axios"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEnvelope, faImage, faUser } from "@fortawesome/free-solid-svg-icons"
import { Cropper } from "react-cropper";
import "cropperjs/dist/cropper.css"

export default function Signup(props){

    //Uppercase Module
    function capitalizeFirstChar(inputString) {
        // Check if the inputString is not empty
        if (inputString && inputString.length > 0) {
          // Capitalize the first character and concatenate the rest of the string
          return inputString.charAt(0).toUpperCase() + inputString.slice(1);
        } else {
          // Return an empty string if the input is empty
          return inputString;
        }
    }


    //จัดการปุ่มกดปิด
    const handleCancel=(event)=>{
        event.preventDefault()
        props.cancel(false)
        props.toggle(false)
    }


    //Input form data
    const [formData,setFormData] = useState({
        firstname:'',
        lastname:'',
        username:'',
        email:'',
        password:'',
        passwordConfirm:''
    })
     //destucturing data form ทั้งหมด
     const {firstname,lastname,username,email,password,passwordConfirm} = formData

    //Loading
    const [loadingEvent,setLoadingEvent] = useState(false)

    // Password Validation
    const [validation,setValidation] = useState({
        moreThan8:false,
        includingChar:false,
        inCludingInt:false
    })
    const {moreThan8,includingChar,inCludingInt} = validation


    const validatingPassword=()=>{
        if(password.length >= 8){
            setValidation((prev)=>{
              return({
                  moreThan8:true,
                  includingChar:prev.includingChar,
                  inCludingInt:prev.inCludingInt
              })
          })
      }else{
        setValidation((prev)=>{
            return({
                moreThan8:false,
                includingChar:prev.includingChar,
                inCludingInt:prev.inCludingInt
            })
        })
      }
      if(containsCharacters(password)){
           setValidation((prev)=>{
              return({
                  moreThan8:prev.moreThan8,
                  includingChar:true,
                  inCludingInt:prev.inCludingInt
              })
          })
      }else{
        setValidation((prev)=>{
            return({
                moreThan8:prev.moreThan8,
                includingChar:false,
                inCludingInt:prev.inCludingInt
            })
        })
      }

      if(containsNumber(password)){
           setValidation((prev)=>{
              return({
                  moreThan8:prev.moreThan8,
                  includingChar:prev.includingChar,
                  inCludingInt:true
              })
          })
      }else{
        setValidation((prev)=>{
            return({
                moreThan8:prev.moreThan8,
                includingChar:prev.includingChar,
                inCludingInt:false
            })
        })
      }
    }

    useEffect(()=>{
        validatingPassword()
    },[password])

    //module validating for including char
    const containsCharacters = (input) => {
        // Regular expression to check if the input contains at least one alphabetical character
        const regex = /[a-zA-Z]/;
        return regex.test(input);
    };

    //module validating for including num
    const containsNumber = (input) => {
        // Regular expression to check if the input contains at least one digit (0-9)
        const regex = /\d/;
        return regex.test(input);
    };


     const handleChangeForFirstname=(event)=>{

            setFormData((prev)=>{
                return({
                    firstname:capitalizeFirstChar(event.target.value),
                    lastname:prev.lastname,
                    username:prev.username,
                    email:prev.email,
                    password:prev.password,
                    passwordConfirm:prev.passwordConfirm
                })
            })
     }

     const handleChangeForLastname=(event)=>{
        setFormData((prev)=>{
            return({
                firstname:prev.firstname,
                lastname:capitalizeFirstChar(event.target.value),
                username:prev.username,
                email:prev.email,
                password:prev.password,
                passwordConfirm:prev.passwordConfirm
            })
        })
    }

    const handleChangeForUsername= async (event)=>{
        setFormData((prev)=>{
            return({
                firstname:prev.firstname,
                lastname:prev.lastname,
                username:event.target.value,
                email:prev.email,
                password:prev.password,
                passwordConfirm:prev.passwordConfirm
            })
        })
    }

    const handleChangeForEmail=(event)=>{
        setFormData((prev)=>{
            return({
                firstname:prev.firstname,
                lastname:prev.lastname,
                username:prev.username,
                email:event.target.value,
                password:prev.password,
                passwordConfirm:prev.passwordConfirm
            })
        })
    }

    const handleChangeForPassword=(event)=>{
        setFormData((prev)=>{
            return({
                firstname:prev.firstname,
                lastname:prev.lastname,
                username:prev.username,
                email:prev.email,
                password:event.target.value,
                passwordConfirm:prev.passwordConfirm
            })
        })
    }

    const handleChangeForPasswordConfirm=(event)=>{
        setFormData((prev)=>{
            return({
                firstname:prev.firstname,
                lastname:prev.lastname,
                username:prev.username,
                email:prev.email,
                password:prev.password,
                passwordConfirm:event.target.value
            })
        })
    }

    const [noFirstname, setNoFirstname] = useState(false)
    const [noLastname, setNoLastname] = useState(false)
    const [noUsername, setNoUsername] = useState(false)
    const [noEmail, setNoEmail] = useState(false)
    const [noPassword, setNoPassword] = useState(false)
    const [noPasswordConfirm, setNoPasswordConfirm] = useState(false)



    const handleCreatingAccount=(event)=>{
        event.preventDefault()
        
        if(firstname.length === 0){
            setNoFirstname(true)
        }else{
            setNoFirstname(false)
        }

        if(lastname.length === 0){
            setNoLastname(true)
        }else{
            setNoLastname(false)
        }

        if(username.length === 0){
            setNoUsername(true)
        }else{
            setNoUsername(false)
        }

        if(email.length === 0){
            setNoEmail(true)
        }else{
            setNoEmail(false)
        }

        if(password.length < 8  || !moreThan8 || !includingChar || !inCludingInt){
            setNoPassword(true)
        }else{
            setNoPassword(false)
        }

        if(passwordConfirm !== password || passwordConfirm.length === 0){
            setNoPasswordConfirm(true)
        }
        else{
            setNoPasswordConfirm(false)
        }

        if(firstname.length !== 0 && lastname.length !== 0 && username.length !== 0 && email.length !== 0 && password.length >= 8 && moreThan8 && includingChar && inCludingInt && passwordConfirm === password){
                Swal.fire({
                    icon:'question',
                    text:'Would you like to create an account ?',
                    showCancelButton:true
                }).then((result)=>{
                    setLoadingEvent(true)
                if(result.isConfirmed){
                    axios.post(`${process.env.API_URL}/create-account`,{firstname,lastname,username,password,email,accountImage})
                    .then(()=>{
                        Swal.fire({
                                text: "Section 1 successfully completed",
                                showConfirmButton: false,
                                timer: 1500,
                                position:"top"
                      })
                      .then(()=>{
                        Swal.fire({
                            text: "We are redirecting you to Section 2",
                            showConfirmButton: false,
                            timer: 1500,
                            position:"top"
                        })
                        .then(()=>{
                            setInfoInputToggle(false);
                            setOTPverificationToggle(true);
                        })
                      })
                      
                     })
                     .catch((error)=>{
                            Swal.fire({
                                icon: "Error Information Input",
                                text: error.response.data.error.replace(/"/g, "")
                         });
                     }) 
                    .finally(()=>setLoadingEvent(false))
                    
                 }else{
                    setLoadingEvent(false)
                }  
            }
            )
        }

    }


    //OTP verification handling
    const [OTP,setOTP] = useState('')
    const [loadingOTP , setLoadingOTP] = useState(false)
    const [loadingSendingOTP , setLoadingSendingOTP] = useState(false)

    const handleVerifyOTP=(event)=>{
        event.preventDefault();
        
        setLoadingOTP(true)
        axios.put(`${process.env.API_URL}/verify-otp-account`,{email , OTP})
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
            });
        })
        .finally(()=>setLoadingOTP(false))
    }

    //OTP request sent button
    const handleSendVerifyOTP=()=>{
        setLoadingSendingOTP(true)
        axios.post(`${process.env.API_URL}/send-otp-account`,{email})
        .then(()=>{
            Swal.fire({
                text: "Success, OTP has been sent to your email address",
                showConfirmButton: false,
                timer: 1500,
                position:"top"
            })
        })
        .catch((error)=>{
            Swal.fire({
                text: "Error OTP sending",
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
                 axios.put(`${process.env.API_URL}/add-profile-image`,{email:email, accountImage:accountImage})
                 .then(()=>{
                     Swal.fire({
                         text: "Section 3 successfully completed",
                         showConfirmButton: false,
                         timer: 1500
                     }).then(()=>{
                         Swal.fire({
                             text: "We are redirecting you to Login Page",
                             showConfirmButton: false,
                             timer: 1500
                         }).then(()=>{
                            props.cancel(false)
                            props.toggle(false)
                         })
                     })
                 })
                 .catch((error)=>{
                     Swal.fire({
                         text: "Profile Image Creating Error ",
                         text: error.response.data.error.replace(/"/g, "")
                     });
                 })
                 .finally(()=>{
                     setLoadingAccountImage(false);
                 })
 
             }
         })
      }
 


 

    const [talktogoAccount , setTalktogoAccount] = useState(true)
    const [infoInputToggle,setInfoInputToggle] = useState(true)

    const [OTPVerificationToggle, setOTPverificationToggle] = useState(false)
    const [profileInputToggle,setProfileInputToggle] = useState(false)
    const [profileImageCopperToggle,setProfileImageCopperToggle] = useState(false)


    return (
    <div>
        <div>
                   
            <div className={`${talktogoAccount && infoInputToggle && ' md:w-[70vw] lg:w-[60vw] xl:w-[50vw] h-[85vh]'} ${talktogoAccount && OTPVerificationToggle && 'xl:w-[50vw] lg:w-[60vw] md:w-[70vw] w-[100vw] xl:h-[50vh] md:h-[50vh] h-[100vh]'} ${profileInputToggle && talktogoAccount && !profileImageCopperToggle && 'xl:w-[50vw] md:w-[80vw] w-[100vw] xl:h-[60vh] md:h-[80vh] h-[100vh]'} sign-form-up flex z-50 text-white  overflow-auto p-2`} > 
            <div className={`hidden md:flex w-[230px] bg-purple-700  text-white text-[0.8rem]  flex-col justify-evenly px-1 ${profileImageCopperToggle && 'hidden'}`}>
                    <div className={`${infoInputToggle && talktogoAccount ? 'border-l-4 border-stone-100 px-2 py-2':'px-3'}`}>
                        <FontAwesomeIcon icon={faUser} className="w-8 h-5 pt-2 bg-stone-800 rounded-full"/>
                        <div className="font-normal">Section 1</div>
                        <p className="text-gray-300 text-[0.7rem]">Account Information input</p>
                    </div>
                    <div className={`${OTPVerificationToggle && talktogoAccount ? 'border-l-4 border-stone-100 px-2 py-2':'px-3'}`}>
                        <FontAwesomeIcon icon={faEnvelope} className="w-8 h-5 pt-2 bg-stone-800 rounded-full"/>
                        <div className="font-normal">Section 2</div>
                        <p className="text-gray-300 text-[0.7rem]">Email verification</p>
                    </div>
                    <div className={`${profileInputToggle && talktogoAccount ? 'border-l-4 border-stone-100 px-2 py-2':'px-3'}`}>
                        <FontAwesomeIcon icon={faImage} className="w-8 h-5 pt-2 bg-stone-800 rounded-full"/>
                        <div className="font-normal">Section 3</div>
                        <p className="text-gray-300 text-[0.7rem]">Account image selection</p>
                    </div>
            </div>

            <div className="flex-1 bg-[#383739]">

            <div className={`flex flex-col w-full bg-[#383739]`}>

                {infoInputToggle && talktogoAccount &&
                <form onSubmit={handleCreatingAccount} className="md:h-[75vh] h-[85vh]  flex flex-col text-white p-2 pt-10">
                <div className="flex-1">

                <div className="mb-4 font-semibold">
                        Get started on TalkToGo today
                </div>

                <div className="w-full px-2 flex items-center gap-2 bg-[#383739]">
                <div className="w-full flex-1">
                <div className="mb-5 w-full relative">
                <div hidden={!noFirstname} className="text-red-400 text-[0.7rem] absolute top-14 left-0 ">Please fill out your firstname</div>
                <div className="flex flex-col">
                <label className="text-[0.8rem] text-gray-100">Firstname*</label>
                <input placeholder="Firstname" className={` placeholder-transparent text-[0.8rem] bg-[#383739] border border-gray-500 text-white focus:border focus:border-purple-500 py-2 px-2 outline-none w-full capitalize 
                `}
                type="text" value={firstname} onChange={handleChangeForFirstname}/>
                </div>
                </div>
    
                <div className="mb-5 w-full relative ">
                <div hidden={!noLastname} className="text-red-400 text-[0.7rem] absolute top-14 left-0 ">Please fill out your lastname</div>
                <div className="flex flex-col">
                <label className="text-[0.8rem] text-gray-100">Lastname*</label>
                <input placeholder="Lastname" className={` placeholder-transparent text-[0.8rem] bg-[#383739] border border-gray-500 text-white focus:border focus:border-purple-500  py-2 px-2 outline-none w-full capitalize 
                `}
                type="text" value={lastname} onChange={handleChangeForLastname}/>
                </div>
                </div>
                </div>
                </div>
     
                
                
                <div className="w-full px-2 flex items-center bg-[#383739]">
                
                <div className="w-full flex-1 ">
                <div className="relative w-full mb-5">
                <div hidden={!noUsername} className="text-red-400 text-[0.7rem] absolute top-14 left-0">Please fill out your username</div>
                <div className="flex flex-col">
                <label className="text-[0.8rem] text-gray-100">Username*</label>
                <div className="flex">
                <input placeholder="Username" className={`peer placeholder-transparent bg-[#383739] border border-gray-500 text-white focus:border focus:border-purple-500  py-2 px-2 outline-none w-full text-[0.8rem]`}
                type="text" value={username} onChange={handleChangeForUsername}/>
                </div>
                </div>
                </div>

                <div className="mb-5 w-full relative">
                <div hidden={!noEmail} className="text-red-400 text-[0.7rem] absolute top-14 left-0 ">Please fill out your email</div>
                <div className="flex flex-col">
                <label className="text-[0.8rem] text-gray-100">Email Address*</label>
                <input placeholder="Email" className={`placeholder-transparent bg-[#383739] border border-gray-500 text-white focus:border focus:border-purple-500  py-2 px-2 outline-none w-full text-[0.8rem] 
                `}
                type="email" value={email} onChange={handleChangeForEmail}/>
                </div>
                </div>
                </div>

                </div>
                

             
                <div className="w-full px-2 flex items-center  bg-[#383739]">
                
                <div className="flex-1">
                <div className="w-full relative mb-5">
                <div className="flex flex-col">
                <label className="text-[0.8rem] text-gray-100">Password*</label>
                <input placeholder="Password" className={`text-[0.8rem] placeholder-transparent bg-[#383739] border border-gray-500 text-white focus:border focus:border-purple-500  py-2 px-2 outline-none w-full 
                `}
                 type="password" value={password} onChange={handleChangeForPassword}/>
                 <div>
                 <div className="flex flex-wrap top-14 left-0">
                <p className={moreThan8?"text-[0.7rem]  text-green-500":"text-[0.7rem]  text-red-400"}>Your password is more than 8 characters &nbsp;</p>
                <p className={includingChar?"text-[0.7rem]  text-green-500":"text-[0.7rem]  text-red-400"}>Your password contains at least one alphabetical character &nbsp;</p>
                <p className={inCludingInt?"text-[0.7rem]  text-green-500":"text-[0.7rem]  text-red-400"}>Your password contain at least one numeric character</p>
                </div>
                </div>
                 </div>
                </div>
                
                <div className="mb-5 relative w-full">
                <div hidden={!noPasswordConfirm} className="text-red-400 text-[0.75rem] absolute top-14 left-0 ">Your password confirmation was not correct</div>
                <div className="flex flex-col">
                <label className="text-[0.8rem] text-gray-100">Password Confirmation*</label>
                <input placeholder="Password Confirmation" className={`text-[0.8rem] placeholder-transparent bg-[#383739] border border-gray-500 text-white focus:border focus:border-purple-500  py-2 px-2 outline-none w-full 
                `}
                type="password" value={passwordConfirm} onChange={handleChangeForPasswordConfirm}/>
                </div>
                </div>
                </div>
                </div>
                </div>


                <div className="flex gap-1 pb-2 justify-between text-[0.9rem]">
                <button onClick={handleCancel} type="submit" className="text-white font-semibold py-2 px-5 rounded-md hover:text-purple-500 active:text-purple-500">
                    Back
                </button>
                <button type="submit" className="text-white font-semibold flex justify-center items-center h-10 w-32 rounded-md bg-purple-500 hover:bg-purple-600 active:bg-purple-600">
                    {!loadingEvent ? 'Next' : <div className="loader-event-dot text-[2px] w-2"></div>}
                </button>
                </div>
                </form>
                }

                {OTPVerificationToggle && talktogoAccount &&
                <>
                    <div className="font-semibold my-5 w-full text-center text-[1.4rem]">
                        <div className="text-center">Email Verification</div>
                        <p className="text-[0.8rem] font-normal text-gray-100">We have sent a code to your email {email}</p>
                    </div>

                    <div className="py-2 text-[0.8rem] mx-2">
                        <input value={OTP} onChange={(event)=>setOTP(event.target.value)} type="text" placeholder="OTP code" className={`rounded-md bg-[#383739] border border-gray-500 text-white focus:border focus:border-purple-500  py-2 px-2 mb-4 outline-none w-full `}/>
                    </div>

                    <div className="w-full px-2">
                        <button onClick={handleVerifyOTP} className="flex flex-row items-center justify-center text-center w-full border rounded-xl outline-none h-12 bg-purple-700 hover:bg-purple-600 border-none text-white text-sm shadow-sm ">
                        {!loadingOTP ? 'Verify account' : <div className="loader-event-dot text-[2px] w-2"></div>}
                        </button>
                    </div>

                    <div className="py-4 text-gray-100 flex items-center w-full justify-center gap-1 ">
                        <div className="text-[0.8rem]">Didn't recieve code?</div>
                        <button onClick={handleSendVerifyOTP}  className=" text-purple-300 hover:text-purple-200 font-bold text-[0.8rem]">
                        {!loadingSendingOTP ? 'Send OTP' : <span className="loader-event text-[3px] bottom-1 mx-2">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>}
                        </button>
                    </div>
                </>
                }

                {profileInputToggle  && talktogoAccount && !profileImageCopperToggle &&
                <>
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
                <button disabled={loadingAccountImage?true:false} onClick={submitCreateProfilePicture} className="flex justify-center items-center bg-purple-600 hover:bg-purple-700 active:bg-purple-700 text-white mt-3 mb-10 h-11  font-semibold text-[1rem] mx-2">
                    {!loadingAccountImage ? '+ Create a Profile picture' : <div className="loader-event-dot text-[2px] w-2"></div>} 
                </button>
                </>
                }

                {profileImageCopperToggle &&
                <>
                <div className="flex flex-col  h-[79vh]">
                <div className="flex-1 bg-[#383739] flex items-center justify-center">
                    <Cropper
                    src={accountImage}
                    style={{ height: "500px", width: "500px" }}
                    // Cropper.js options
                    initialAspectRatio={16 / 16}
                    guides={false}
                    crop={onCrop}
                    ref={cropperRef}
                    />
                </div>

                <div className="flex justify-between w-full gap-10 px-10 h-20 ">
                    <button onClick={()=>{setProfileImageCopperToggle(false);}} className="font-semibold hover:text-purple-700">Cancel</button>
                    <button onClick={()=>{setAccountImage(accountImageCopped); setProfileImageCopperToggle(false);}} className=" text-white bg-purple-500 rounded-md hover:bg-purple-400 active:bg-purple-400 mt-3 py-2 mb-4  font-semibold  px-10">Select</button>
                </div>
                </div>
                </>
                }                
            </div>    
            </div>     
            </div>

        </div>
    </div>
    )
}