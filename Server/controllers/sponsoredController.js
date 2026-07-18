import SponsoredAd from "../models/SponsoredAd.js";

export const getSponsoredAds = async (_req, res) => {
  try {
    const now = new Date();
    const ads = await SponsoredAd.find({
      is_active: true,
      $and: [
        { $or: [{ starts_at: null }, { starts_at: { $lte: now } }] },
        { $or: [{ ends_at: null }, { ends_at: { $gte: now } }] },
      ],
    })
      .select("brand_name caption image_url destination")
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    res.json({ success: true, ads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
