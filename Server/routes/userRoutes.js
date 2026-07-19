import express  from 'express';
import {acceptFollowRequest, declineFollowRequest, getFollowNotificationCounts, getFollowRequests, getUser, markFollowNotificationsRead, removeFollower, updateUser, discoverUsers, followUser, unfollowUser,sendConnectionRequest,acceptConnectionRequest,getConnections, getUserProfile} from '../controllers/UserController.js';
import { Protect } from '../middlewares/auth.js';
import  upload  from '../configs/multer.js';
import { getUserRecentChats } from '../controllers/messageController.js';


const userRouter = express.Router();

userRouter.get('/data',Protect, getUser);
userRouter.post('/update',upload.fields([{name: 'profile', maxCount: 1}, {name: 'cover', maxCount: 1}]),Protect, updateUser);
userRouter.post('/discover',Protect, discoverUsers);
userRouter.post('/follow', Protect, followUser);
userRouter.post('/unfollow',Protect, unfollowUser);
userRouter.post('/remove-follower', Protect, removeFollower);
userRouter.post('/connect', Protect,sendConnectionRequest);
userRouter.post('/accept', Protect, acceptConnectionRequest);
userRouter.get('/connections', Protect, getConnections);
userRouter.get('/follow-requests', Protect, getFollowRequests);
userRouter.get('/follow-notifications', Protect, getFollowNotificationCounts);
userRouter.post('/follow-notifications/read', Protect, markFollowNotificationsRead);
userRouter.post('/follow-request/accept', Protect, acceptFollowRequest);
userRouter.post('/follow-request/decline', Protect, declineFollowRequest);
userRouter.post('/profile',Protect,getUserProfile)
userRouter.get('/recent-messages',Protect,getUserRecentChats);

export default userRouter;
