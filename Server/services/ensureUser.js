import { clerkClient } from "@clerk/express";
import User from "../models/User.js";

const normalizeUsername = (value) => {
  const normalized = String(value || "pingup-user")
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .replace(/^[._]+|[._]+$/g, "");
  return normalized || "pingup-user";
};

const availableUsername = async (base, userId) => {
  const normalized = normalizeUsername(base);
  const existing = await User.findOne({ username: normalized }).select("_id");
  if (!existing || existing._id === userId) return normalized;

  const suffix = userId.replace(/^user_/, "").slice(-6).toLowerCase();
  return `${normalized}-${suffix}`;
};

export const ensureUser = async (userId) => {
  const existing = await User.findById(userId);
  if (existing) return existing;

  const clerkUser = await clerkClient.users.getUser(userId);
  const primaryEmail = clerkUser.emailAddresses.find(
    (email) => email.id === clerkUser.primaryEmailAddressId,
  )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim();
  const username = await availableUsername(clerkUser.username || primaryEmail?.split("@")[0], userId);

  try {
    return await User.findOneAndUpdate(
      { _id: userId },
      {
        $setOnInsert: {
          email: primaryEmail || `${userId}@users.pingup.local`,
          full_name: name || username,
          username,
          profile_picture: clerkUser.hasImage ? clerkUser.imageUrl : "",
          bio: "Hey there! i am using pingUp",
          location: "",
          cover_photo: "",
          followers: [],
          following: [],
          connections: [],
          hidden_posts: [],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    if (error?.code === 11000) {
      const retryUsername = `${username}-${Date.now().toString(36).slice(-4)}`;
      return User.findOneAndUpdate(
        { _id: userId },
        { $setOnInsert: {
          email: primaryEmail || `${userId}@users.pingup.local`,
          full_name: name || retryUsername,
          username: retryUsername,
          profile_picture: clerkUser.hasImage ? clerkUser.imageUrl : "",
        } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }
    throw error;
  }
};
