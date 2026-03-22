import express  from 'express';
import {getUser, updateUser, discoverUsers, followUser, unfollowUser,sendConnectionRequest,acceptConnectionRequest,getConnections} from '../controllers/UserController.js';
import { Protect } from '../middlewares/auth.js';
import  upload  from '../configs/multer.js';


const userRouter = express.Router();

userRouter.get('/data',Protect, getUser);
userRouter.post('/update',upload.fields([{name: 'profile', maxCount: 1}, {name: 'cover', maxCount: 1}]),Protect, updateUser);
userRouter.post('/discover',Protect, discoverUsers);
userRouter.post('/follow', Protect, followUser);
userRouter.post('/unfollow',Protect, unfollowUser);
userRouter.post('/connect', Protect,sendConnectionRequest);
userRouter.post('/accept', Protect, acceptConnectionRequest);
userRouter.get('/connections', Protect, getConnections);

export default userRouter;