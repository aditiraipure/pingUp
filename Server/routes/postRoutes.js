import express from 'express';
import { Protect } from '../middlewares/auth.js';
import  upload  from '../configs/multer.js';

import {addPostComment, archivePost, createPost, deletePost, getArchivedPosts, getPostComments, getPosts, likePost, likePostComment, markPostNotInterested, reportPost, restorePost, sharePost, updatePost} from '../controllers/postController.js';

const postRouter = express.Router();

postRouter.post('/add', Protect, upload.array('images', 5), createPost);
postRouter.get('/feed', Protect, getPosts);
postRouter.get('/archive', Protect, getArchivedPosts);
postRouter.post('/like', Protect, likePost);
postRouter.post('/:postId/share', Protect, sharePost);
postRouter.post('/:postId/not-interested', Protect, markPostNotInterested);
postRouter.post('/:postId/report', Protect, reportPost);
postRouter.patch('/:postId', Protect, updatePost);
postRouter.patch('/:postId/archive', Protect, archivePost);
postRouter.patch('/:postId/restore', Protect, restorePost);
postRouter.delete('/:postId', Protect, deletePost);
postRouter.get('/:postId/comments', Protect, getPostComments);
postRouter.post('/:postId/comments', Protect, addPostComment);
postRouter.post('/comments/:commentId/like', Protect, likePostComment);

export default postRouter;
