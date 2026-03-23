import express from 'express';
import { Protect } from '../middlewares/auth.js';
import  upload  from '../configs/multer.js';

import {createPost , getPosts,likePost} from '../controllers/postController.js';

const postRouter = express.Router();

postRouter.post('/add', Protect, upload.array('images', 5), createPost);
postRouter.get('/feed', Protect, getPosts);
postRouter.post('/like', Protect, likePost);

export default postRouter;