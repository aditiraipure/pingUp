import imagekit from "../configs/imageKit.js";
import Message from "../models/message.js";
import fs from "fs";

const connections = {};

export const sseController = (req, res) => {
  const { userId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  connections[userId] = res;
  res.write(`data: "connected"\n\n`); 

  req.on("close", () => {
    delete connections[userId];
  });
};

// send message
export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id, message, message_type } = req.body;
    const image = req.file;

    let media_url = "";
    if ((message_type === "image" || image) && image) {
      const fileBuffer = fs.readFileSync(image.path);
      const response = await imagekit.upload({
        file: fileBuffer,
        fileName: image.originalname,
      });

      media_url = imagekit.url({
        path: response.filePath,
        transformation: [
          {
            quality: "auto",
            format: "webp",
            width: "1280",
          },
        ],
      });
    }

    const messageData = await Message.create({
      from_user_id: userId,
      to_user_id,
      message,
      message_type,
      media_url,
    });

    const messageWithUserData = await Message.findById(
      messageData._id
    ).populate("from_user_id");

    res.json({ success: true, message: messageWithUserData });

    if (connections[to_user_id]) {
      connections[to_user_id].write(
        `data: ${JSON.stringify(messageWithUserData)}\n\n`
      );
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
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
    }).sort({ createdAt: 1 });

    await Message.updateMany(
      {
        from_user_id: to_user_id,
        to_user_id: userId,
        is_seen: false, 
      },
      { is_seen: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// recent chats
export const getUserRecentChats = async (req, res) => {
  try {
    const { userId } = req.auth();

    const recentChats = await Message.find({
      to_user_id: userId,
    })
      .sort({ createdAt: -1 })
      .populate("from_user_id to_user_id");

    res.json({ success: true, messages: recentChats }); 
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};