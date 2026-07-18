import { ensureUser } from "../services/ensureUser.js";

export const Protect = async (req, res, next) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" }); 
    }

    req.dbUser = await ensureUser(userId);
    next();
  } catch (error) {
    console.error("Authenticated user initialization failed:", error);
    return res.status(503).json({ success: false, message: "Unable to initialize user profile" });
  }
};
