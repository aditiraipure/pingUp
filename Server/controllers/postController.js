import imagekit from "../configs/imageKit.js";
import Post from '../models/Post.js';             
import User from '../models/User.js';      
import fs from "fs";
import Comment from "../models/Comment.js";


// create post
export const createPost = async (req,res) => {
    try {
        const {userId} = req.auth();
        const {content,post_type} = req.body;

        const images = req.files
        let image_urls = [];
        if(images.length){
            image_urls = await Promise.all(images.map(async (image) => {
                const fileBuffer = fs.readFileSync(image.path);

                const response = await imagekit.upload({
        file: fileBuffer,
        fileName: image.originalname,
        folder: "posts"
      });

      const url = imagekit.url({
        path: response.filePath,
        transformation: [{
          quality: 'auto',
          format: 'webp',
          width: "1280",
        }]
      });
      return url;
            }));
        }

        await Post.create({
            user:userId,
            content,
            image_urls,
            post_type
        });

        res.json({success:true,message:'Post created successfully'});
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message});
        
        
    }
}

// get posts of user and his connections
export const getPosts = async (req,res) => {
    try {
        const {userId} = req.auth();
        const user = await User.findById(userId);

        const userIds = [userId,...user.connections,...user.following];
        const posts = await Post.find({user:{$in:userIds}}).populate('user').sort({createdAt: -1});
        res.json({success:true,posts});


    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message});
    }
}

// export const createPost = async (req, res) => {
//   try {
//     const { userId } = req.auth();
//     const { content, post_type } = req.body;

//     const images = req.files || []; 
//     let image_urls = [];

//     if (images.length > 0) {
//       image_urls = await Promise.all(
//         images.map(async (image) => {
//           const fileBuffer = fs.readFileSync(image.path);

//           const response = await imagekit.upload({
//             file: fileBuffer,
//             fileName: image.originalname,
//             folder: "posts",
//           });

//           const url = imagekit.url({
//             path: response.filePath,
//             transformation: [
//               {
//                 quality: "auto",
//                 format: "webp",
//                 width: "1280",
//               },
//             ],
//           });

//           return url;
//         })
//       );
//     }

//     await Post.create({
//       user: userId,
//       content,
//       image_urls, 
//       post_type,
//     });

//     res.json({ success: true, message: "Post created successfully" });

//   } catch (error) {
//     console.log(error);
//     res.json({ success: false, message: error.message });
//   }
// };

// // get posts of user and his connections
// export const getPosts = async (req, res) => {
//   try {
//     const { userId } = req.auth();

//     const user = await User.findById(userId);

//     const userIds = [userId, ...user.connections, ...user.following];

//     const posts = await Post.find({ user: { $in: userIds } })
//   .populate({
//     path: "user",
//     select: "full_name username profile_picture"
//   })
//   .sort({ createdAt: -1 });

// // FIX: support old + new field
// const updatedPosts = posts.map(post => ({
//   ...post._doc,
//   image_urls: post.image_urls?.length
//     ? post.image_urls
//     : post.image_url || []
// }));

// res.json({ success: true, posts: updatedPosts });
//   }
// };


// like or unlike post
export const likePost = async (req,res) => {
    try {
        const {userId} = req.auth();
        const {postId} = req.body;
        const post = await Post.findById(postId);

        if(post.likes_count.includes(userId)){
            post.likes_count = post.likes_count.filter(user => user!== userId);
            await post.save();
            return res.json({success:true,message:'Post unliked'});
        }
        else{
            post.likes_count.push(userId);
            await post.save();
            return res.json({success:true,message:'Post liked'});
        }
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message});
    }
}

export const getPostComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate("user")
      .sort({ createdAt: 1 });
    res.json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addPostComment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const content = req.body.content?.trim();
    if (!content) return res.status(400).json({ success: false, message: "Comment is required" });
    if (!(await Post.exists({ _id: req.params.postId }))) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    const created = await Comment.create({ post: req.params.postId, user: userId, content });
    const comment = await Comment.findById(created._id).populate("user");
    res.status(201).json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const likePostComment = async (req, res) => {
  try {
    const { userId } = req.auth();
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    const isLiked = comment.likes.includes(userId);
    comment.likes = isLiked
      ? comment.likes.filter((id) => id !== userId)
      : [...comment.likes, userId];
    await comment.save();

    res.json({ success: true, liked: !isLiked, likes: comment.likes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
