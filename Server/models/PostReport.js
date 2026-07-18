import mongoose from "mongoose";

const postReportSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    reporter: { type: String, ref: "User", required: true, index: true },
    reason: {
      type: String,
      required: true,
      enum: ["Spam", "Nudity or Sexual Content", "Violence", "Hate Speech", "Harassment or Bullying", "False Information", "Scam or Fraud", "Intellectual Property Violation", "Other"],
    },
    details: { type: String, trim: true, maxlength: 1000, default: "" },
    status: { type: String, enum: ["pending", "reviewed"], default: "pending" },
  },
  { timestamps: true },
);

postReportSchema.index({ post: 1, reporter: 1 }, { unique: true });

export default mongoose.model("PostReport", postReportSchema);
