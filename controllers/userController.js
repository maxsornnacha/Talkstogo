const Members = require('../models/registration')
const Verifications = require('../models/verification')
const bcrypt = require('bcrypt')
const cloudinary = require('cloudinary')
const jsonWT = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer')
const {expressjwt: jwt} = require('express-jwt')

cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
    api_key:process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.COULDINARY_API_SECRET 
  });

//nodemailar config
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASSWORD
    }
  });

  const sendOPTVerificationEmail = async (data , res)=>{
    try{
        const email =  data.email 
        const userID = data._id 
        const OTP =  `${Math.floor(1000 + Math.random() * 9000)}`

        //mail options
        const mailOptions = {
            from: process.env.AUTH_EMAIL,
            to: email,
            subject : "Verify your Email in TalksToGo",
            html: `<p>Fill OTP <b>${OTP}</b> on the website or application to verify your email address. Otherwise your account will be inaccessible.</p>
            <p>Please verify your email within <b>1 hour</b> or the OTP will be expire.</p>`
            }

            //hash the OTP
            const saltRounds = 10;
            const hashedOTP = await bcrypt.hash(OTP , saltRounds)

            //Save otp to DataBase
            await Verifications.create({
                userID:userID,
                OTP: hashedOTP
            })
            .then(()=>{
                transporter.sendMail(mailOptions , (error , info)=>{
                    if(error){
                        console.log(error)
                    }else{
                        console.log(info.response)
                    }
                })
                res.json({
                        userID:userID,
                        email:email
                })
            })
            .catch((error)=>{
                console.log('OTP was created unsuccessfully because :', error.message)
                res.json({error:error.message})
                errorMessage = error.message   
            })
    }
    catch(error){
        res.json({error:error.message})
        console.log(error.message)
    }
}

exports.createAccount = async (req,res)=>{
    const {firstname,lastname,username,password,email} = req.body
    const image = 'https://res.cloudinary.com/dakcwd8ki/image/upload/v1707512097/wwfulsac153rtabq45as.png'
    const passwordHashed = await bcrypt.hash(password,10)
    let statusDisplay = ''
    let errorMessage = ''
    

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
      };
    
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

    try{
        if(firstname.length === 0){
            errorMessage = 'Please fill out your firstname.'
            statusDisplay = 400
            res.status(400).json({error:'Please fill out your firstname.'})
        }
        else if(lastname.length === 0){
            errorMessage = 'Please fill out your lastname.'
            statusDisplay = 400
            console.log(2)
            res.status(400).json({error:'Please fill out your lastname.'})
        }
        else if(username.length === 0){
            errorMessage = 'Please fill out your username.'
            statusDisplay = 400
            res.status(400).json({error:'Please fill out your username.'})
        }
        else if(email.length === 0){
            errorMessage = 'Please fill out your email.'
            statusDisplay = 400
            res.status(400).json({error:'Please fill out your email.'})
        }
        else if(!validateEmail(email)){
            errorMessage = 'Please correct your email form.'
            statusDisplay = 400
            res.status(400).json({error:'Please correct your email form.'})
        }
        else if(password.length < 8){
            errorMessage = 'Your password is less than 8 characters.'
            statusDisplay = 400
            res.status(400).json({error:'Your password is less than 8 characters.'})
        }
        else if(!containsCharacters(password)){
            errorMessage = 'Your password must contain at least one alphabetical character.'
            statusDisplay = 400
            res.status(400).json({error:'Your password must contain at least one alphabetical character.'})
        }
        else if(!containsNumber(password)){
            errorMessage = 'Your password must contain at least one numeric character.'
            statusDisplay = 400
            res.status(400).json({error:'Your password must contain at least one numeric character.'})
        }
        else{
        CreatingAccount = await Members.create({
            id:uuidv4(),
            username:username,
            password:passwordHashed,
            firstname:firstname,
            lastname:lastname,
            email:email,
            accountImage:image,
            verified:false
        })
        .then((data)=>{
            sendOPTVerificationEmail(data , res)
        })
        .catch((error)=>{
            console.log('account was created incorrectly because :', error.message)
            errorMessage = `There is '${error.keyValue}' in the system already.`
            statusDisplay = 400
            res.status(400).json({'error':error.keyValue.email?`There is the email '${error.keyValue.email}' in the system already`:`There is the username '${error.keyValue.username}' in the system already`})
        })
    }
    }
    catch(error){
        console.log('account was created incorrectly because :', error.message)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
    }
}


