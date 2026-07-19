import express from "express";
import {
  sseController,
  sendMessage,
  getChatMessages,
  getUserRecentChats,
  getUnreadMessageCounts,
  markChatMessagesRead,
  sendTypingStatus,
} from "../controllers/messageController.js";
import { handleMessageUpload } from "../configs/messageUpload.js";
import { Protect } from "../middlewares/auth.js";

const messageRouter = express.Router();

messageRouter.get("/recent", Protect, getUserRecentChats); 
messageRouter.get("/unread", Protect, getUnreadMessageCounts);
messageRouter.post("/read", Protect, markChatMessagesRead);
messageRouter.get("/events/:userId", sseController);
messageRouter.post("/send", Protect, handleMessageUpload, sendMessage);
messageRouter.post("/get", Protect, getChatMessages);
messageRouter.post("/typing", Protect, sendTypingStatus);
messageRouter.get("/:userId", sseController);

export default messageRouter;
