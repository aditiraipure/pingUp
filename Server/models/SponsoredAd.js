import mongoose from "mongoose";

const sponsoredAdSchema = new mongoose.Schema(
  {
    brand_name: { type: String, required: true, trim: true, maxlength: 100 },
    caption: { type: String, required: true, trim: true, maxlength: 240 },
    image_url: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    is_active: { type: Boolean, default: true, index: true },
    starts_at: { type: Date, default: null },
    ends_at: { type: Date, default: null },
    priority: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("SponsoredAd", sponsoredAdSchema);