exports.verifyOTPAccount = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const { email, OTP} = req.body


    const userData = await Members.findOne({ email: email })
    await Verifications.findOne({userID: userData._id})
    .then(async (data)=>{
        const verificationUpdatedTime = new Date(data.updatedAt)
        const currentTIme = new Date()
        // Calculate the time difference in milliseconds between the updatedAt and current time
        const timeDifferenceInMilliseconds = currentTIme.getTime() - verificationUpdatedTime.getTime();
        // Convert the time difference to minutes
        const timeDifferenceInMinutes = timeDifferenceInMilliseconds / (1000 * 60);
    
        //if the time is more than 60 minutes
        if(timeDifferenceInMinutes > 60){
            await Verifications.deleteMany({ userID:userData._id})
            res.status(404).json({error:'Your OTP has expired , please send an OTP request'})
            statusDisplay = 404
            errorMessage = 'Your OTP has expired , please send an OTP request'
        }else{
            const validOTP = await bcrypt.compare(OTP,data.OTP)
            //check OTP
            if(validOTP){
                await Verifications.deleteMany({ userID:userData._id})
                await Members.updateOne({email:email},{$set:{verified:true}})
                res.json('Varified Successfully')
            }else{
                res.status(400).json({error:'Your OTP is wrong, please try again'})
                statusDisplay = 400
                errorMessage = 'Your OTP is wrong, please try again'
            }
        }

    })
    .catch((error)=>{
        console.log('OTP was conducted unsuccessfully because :', error.message)
        res.status(404).json({error:'Your OTP has expired , please send an OTP request'})
        statusDisplay = 404
        errorMessage = 'Your OTP has expired , please send an OTP request'
    })
}catch(error){
    console.log('OTP was conducted unsuccessfully because :', error.message)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})

}
}


exports.sendOTPAccount = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const {email} = req.body
    
    const userData = await Members.findOne({ email: email })
    await Verifications.find({userID: userData._id})
    .then(async (data)=>{
        if(data.length > 0){
            //if there are requests already , the requests will be deleted
            await Verifications.deleteMany({ userID:userData._id})
        }
        //send OTP to email address
        sendOPTVerificationEmail(userData , res)
    })
    .catch((error)=>{
        console.log('OTP was sent unsuccessfully because :', error)
        res.status(404).json({error:error.message})
        statusDisplay = 404
        errorMessage = error.message
    })

}
catch(error){
    console.log('OTP was conducted unsuccessfully because :', error.message)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}
}

exports.addProfileImage = async (req,res)=>{
    let image = req.body.accountImage;
    let public_id = ''
try{
    const email = req.body.email;

     //Upload image to cloud storage
     if(image){
        await cloudinary.v2.uploader.upload(req.body.accountImage,
            { public_id:`${uuidv4()}-${Date.now()}`,
              folder:'talkstogo/account-images'
            })
            .then((result)=>{
                image=result
                public_id=result.public_id
            })
            .catch((error)=>{
                statusDisplay = 400
                errorMessage = error.message
                res.status(400).json({error:error.message})
                console.log(error)
            })
    }else{
        image = 'https://res.cloudinary.com/dakcwd8ki/image/upload/v1716573817/default-images/u1hpxlplwpgcusumfjnj.png'
    }

    const userData = await Members.findOne({ email: email })
    if(userData){
    await Members.findByIdAndUpdate({_id : userData._id},{$set: {accountImage: image}},{new:true})
    .then((data)=>{
        res.json({status: "success"})
    })
    .catch((error)=>{
        console.log("Profile Image was uploaded unsuccessfully because :", error.message)
        res.status(400).json({error:error.message})
        statusDisplay = 400
        errorMessage = error.message

          // Delete the image
          cloudinary.uploader.destroy(public_id)
          .then((result)=>console.log('Image deleted successfully :', result))
          .catch((error)=> console.error('Image deleted unsuccessfully :', error))
    })
    }else{
        console.log("Profile Image was uploaded unsuccessfully because : not found the account")
        res.status(404).json({error:"not found the account"})
        statusDisplay = 404
        errorMessage = "not found the account"

          // Delete the image
          cloudinary.uploader.destroy(public_id)
          .then((result)=>console.log('Image deleted successfully:', result))
          .catch((error)=> console.error('Image deleted unsuccessfully :', error))
    }

}
catch(error){
        console.log('Profile Image was uploaded unsuccessfully because :', error.message)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})

         // Delete the image
         cloudinary.uploader.destroy(public_id)
         .then((result)=>console.log('Image deleted successfully:', result))
         .catch((error)=> console.error('Image deleted unsuccessfully :', error))
}
    
}


