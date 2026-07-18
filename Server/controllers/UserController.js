import User from "../models/User.js";
import fs from 'fs';
import imagekit from "../configs/imageKit.js";
import Post from "../models/Post.js";
import { inngest } from "../inngest/index.js";
import Connection from "../models/Connections.js";
import { ensureUser } from "../services/ensureUser.js";

export const getUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = req.dbUser || await ensureUser(userId);

   res.json({
  success: true,
  user: {
    ...user._doc,
    imageUrl: user.profile_picture
  }
});

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error fetching user data' });
  }
};

// update user details
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    let { username, bio, location, full_name } = req.body;

    const tempUser = await User.findOne({ _id: userId });

    !username && (username = tempUser.username);

    if (tempUser.username !== username) {
      const user = await User.findOne({ username }); 
      if (user) {
        username = tempUser.username;
      }
    }

    const updatedData = {
      username,
      bio,
      location,
      full_name
    };

    const profile = req.files?.profile && req.files.profile[0]; 
    const cover = req.files?.cover && req.files.cover[0];       

    if (profile) {
      const buffer = fs.readFileSync(profile.path);
      const response = await imagekit.upload({
        file: buffer,
        fileName: profile.originalname
      });

      const url = imagekit.url({
        path: response.filePath,
        transformation: [{
          quality: 'auto',
          format: 'webp',
          width: "512",
        }]
      });

      updatedData.profile_picture = url;
    }

    if (cover) {
      const buffer = fs.readFileSync(cover.path);
      const response = await imagekit.upload({
        file: buffer,
        fileName: cover.originalname
      });

      const url = imagekit.url({
        path: response.filePath,
        transformation: [{
          quality: 'auto',
          format: 'webp',
          width: "1280",
        }]
      });

      updatedData.cover_photo = url;
    }

    const user = await User.findByIdAndUpdate(userId, updatedData, { new: true });

    res.json({ success: true, user, message: 'profile updated successfully' });

  } catch (error) {
    console.error("FULL ERROR:", error);
    res.json({ success: false, message: error.message }); 
  }
};

// find user by username
export const discoverUsers = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { input } = req.body;

    const allUsers = await User.find({
      $or: [
        {username: new RegExp(input, 'i')},
        {email: new RegExp(input, 'i')},
        {full_name: new RegExp(input, 'i')},
        {location: new RegExp(input, 'i')},
      ]
    });
     
    const filteredUsers = allUsers.filter(user => user._id !== userId);
    res.json({ success: true, users: filteredUsers });

  } catch (error) {
    console.error('Error fetching user data:', error);
    res.json({ success: false, message: 'Error fetching user data' });
  }
};

// follow user
export const followUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const user = await User.findById(userId);

    if (user.following.includes(id)) {
      return res.json({success:false,message:'Already following this user'});
    }
    
    user.following.push(id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.followers.push(userId);
    await toUser.save();

    res.json({success:true,message:'User followed successfully'});

  } catch (error) {
    console.error('Error fetching user data:', error);
    res.json({ success: false, message: 'Error fetching user data' });
  }
};

// unfollow user
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const user = await User.findById(userId);
    user.following = user.following.filter(user => user !== id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.followers = toUser.followers.filter(user => user !== userId);
    await toUser.save();

    res.json({success:true,message:'User unfollowed successfully'});

  } catch (error) {
    console.error('Error fetching user data:', error);
    res.json({ success: false, message: 'Error fetching user data' });
  }
};

