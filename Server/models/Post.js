
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    user : {type:String,ref:'User',required:true},
    content : {type: String},
    image_urls :[{type:String}],
    post_type :{type:String,enum:['text','image','text_with_image'],required:true},
   likes_count:[{type:String}],
   share_count: { type: Number, default: 0, min: 0 },
   is_archived: { type: Boolean, default: false, index: true },
   hide_like_count: { type: Boolean, default: false },
   hide_share_count: { type: Boolean, default: false },
   commenting_disabled: { type: Boolean, default: false },
   tags: [{ type: String, trim: true }],
   location: { type: String, trim: true, maxlength: 120 }
},{timestamps:true,minimize:false});

const Post = mongoose.model('Post',postSchema);

export default Post;
