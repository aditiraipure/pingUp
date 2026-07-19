import imagekit from "../configs/imageKit.js";
import Message from "../models/message.js";
import path from "path";

const connections = {};
const allowedAttachmentExtensions = new Set([
  ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif", ".bmp",
  ".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v",
  ".mp3", ".wav", ".aac", ".ogg", ".m4a", ".flac",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".ppt", ".pptx", ".txt",
  ".zip", ".rar", ".7z", ".json", ".xml",
  ".js", ".ts", ".jsx", ".tsx", ".html", ".css", ".java", ".c", ".cpp", ".h", ".hpp", ".py", ".php", ".rb", ".go", ".rs", ".sql", ".md", ".yml", ".yaml"
]);

const broadcast = (userId, event) => {
  const clients = connections[userId]?.connections || [];
  clients.forEach((client) => client.write(`data: ${JSON.stringify(event)}\n\n`));
  return clients.length > 0;
};

export const sendRealtimeEvent = (userId, type, payload) =>
  broadcast(userId, { type, payload });

export const sseController = (req, res) => {
  const { userId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // FIX: ensure object structure exists
  if (!connections[userId]) {
    connections[userId] = { connections: [] };
  }

  // FIX: push instead of overwrite
  connections[userId].connections.push(res);

  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
  const heartbeat = setInterval(() => res.write(`: heartbeat\n\n`), 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    if (connections[userId]) {
      connections[userId].connections =
        connections[userId].connections.filter((r) => r !== res);

      if (connections[userId].connections.length === 0) {
        delete connections[userId];
      }
    }
  });
};
// send message
export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id, message, shared_post_id, shared_story_id } = req.body;
    const attachment = Array.isArray(req.files)
      ? req.files[0]
      : req.files?.file?.[0] || req.files?.image?.[0] || req.files?.attachment?.[0] || req.files?.media?.[0];

    if (!to_user_id || (!message?.trim() && !attachment && !shared_post_id && !shared_story_id)) {
      return res.status(400).json({ success: false, message: "Recipient and message content are required" });
    }
    if (attachment && attachment.size > 25 * 1024 * 1024) {
      return res.status(413).json({ success: false, message: "Attachments must be 25 MB or smaller" });
    }
    if (attachment && !allowedAttachmentExtensions.has(path.extname(attachment.originalname).toLowerCase())) {
      return res.status(415).json({ success: false, message: "This file type is not supported" });
    }

    let media_url = "";
    let message_type = "text";
    let media_name = "";
    let media_mime_type = "";
    let media_size = 0;
    if (attachment) {
      const safeFileName = attachment.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const response = await imagekit.upload({
        file: attachment.buffer.toString("base64"),
        fileName: safeFileName,
        useUniqueFileName: true,
      });
      if (!response?.url) {
        return res.status(502).json({ success: false, message: "Attachment storage did not return a file URL" });
      }
      media_url = response.url;
      media_name = attachment.originalname;
      media_mime_type = attachment.mimetype;
      media_size = attachment.size;
      message_type = attachment.mimetype.startsWith("image/") ? "image" : attachment.mimetype.startsWith("video/") ? "video" : attachment.mimetype.startsWith("audio/") ? "audio" : "file";
    }

    const messageData = await Message.create({
      from_user_id: userId,
      to_user_id,
      message: message?.trim() || "",
      message_type,
      media_url,
      media_name,
      media_mime_type,
      media_size,
      shared_post: shared_post_id || null,
      shared_story: shared_story_id || null,
    });

    const messageWithUserData = await Message.findById(
      messageData._id
    ).populate("from_user_id")
      .populate({ path: "shared_post", populate: { path: "user" } })
      .populate({ path: "shared_story", populate: { path: "user" } });

    if (broadcast(to_user_id, { type: "message", payload: messageWithUserData })) {
      messageWithUserData.delivery_status = "delivered";
      await Message.findByIdAndUpdate(messageData._id, { delivery_status: "delivered" });
    }
    res.json({ success: true, message: messageWithUserData });
  } catch (error) {
    console.error("Send message attachment error:", {
      message: error.message,
      name: error.name,
      status: error.status,
      details: error.response?.data,
    });
    res.status(500).json({ success: false, message: error.message });
  }
};
// get chat messages
export const getChatMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id } = req.body;

    const messages = await Message.find({
      $or: [
        { from_user_id: userId, to_user_id },
        { from_user_id: to_user_id, to_user_id: userId },
      ],
    }).sort({ createdAt: 1 })
      .populate({ path: "shared_post", populate: { path: "user" } })
      .populate({ path: "shared_story", populate: { path: "user" } });

    const unseenMessages = await Message.find({
        from_user_id: to_user_id,
        to_user_id: userId,
        is_seen: false, 
    }).select("_id");
    const seenIds = unseenMessages.map((item) => item._id);
    if (seenIds.length) {
      await Message.updateMany({ _id: { $in: seenIds } }, { is_seen: true, delivery_status: "seen" });
      broadcast(to_user_id, { type: "seen", payload: { messageIds: seenIds, seenBy: userId } });
      const seenIdSet = new Set(seenIds.map((id) => id.toString()));
      messages.forEach((message) => {
        if (seenIdSet.has(message._id.toString())) {
          message.is_seen = true;
          message.delivery_status = "seen";
        }
      });
    }

    res.json({ success: true, messages });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getUnreadMessageCounts = async (req, res) => {
  try {
    const { userId } = req.auth();
    const grouped = await Message.aggregate([
      { $match: { to_user_id: userId, is_seen: false } },
      { $group: { _id: "$from_user_id", count: { $sum: 1 } } },
    ]);

    const byUser = Object.fromEntries(
      grouped.map((item) => [item._id, item.count]),
    );
    const total = grouped.reduce((sum, item) => sum + item.count, 0);

    res.json({ success: true, total, byUser });
  } catch (error) {
    console.error("Error fetching unread message counts:", error);
    res.status(500).json({ success: false, message: "Unable to load unread messages" });
  }
};

