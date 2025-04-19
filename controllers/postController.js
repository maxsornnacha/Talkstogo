const Posts = require('../models/post')
const cloudinary = require('cloudinary')
const { v4: uuidv4 } = require('uuid');

cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
    api_key:process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.COULDINARY_API_SECRET 
  });


//สร้างโพสต์
exports.createPost = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const postID = uuidv4()
    const {content,firstname,lastname,accountImage,currentDate,currentTime,id , account_id} = req.body
    let public_id = ''
    let image = req.body.image
    let video = req.body.video

    if(!video){
        video = null;
    }
    if(!image){
        image = null;
    }
    
    //Upload image to cloud storage
    if(image){
        await cloudinary.v2.uploader.upload(image,
            { public_id: `${uuidv4()}-${Date.now()}`,
              folder:'talkstogo/post-images'
            })
            .then((result)=>{
                image=result
                public_id=result.public_id
            })
            .catch((err)=>{
                res.status(404).json({error:"Image upload failed :",err})
                console.log(err)
                image = null;
                statusDisplay = 404
                errorMessage = 'Image upload failed'
            })
    }
    if(content.length === 0 && !image && !video){
        res.status(400).json('The post uploading was failed because the conditions were not met')
        statusDisplay = 400
        errorMessage = 'The post uploading was failed because the conditions were not met'
        image = null;
        video = null;
    }else{
    //Uploading on Posts
    await Posts.create({account_id,accountID:id,postID,content,firstname,lastname,accountImage,currentDate,currentTime,image,video,
        comments:[],likes:[]
    })
    .then(async (data)=>{
        res.json(data)
    })
    .catch((error)=>{
        console.log('Uploading a post error due to :', error)
        res.status(400).json('The post uploading was failed because the conditions were not met')
        statusDisplay = 400
        errorMessage = 'The post uploading was failed because the conditions were not met'

         // Delete the image
        if(req.body.image){
         cloudinary.uploader.destroy(public_id)
         .then((result)=>console.log('Image deleted successfully :', result))
         .catch((error)=> console.error('Image deleted successfully :', error))
        }
    })
    }   

}
catch(error){
    console.log('Uploading a post error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})

       // Delete the image
       if(req.body.image){
        cloudinary.uploader.destroy(public_id)
        .then((result)=>console.log('Image deleted successfully :', result))
        .catch((error)=> console.error('Image deleted successfully :', error))
       }
}
}

//Displaying all the posts
exports.displayPost = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;
    

     // Fetch posts with pagination and sort by creation date in descending order
    const posts = await Posts.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec();
     res.json(posts);


}
catch(error){
    console.log('Fetching all the posts error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}
}

//Like
exports.likeSystemIncrease = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    const {like,accountID,postID} = req.body

    const isLiked = await Posts.find({
        "postID": postID , 
        "likes.accountID":accountID
    }).exec()
   
    if(isLiked.length === 0) {
    Posts.findOneAndUpdate(
        { postID: postID },
        { $push: { likes: { accountID:accountID, like:like } } },
        { new: true }
    ).exec()
    .then((data)=>{
        res.json(data)
    })
    .catch((error)=>{
        console.log('Like processing error due to:', error)
        res.json({error:error})
    })
    }else{
        res.status(400).json({error:'You have already liked this post'})
        statusDisplay = 400
        errorMessage = 'You have already liked this post'
        console.log('You have already liked this post')
    }

}
catch(error){
    console.log('Like processing error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}
}

//Unlike
exports.likeSystemDecrease = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    const {like,accountID,postID} = req.body

    //Unlike on the post
    Posts.findOneAndUpdate(
        { postID: postID },
        { $pull: { likes: { accountID:accountID, like:like } } },
        { new: true }
    ).exec()
    .then((data)=>{
        res.json(data)
    })
    .catch((error)=>{
        console.log('Unlike process error due to :', error)
        res.json({error:error})
    })

}
catch(error){
    console.log('Unlike process error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}
}

//a single post fetching 
exports.singlePost = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{

    Posts.findOne({postID:req.params.id}).exec()
    .then((data)=>{
        res.json(data)})
    .catch((error)=>{
        console.log('Fetching single post error due to :', error)
        res.status(404).json({error:'No post was found'})
        statusDisplay = 404
        errorMessage = 'No post was found'
    })

}
catch(error){
    console.log('Fetching single post error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}
}

//Fetching all the posts of one account (normally used for the profile page's post displaying )
exports.displayPostForProfile = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;


    const posts = await Posts.find({accountID:req.params.id}).sort({ createdAt: -1 }).skip(skip).limit(limit).exec();
     res.json(posts);

}
catch(error){
    console.log('Fetching all the posts of one account error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}
}

//Uploading a comment
exports.createComment = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const { currentDate,currentTime,accountImage,firstname,lastname,accountID,postID,commentInput} = req.body
    let public_id = ''
    let image = req.body.commentImage
    const commentID = uuidv4()

     //Upload image to cloud storage
     if(image){
        await cloudinary.v2.uploader.upload(image,
            { public_id:`${uuidv4()}-${Date.now()}`,
              folder:'talkstogo/post-images/comment-images'
            })
            .then((result)=>{
                image=result
                public_id=result.public_id
            })
            .catch((err)=>{
                res.status(404).json({error:"Uploading failed, please try again"})
                console.log(err)
                statusDisplay = 404
                errorMessage = 'Uploading image failed'
            })
    }

    Posts.findOneAndUpdate(
        { postID: postID },
        { $push: { comments: {commentID,accountID,accountImage,firstname,lastname,commentInput,commentImage:image,currentTime,currentDate,replies:[]} } },
        { new: true }
    ).exec()
    .then((data)=>{ 
        res.json(data)
    })
    .catch((error)=>{
        console.log('Uploading a comment error due to :', error)
        res.status(400).json({error:'Failed comment upload because it does not meet the required conditions'})
        statusDisplay = 400
        errorMessage = 'Failed comment upload because it does not meet the required conditions'

         // Delete the image
         cloudinary.uploader.destroy(public_id)
         .then((result)=>console.log('Image deleted successfully :', result))
         .catch((error)=> console.error('Image deleted successfully :', error))
    })

}
catch(error){
    console.log('Uploading a comment error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})

    // Delete the image
    cloudinary.uploader.destroy(public_id)
    .then((result)=>console.log('Image deleted successfully :', result))
    .catch((error)=> console.error('Image deleted unsuccessfully :', error))
}
}

//Uploading a reply
exports.createReply = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const { currentDate,currentTime,accountImage,firstname,lastname,accountID,commentID,replyInput} = req.body
    let public_id = ''
    let image = req.body.replyImage
    const replyID = uuidv4()

     //Upload image to cloud storage
     if(image){
        await cloudinary.v2.uploader.upload(req.body.replyImage,
            {public_id:`${uuidv4()}-${Date.now()}`,
             folder:'talkstogo/post-images/reply-images'
            })
            .then((result)=>{
                image=result
                public_id=result.public_id
            })
            .catch((err)=>{
                res.status(404).json({error:"Uploading failed, please try again"})
                console.log(err)
                statusDisplay = 404;
                errorMessage = 'Uploading image failed';
            })
    }

   Posts.findOneAndUpdate(
        {"comments.commentID":commentID},
        { $push: { "comments.$.replies": {replyID,currentDate,currentTime,accountImage,firstname,lastname,accountID,replyInput,replyImage:image} } },
        { new: true }
    ).exec()
    .then(async (data)=>{    
        res.json(data)          
    })
    .catch((error)=>{
        console.log('Uploading reply error due to :', error)
        res.status(404).json('Not found the comment that is replying')
        statusDisplay = 404
        errorMessage = 'Not found the comment that is replying'

         // Delete the image
         cloudinary.uploader.destroy(public_id)
         .then((result)=>console.log('Image deleted successfully :', result))
         .catch((error)=> console.error('Image deleted unsuccessfully :', error))
    })

}
catch(error){
    console.log('Uploading reply error due to :', error)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})

    // Delete the image
    cloudinary.uploader.destroy(public_id)
    .then((result)=>console.log('Image deleted successfully :', result))
    .catch((error)=> console.error('Image deleted unsuccessfully :', error))
}
}


