export const Protect = (req, res, next) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" }); 
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Unauthorized" }); 
  }
};