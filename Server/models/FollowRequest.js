import mongoose from "mongoose";

const followRequestSchema = new mongoose.Schema(
  {
    from_user_id: { type: String, ref: "User", required: true },
    to_user_id: { type: String, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    recipient_read_at: { type: Date, default: null },
    sender_read_at: { type: Date, default: null },
  },
  { timestamps: true },
);

followRequestSchema.index(
  { from_user_id: 1, to_user_id: 1 },
  { unique: true },
);

const FollowRequest = mongoose.model("FollowRequest", followRequestSchema);

export default FollowRequest;
