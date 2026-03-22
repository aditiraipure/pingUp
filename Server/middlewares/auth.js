export const Protect = (req, res, next) => {
  try {
    const { userId } = req.auth(); // ✅ no await

    if (!userId) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    next();
  } catch (error) {
    return res.json({ success: false, message: "Unauthorized" });
  }
};