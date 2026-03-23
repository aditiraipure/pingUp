import express from 'express';
import { sseController , sendMessage, getChatMessages } from '../controllers/messageController.js';
import upload from '../configs/multer.js';
import { Protect } from '../middlewares/auth.js';

const messageRouter = express.Router();

messageRouter.get('/:userId', sseController);
messageRouter.post('/send', upload.single('image'), Protect, sendMessage);
messageRouter.post('/get', Protect, getChatMessages);

export default messageRouter;