export const markChatMessagesRead = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { other_user_id } = req.body;
    if (!other_user_id) {
      return res.status(400).json({ success: false, message: "Chat user is required" });
    }

    const unseenMessages = await Message.find({
      from_user_id: other_user_id,
      to_user_id: userId,
      is_seen: false,
    }).select("_id");
    const messageIds = unseenMessages.map((message) => message._id);

    if (messageIds.length) {
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $set: { is_seen: true, delivery_status: "seen" } },
      );
      broadcast(other_user_id, {
        type: "seen",
        payload: { messageIds, seenBy: userId },
      });
    }

    res.json({ success: true, messageIds });
  } catch (error) {
    console.error("Error marking chat messages read:", error);
    res.status(500).json({ success: false, message: "Unable to mark messages as read" });
  }
};

// recent chats
export const getUserRecentChats = async (req, res) => {
  try {
    const { userId } = req.auth();

    const messages = await Message.find({
      $or: [
        { from_user_id: userId },
        { to_user_id: userId },
      ],
    })
      .sort({ createdAt: -1 })
      .populate("from_user_id to_user_id")
      .lean();

    const seenParticipants = new Set();
    const recentChats = messages.filter((message) => {
      const fromUserId = message.from_user_id?._id || message.from_user_id;
      const toUserId = message.to_user_id?._id || message.to_user_id;
      const participantId = String(fromUserId) === userId ? toUserId : fromUserId;
      if (!participantId || seenParticipants.has(String(participantId))) return false;
      seenParticipants.add(String(participantId));
      return true;
    });

    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.json({ success: true, messages: recentChats }); 
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const sendTypingStatus = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id, is_typing } = req.body;
    if (!to_user_id) return res.status(400).json({ success: false, message: "Recipient is required" });
    broadcast(to_user_id, { type: "typing", payload: { from_user_id: userId, is_typing: Boolean(is_typing) } });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
