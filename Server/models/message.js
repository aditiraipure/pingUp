import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    from_user_id: { type: String, ref: "User", required: true },
    to_user_id: { type: String, ref: "User", required: true },
    message: { type: String, trim: true },
    message_type: { type: String, enum: ["text", "image", "video", "audio", "file"], default: "text" },
    media_url: { type: String },
    media_name: { type: String },
    media_mime_type: { type: String },
    media_size: { type: Number, default: 0 },
    delivery_status: { type: String, enum: ["sent", "delivered", "seen"], default: "sent" },
    is_seen: { type: Boolean, default: false }, 
    shared_post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
    shared_story: { type: mongoose.Schema.Types.ObjectId, ref: "Story", default: null },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
