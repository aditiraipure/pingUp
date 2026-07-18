import imagekit from "../configs/imageKit.js";
import Post from '../models/Post.js';             
import User from '../models/User.js';      
import fs from "fs";
import Comment from "../models/Comment.js";
import PostReport from "../models/PostReport.js";


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
        const posts = await Post.find({
          user: {$in:userIds},
          is_archived: {$ne: true},
          _id: {$nin: user.hidden_posts || []},
        }).populate('user').sort({createdAt: -1});
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
        const post = await Post.findOne({ _id: postId, is_archived: { $ne: true } });
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

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

const findOwnedPost = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) return { status: 404, message: "Post not found" };
  if (post.user !== userId) return { status: 403, message: "Only the post owner can perform this action" };
  return { post };
};

export const updatePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const owned = await findOwnedPost(req.params.postId, userId);
    if (!owned.post) return res.status(owned.status).json({ success: false, message: owned.message });

    const allowed = ["content", "tags", "location", "hide_like_count", "hide_share_count", "commenting_disabled"];
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) owned.post[key] = req.body[key];
    }
    if (Array.isArray(req.body.tags)) {
      owned.post.tags = req.body.tags.map((tag) => String(tag).trim().replace(/^#/, "")).filter(Boolean);
    }
    await owned.post.save();
    await owned.post.populate("user");
    res.json({ success: true, message: "Post updated", post: owned.post });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const archivePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const owned = await findOwnedPost(req.params.postId, userId);
    if (!owned.post) return res.status(owned.status).json({ success: false, message: owned.message });
    owned.post.is_archived = true;
    await owned.post.save();
    res.json({ success: true, message: "Post archived" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const restorePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const owned = await findOwnedPost(req.params.postId, userId);
    if (!owned.post) return res.status(owned.status).json({ success: false, message: owned.message });
    owned.post.is_archived = false;
    await owned.post.save();
    await owned.post.populate("user");
    res.json({ success: true, message: "Post restored", post: owned.post });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getArchivedPosts = async (req, res) => {
  try {
    const { userId } = req.auth();
    const posts = await Post.find({ user: userId, is_archived: true }).populate("user").sort({ createdAt: -1 });
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const owned = await findOwnedPost(req.params.postId, userId);
    if (!owned.post) return res.status(owned.status).json({ success: false, message: owned.message });
    await Promise.all([
      Comment.deleteMany({ post: owned.post._id }),
      PostReport.deleteMany({ post: owned.post._id }),
      User.updateMany({ hidden_posts: owned.post._id }, { $pull: { hidden_posts: owned.post._id } }),
      owned.post.deleteOne(),
    ]);
    res.json({ success: true, message: "Post deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const sharePost = async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { _id: req.params.postId, is_archived: { $ne: true } },
      { $inc: { share_count: 1 } },
      { new: true },
    );
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    res.json({ success: true, share_count: post.share_count });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const markPostNotInterested = async (req, res) => {
  try {
    const { userId } = req.auth();
    const post = await Post.findOne({ _id: req.params.postId, is_archived: { $ne: true } }).select("user");
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (post.user === userId) return res.status(403).json({ success: false, message: "You cannot hide your own post this way" });
    await User.updateOne({ _id: userId }, { $addToSet: { hidden_posts: post._id } });
    res.json({ success: true, message: "Thanks for your feedback." });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const reportPost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const reason = req.body.reason?.trim();
    const details = req.body.details?.trim() || "";
    const post = await Post.findOne({ _id: req.params.postId, is_archived: { $ne: true } }).select("user");
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (post.user === userId) return res.status(403).json({ success: false, message: "You cannot report your own post" });
    const report = await PostReport.create({ post: post._id, reporter: userId, reason, details });
    res.status(201).json({ success: true, reportId: report._id, message: "Thanks for your report. We'll review this content." });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: "You have already reported this post." });
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getPostComments = async (req, res) => {
  try {
    const { userId } = req.auth();
    const post = await Post.findById(req.params.postId).select("user is_archived");
    if (!post || (post.is_archived && post.user !== userId)) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
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
    const post = await Post.findOne({ _id: req.params.postId, is_archived: { $ne: true } });
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    if (post.commenting_disabled) {
      return res.status(403).json({ success: false, message: "Comments have been turned off by the post owner." });
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