// send connection request  
// 
export const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const user = await User.findById(userId);
    const toUser = await User.findById(id);

    if (
      !user.following.includes(id) ||
      !toUser.following.includes(userId)
    ) {
      return res.json({
        success: false,
        message: "Both users must follow each other first",
      });
    }

    const existing = await Connection.findOne({
      $or: [
        { from_user_id: userId, to_user_id: id },
        { from_user_id: id, to_user_id: userId },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") {
        return res.json({ success: false, message: "Already connected" });
      }
      return res.json({ success: false, message: "Request pending" });
    }

    const newConnection = await Connection.create({
      from_user_id: userId,
      to_user_id: id,
      status: "pending",
    });

    await inngest.send({
      name: "app/connection-request",
      data: { connectionId: newConnection._id },
    });

    res.json({ success: true, message: "Request sent" });

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

// get user connections
// export const getConnections = async (req, res) => {
//   try {
//     const { userId } = req.auth();
//     const user = await User.findById(userId).populate('connections followers following');

//     const connections = user.connections;
//     const followers = user.followers;
//     const following = user.following;

//     const pendingConnections = (await Connection.find({
//       to_user_id: userId,
//       status: 'pending'
//     }).populate('from_user_id')).map(connection => connection.from_user_id);

//     res.json({ success: true, connections, followers, following, pendingConnections });

//   } catch (error) {
//     console.error('Error fetching user data:', error);
//     res.json({ success: false, message: 'Error fetching user data' });
//   }
// };

// get user connections
export const getConnections = async (req, res) => {
  try {
    const { userId } = req.auth();
    const acceptedConnections = await Connection.find({
      status: "accepted",
      $or: [
        { from_user_id: userId },
        { to_user_id: userId },
      ],
    });

    const connectionIds = acceptedConnections.map((conn) =>
      conn.from_user_id === userId
        ? conn.to_user_id
        : conn.from_user_id
    );

    const connections = await User.find({
      _id: { $in: connectionIds },
    });

    const followers = await User.find({
      followers: userId,
    });

    const following = await User.find({
      following: userId,
    });

    const pendingConnections = await Connection.find({
      to_user_id: userId,
      status: "pending",
    }).populate("from_user_id");

    res.json({
      success: true,
      connections,
      followers,
      following,
      pendingConnections: pendingConnections.map(
        (c) => c.from_user_id
      ),
    });

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error fetching user data" });
  }
};
// accept connection request
// export const acceptConnectionRequest = async (req, res) => {
//   try {
//     const { userId } = req.auth();
//     const { id } = req.body;

//     const connection = await Connection.findOne({
//       from_user_id: id,
//       to_user_id: userId
//     });

//     if (!connection) {
//       return res.json({success:false,message:'connection request not found'});
//     }

//     const user = await User.findById(userId);
//     user.connections.push(id);
//     await user.save();

//     const toUser = await User.findById(id);
//     toUser.connections.push(userId);
//     await toUser.save();

//     connection.status = 'accepted';
//     await connection.save();

//     res.json({success:true,message:'Connectio accepted successfully'});

//   } catch (error) {
//     console.error('Error fetching user data:', error);
//     res.json({ success: false, message: 'Error fetching user data' });
//   }
// };

// accept connection request
export const acceptConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const connection = await Connection.findOne({
      from_user_id: id,
      to_user_id: userId,
      status: "pending",
    });

    if (!connection) {
      return res.json({ success: false, message: "Request not found" });
    }

    connection.status = "accepted";
    await connection.save();
    const user = await User.findById(userId);
    const otherUser = await User.findById(id);

    if (!user.following.includes(id)) {
      user.following.push(id);
    }

    if (!otherUser.following.includes(userId)) {
      otherUser.following.push(userId);
    }

    if (!user.followers.includes(id)) {
      user.followers.push(id);
    }

    if (!otherUser.followers.includes(userId)) {
      otherUser.followers.push(userId);
    }

    await user.save();
    await otherUser.save();

    res.json({ success: true, message: "Connection accepted" });

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

// get userprofiles
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { profileId } = req.body;
    const resolvedProfileId = profileId || userId;
    const profile = resolvedProfileId === userId
      ? (req.dbUser || await ensureUser(userId))
      : await User.findById(resolvedProfileId);
    const viewer = (req.dbUser || await ensureUser(userId));
    const visiblePostFilter = { is_archived: { $ne: true }, _id: { $nin: viewer?.hidden_posts || [] } };

    if (!profile) {
      return res.json({success:false,message:'User not found'});
    }

    const [posts, likedPosts] = await Promise.all([
      Post.find({ user: resolvedProfileId, ...visiblePostFilter }).populate('user').sort({ createdAt: -1 }),
      Post.find({ likes_count: resolvedProfileId, ...visiblePostFilter }).populate('user').sort({ createdAt: -1 }),
    ]);

    res.json({success:true,profile,posts,likedPosts});
    console.log("Profile:", profile);

  } catch (error) {
    console.log(error);
    res.json({success:false,message:error.message});
  }
};
// create post
