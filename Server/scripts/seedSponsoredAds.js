import dotenv from "dotenv";
import mongoose from "mongoose";
import SponsoredAd from "../models/SponsoredAd.js";

dotenv.config();

const ads = [
  { brand_name: "Nova Workspace", caption: "Build your best ideas with tools designed for focused, creative work.", image_url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=85", destination: "https://www.notion.so/product", priority: 70 },
  { brand_name: "Pulse Fitness", caption: "Personal training plans that move at your pace and fit your goals.", image_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=85", destination: "https://www.nike.com/fitness", priority: 60 },
  { brand_name: "Horizon Travel", caption: "Discover remarkable places and turn your next break into a story.", image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85", destination: "https://www.booking.com/", priority: 50 },
  { brand_name: "The Good Table", caption: "Fresh ingredients, thoughtful recipes, and memorable meals delivered.", image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=85", destination: "https://www.hellofresh.com/", priority: 40 },
  { brand_name: "MarketFlow", caption: "Grow your business with simple analytics and smarter campaigns.", image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=85", destination: "https://www.hubspot.com/products/marketing", priority: 30 },
  { brand_name: "Form Studio", caption: "Modern essentials created for everyday comfort and confident style.", image_url: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=85", destination: "https://www.zara.com/", priority: 20 },
  { brand_name: "SwiftPay", caption: "Fast, secure payments that keep your business moving forward.", image_url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=85", destination: "https://stripe.com/payments", priority: 10 },
].map((ad) => ({ ...ad, is_active: true, starts_at: null, ends_at: null }));

try {
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all(ads.map((ad) => SponsoredAd.findOneAndUpdate(
    { brand_name: ad.brand_name },
    { $set: ad },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )));
  console.log(`Seeded ${ads.length} sponsored ads.`);
} finally {
  await mongoose.disconnect();
}
