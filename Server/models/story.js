import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
    user : {type:String,ref:'User',required:true},
    content : {type: String},
    media_url :{type:String},
    media_file_id: {type:String},
    media_type :{type:String,enum:['text','image','video']},
    view_count:[{type:String,ref:'User'}],
    background_color:{type:String},
    expiresAt: {type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), index: { expires: 0 }},
},{timestamps:true,minimize:false});

const Story = mongoose.model('Story',storySchema);

export default Story;