exports.deletePost = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const postID = req.body.postID;
    const postImage = req.body.postImage;
    const commentImages = req.body.commentImages;
    const replyImages = req.body.replyImages;

    Posts.findByIdAndDelete(postID)
    .then((data)=>{

        // Delete the image
        if(postImage){
        cloudinary.uploader.destroy(postImage.public_id)
        .then((result)=>console.log('Image deleted successfully :', result))
        .catch((error)=> console.error('Image deleted unsuccessfully :', error))
        }

        if(commentImages && commentImages.length > 0){
            commentImages.forEach(commentImage => {
                cloudinary.uploader.destroy(commentImage.public_id)
            });
        }

        if(replyImages && replyImages.length > 0){
            replyImages.forEach(replyImage => {
                cloudinary.uploader.destroy(replyImage.public_id)
            });
        }

        res.json(data);
    })
    .catch((error)=>{
        res.status(404).json({error: error.message});
        statusDisplay = 404
        errorMessage = error.message
    })
}
catch(error){
    console.log('The post was deleted unsuccessfully because :', error.message)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})
}
}

exports.editPost = async (req,res)=>{
    let statusDisplay = ''
    let errorMessage = ''
try{
    const {postID , content , video } = req.body;
    let prevImage = req.body.prevImage;
    let image = req.body.image;
    let public_id = '';

    //upload Image on cloud storage
    if(image && image.length > 100){
        await cloudinary.v2.uploader.upload(req.body.image,
            { public_id: `${uuidv4()}-${Date.now()}`,
              folder:'talkstogo/post-images'
            })
            .then((result)=>{
                
                if(prevImage){
                // Delete the previous image
                cloudinary.uploader.destroy(prevImage.public_id)
                }

                image=result
                public_id=result.public_id
            })
            .catch((error)=>{
                statusDisplay = 400
                errorMessage = error.message
                res.status(400).json({error:error.message})
                console.log(error)
            })
    }


    Posts.findByIdAndUpdate(postID,{
        $set :{content : content, image : image , video:video}
    },{
        new:true
    })
    .then((data)=>{
        res.json(data);
    })
    .catch((error)=>{
        res.status(404).json({error:error.message})
        statusDisplay = 404
        errorMessage = error.message

        // Delete the image
        cloudinary.uploader.destroy(public_id)
        .then((result)=>console.log('Image deleted successfully:', result))
        .catch((error)=> console.error('Error deleting image:', error))
    })
}

catch(error){
    console.log('The post was edited unsuccessfully because :', error.message)
    res.status(statusDisplay?statusDisplay:500).json({error:errorMessage?errorMessage:error.message})

    // Delete the image
    cloudinary.uploader.destroy(public_id)
    .then((result)=>console.log('Image deleted successfully:', result))
    .catch((error)=> console.error('Error deleting image:', error))
}
}
