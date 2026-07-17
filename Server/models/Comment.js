import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    user: { type: String, ref: "User", required: true },
    content: { type: String, trim: true, required: true, maxlength: 1000 },
    likes: [{ type: String, ref: "User" }],
  },
  { timestamps: true },
);

export default mongoose.model("Comment", commentSchema);
