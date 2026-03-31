import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    from_user_id: { type: String, ref: "User", required: true },
    to_user_id: { type: String, ref: "User", required: true },
    message: { type: String, trim: true },
    message_type: { type: String, enum: ["text", "image", "video"] },
    media_url: { type: String },
    is_seen: { type: Boolean, default: false }, 
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;