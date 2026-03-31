import express from "express";
import {
  sseController,
  sendMessage,
  getChatMessages,
  getUserRecentChats,
} from "../controllers/messageController.js";
import upload from "../configs/multer.js";
import { Protect } from "../middlewares/auth.js";

const messageRouter = express.Router();

messageRouter.get("/:userId", sseController);
messageRouter.post("/send", upload.single("image"), Protect, sendMessage);
messageRouter.post("/get", Protect, getChatMessages);
messageRouter.get("/recent", Protect, getUserRecentChats); 

export default messageRouter;