exports.loginAccount = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''

    try{
    const {emailInput,passwordInput} = req.body
    const accountData = await Members.findOne({email:emailInput}).exec()
    
        if(accountData){
            const isConfirmed = await bcrypt.compare(passwordInput, accountData.password);
                if(isConfirmed){
                    if(accountData.verified){
                    const tokenKeyCreated = await jsonWT.sign({emailInput},process.env.JWT_SECRET_KEY,{
                        expiresIn:'3h'
                    })

                    //เก็บ token กับ email ลง session
                    req.session.token_key = tokenKeyCreated
                    req.session.accountData = accountData
                    req.session.login = true

                    res.json({status:'success'})
                }else{
                    console.log('unsuccessfully login because  : The email has not been verified')
                    res.status(400).json({error:'unverified'})
                    statusDisplay = 400
                    errorMessage = 'unverified'
                    //Unverified the email
                }

                }
                else{
                    console.log('unsuccessfully login because : The password is invalid')
                    res.status(400).json({error:'password'})
                    statusDisplay = 400
                    errorMessage = 'password'
                    //wrong password
                }
            }else{
                console.log('unsuccessfully login because  : The email is invalid')
                res.status(400).json({ error: 'email' })
                statusDisplay = 400
                errorMessage = 'email'
                //wrong email
            }
        }
        catch(error){
            console.log('unsuccessfully login because :', error)
            res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error})
            //server error
        }

}

//singleAccount forSession
exports.accountData = async (req,res)=>{
    try{
    //If there is already session in the system backend
   //console.log('session-check',req.session)
    if (req.session && req.session.login) {
        const token_key = req.session.token_key;
        const accountData = req.session.accountData
        res.json({accountData,token_key});
    }else{
            // If the session or login status is not present or there is no session
            res.status(401).json('Logged in failed');
    }

    }
    catch(error){
        res.status(500).json({error:error.message})
        console.log(error)
    }
}


//singleAccount forProfile
exports.singleAccountData= async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
    try{
        Members.findOne({id:req.params.id}).exec()
        .then((data)=>{
            res.json(data)
        })
        .catch((error)=>{
            console.log('Fetching an account error due to :', error)
            res.status(404).json({error:'No account was found'})
            statusDisplay = 404
            errorMessage = 'No account was found' 
        })

    }
    catch(error){
        console.log('Fetching an account error due to :', error)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
    }
  
}

exports.logoutAccount = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
    try{
    // check if you have logged in already ?
    if (req.session && req.session.login) {
        req.session.destroy((error) => {
          if (error) {
            console.log('Error destroying session:', error);
            res.status(500).json({error:'ออกจากระบบล้มเหลว เกิดข้อผิดพลาดจากการเชื่อมต่อเซิร์ฟเวอร์'});
          } else {
            res.json('Log out successfully.');
          }
        });
      } else {
        console.log('Logging out error due to :', error)
        res.status(404).json({error:'You have not logged in into the system'})
        statusDisplay = 404
        errorMessage = 'You have not logged in into the system'
      }
    }
    catch(error){
        console.log('Logging out error due to :', error)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
    }
}


exports.getAllAccounts = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
    try{
    Members.find().exec()
    .then((data)=>{
        res.json(data)
    })
    .catch((error)=>{
        console.log('Fetching all the accounts error due to :', error)
        res.status(404).json({error:'No any accounts were found'})
        statusDisplay = 404
        errorMessage = 'No any accounts were found'
    })
    }
    catch(error){
        console.log('Fetching all the accounts error due to :', error)
        res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
    }
}


//Token Authentication
exports.TokenAuthenticaiton = jwt({
    secret:process.env.JWT_SECRET_KEY,
    algorithms:["HS256"],
    userProperty:"auth"
})




