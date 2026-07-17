import express from 'express';
import { Protect } from '../middlewares/auth.js';
import  upload  from '../configs/multer.js';

import {addPostComment, createPost, getPostComments, getPosts, likePost, likePostComment} from '../controllers/postController.js';

const postRouter = express.Router();

postRouter.post('/add', Protect, upload.array('images', 5), createPost);
postRouter.get('/feed', Protect, getPosts);
postRouter.post('/like', Protect, likePost);
postRouter.get('/:postId/comments', Protect, getPostComments);
postRouter.post('/:postId/comments', Protect, addPostComment);
postRouter.post('/comments/:commentId/like', Protect, likePostComment);

export default postRouter;
