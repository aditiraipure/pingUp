import User from "../models/User.js";
import fs from 'fs';
import imagekit from "../configs/imageKit.js";
import Post from "../models/Post.js";
import { inngest } from "../inngest/index.js";
import Connection from "../models/Connections.js";
import { ensureUser } from "../services/ensureUser.js";
import FollowRequest from "../models/FollowRequest.js";
import { sendRealtimeEvent } from "./messageController.js";

export const getUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = req.dbUser || await ensureUser(userId);
    const pendingFollowRequests = await FollowRequest.find({
      from_user_id: userId,
      status: "pending",
    }).select("to_user_id");

   res.json({
  success: true,
  user: {
    ...user._doc,
    imageUrl: user.profile_picture,
    pending_following: pendingFollowRequests.map((request) => request.to_user_id),
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
    const { input, scope } = req.body;
    const escapedInput = String(input || "")
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!escapedInput) {
      return res.json({ success: true, users: [] });
    }
    const searchPattern = new RegExp(escapedInput, "i");
    const searchFields = scope === "messages"
      ? [{ username: searchPattern }, { full_name: searchPattern }]
      : [
          { username: searchPattern },
          { email: searchPattern },
          { full_name: searchPattern },
          { location: searchPattern },
        ];

    const query = User.find({ $or: searchFields });
    if (scope === "messages") query.limit(20);
    const allUsers = await query;
     
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

    if (!id || id === userId) {
      return res.status(400).json({ success: false, message: "Invalid user" });
    }

    const [user, toUser] = await Promise.all([
      User.findById(userId),
      ensureUser(id),
    ]);

    if (!user || !toUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.following.includes(id)) {
      return res.json({
        success: true,
        status: "accepted",
        message: "Already following this user",
      });
    }

    const existingRequest = await FollowRequest.findOne({
      from_user_id: userId,
      to_user_id: id,
    });

    if (existingRequest?.status === "pending") {
      return res.json({
        success: true,
        status: "pending",
        message: "Follow request already pending",
      });
    }

    const request = await FollowRequest.findOneAndUpdate(
      { from_user_id: userId, to_user_id: id },
      {
        $set: {
          status: "pending",
          recipient_read_at: null,
          sender_read_at: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    inngest.send({
      name: "app/follow-request",
      data: { followRequestId: request._id.toString() },
    }).catch((error) => {
      console.error("Follow request notification failed:", {
        followRequestId: request._id,
        message: error.message,
      });
    });

    sendRealtimeEvent(id, "follow_request", {
      requestId: request._id,
      fromUser: {
        _id: user._id,
        full_name: user.full_name,
        username: user.username,
        profile_picture: user.profile_picture,
      },
      requestedAt: request.createdAt,
    });

    res.json({
      success: true,
      status: "pending",
      message: "Follow request sent",
    });

  } catch (error) {
    console.error("Error creating follow request:", error);
    res.status(500).json({ success: false, message: "Unable to send follow request" });
  }
};

// unfollow user
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    if (!id || id === userId) {
      return res.status(400).json({ success: false, message: "Invalid user" });
    }

    const acceptedFollowRequest = await FollowRequest.findOne({
      from_user_id: userId,
      to_user_id: id,
      status: "accepted",
    });

    const updates = [
      User.findByIdAndUpdate(userId, { $pull: { following: id } }),
      User.findByIdAndUpdate(id, { $pull: { followers: userId } }),
      FollowRequest.findOneAndUpdate(
        { from_user_id: userId, to_user_id: id, status: "accepted" },
        {
          $set: {
            status: "declined",
            recipient_read_at: new Date(),
            sender_read_at: new Date(),
          },
        },
      ),
    ];

    if (acceptedFollowRequest) {
      updates.push(
        User.findByIdAndUpdate(userId, { $pull: { connections: id } }),
        User.findByIdAndUpdate(id, { $pull: { connections: userId } }),
        Connection.deleteMany({
          status: "accepted",
          $or: [
            { from_user_id: userId, to_user_id: id },
            { from_user_id: id, to_user_id: userId },
          ],
        }),
      );
    }

    await Promise.all(updates);

    sendRealtimeEvent(id, "follow_relationship_removed", {
      userId,
      connectionRemoved: Boolean(acceptedFollowRequest),
    });

    res.json({
      success: true,
      connectionRemoved: Boolean(acceptedFollowRequest),
      message: "User unfollowed successfully",
    });

  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({ success: false, message: "Unable to unfollow user" });
  }
};

export const removeFollower = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    if (!id || id === userId) {
      return res.status(400).json({ success: false, message: "Invalid user" });
    }

    const acceptedFollowRequest = await FollowRequest.findOne({
      from_user_id: id,
      to_user_id: userId,
      status: "accepted",
    });

    const updates = [
      User.findByIdAndUpdate(userId, { $pull: { followers: id } }),
      User.findByIdAndUpdate(id, { $pull: { following: userId } }),
      FollowRequest.findOneAndUpdate(
        { from_user_id: id, to_user_id: userId, status: "accepted" },
        {
          $set: {
            status: "declined",
            recipient_read_at: new Date(),
            sender_read_at: new Date(),
          },
        },
      ),
    ];

    if (acceptedFollowRequest) {
      updates.push(
        User.findByIdAndUpdate(userId, { $pull: { connections: id } }),
        User.findByIdAndUpdate(id, { $pull: { connections: userId } }),
        Connection.deleteMany({
          status: "accepted",
          $or: [
            { from_user_id: userId, to_user_id: id },
            { from_user_id: id, to_user_id: userId },
          ],
        }),
      );
    }

    await Promise.all(updates);

    sendRealtimeEvent(id, "follow_relationship_removed", {
      userId,
      connectionRemoved: Boolean(acceptedFollowRequest),
    });

    res.json({
      success: true,
      connectionRemoved: Boolean(acceptedFollowRequest),
      message: "Follower removed successfully.",
    });
  } catch (error) {
    console.error("Error removing follower:", error);
    res.status(500).json({ success: false, message: "Unable to remove follower" });
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
    const currentUser = await User.findById(userId).populate("followers following connections");
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

    const acceptedConnectionUsers = await User.find({
      _id: { $in: connectionIds },
    });
    const connectionsById = new Map();
    [...(currentUser?.connections || []), ...acceptedConnectionUsers].forEach((user) => {
      if (user?._id) connectionsById.set(user._id.toString(), user);
    });
    const connections = [...connectionsById.values()];

    const followers = currentUser?.followers || [];
    const following = currentUser?.following || [];

    const pendingConnections = await Connection.find({
      to_user_id: userId,
      status: "pending",
    }).populate("from_user_id");

    const pendingFollowRequests = await FollowRequest.find({
      to_user_id: userId,
      status: "pending",
    })
      .populate("from_user_id")
      .sort({ createdAt: -1 });

    const [pendingUnread, connectionUnread] = await Promise.all([
      FollowRequest.countDocuments({
        to_user_id: userId,
        status: "pending",
        recipient_read_at: null,
      }),
      FollowRequest.countDocuments({
        from_user_id: userId,
        status: "accepted",
        sender_read_at: null,
      }),
    ]);

    res.json({
      success: true,
      connections,
      followers,
      following,
      pendingConnections: pendingConnections.map(
        (c) => c.from_user_id
      ),
      pendingFollowRequests: pendingFollowRequests
        .filter((request) => request.from_user_id)
        .map((request) => ({
          _id: request._id,
          requester: request.from_user_id,
          status: request.status,
          requestedAt: request.createdAt,
        })),
      notificationCounts: {
        pending: pendingUnread,
        connections: connectionUnread,
      },
    });

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error fetching user data" });
  }
};

export const getFollowRequests = async (req, res) => {
  try {
    const { userId } = req.auth();
    const requests = await FollowRequest.find({
      to_user_id: userId,
      status: "pending",
    })
      .populate("from_user_id")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests: requests
        .filter((request) => request.from_user_id)
        .map((request) => ({
          _id: request._id,
          requester: request.from_user_id,
          status: request.status,
          requestedAt: request.createdAt,
        })),
    });
  } catch (error) {
    console.error("Error fetching follow requests:", error);
    res.status(500).json({ success: false, message: "Unable to load follow requests" });
  }
};

export const getFollowNotificationCounts = async (req, res) => {
  try {
    const { userId } = req.auth();
    const [pending, connections] = await Promise.all([
      FollowRequest.countDocuments({
        to_user_id: userId,
        status: "pending",
        recipient_read_at: null,
      }),
      FollowRequest.countDocuments({
        from_user_id: userId,
        status: "accepted",
        sender_read_at: null,
      }),
    ]);

    res.json({ success: true, counts: { pending, connections } });
  } catch (error) {
    console.error("Error fetching follow notification counts:", error);
    res.status(500).json({ success: false, message: "Unable to load notifications" });
  }
};

export const markFollowNotificationsRead = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { section } = req.body;
    const now = new Date();

    if (section === "pending") {
      await FollowRequest.updateMany(
        { to_user_id: userId, status: "pending", recipient_read_at: null },
        { $set: { recipient_read_at: now } },
      );
    } else if (section === "connections") {
      await FollowRequest.updateMany(
        { from_user_id: userId, status: "accepted", sender_read_at: null },
        { $set: { sender_read_at: now } },
      );
    } else {
      return res.status(400).json({ success: false, message: "Invalid notification section" });
    }

    res.json({ success: true, message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error marking follow notifications read:", error);
    res.status(500).json({ success: false, message: "Unable to update notifications" });
  }
};

export const acceptFollowRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { requestId } = req.body;

    const request = await FollowRequest.findOne({
      _id: requestId,
      to_user_id: userId,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({ success: false, message: "Follow request not found" });
    }

    let connection = await Connection.findOne({
      $or: [
        { from_user_id: request.from_user_id, to_user_id: userId },
        { from_user_id: userId, to_user_id: request.from_user_id },
      ],
    });

    if (connection) {
      connection.status = "accepted";
      await connection.save();
    } else {
      connection = await Connection.create({
        from_user_id: request.from_user_id,
        to_user_id: userId,
        status: "accepted",
      });
    }

    await Promise.all([
      User.findByIdAndUpdate(request.from_user_id, {
        $addToSet: { following: userId, connections: userId },
      }),
      User.findByIdAndUpdate(userId, {
        $addToSet: {
          followers: request.from_user_id,
          connections: request.from_user_id,
        },
      }),
    ]);

    request.status = "accepted";
    request.recipient_read_at = new Date();
    request.sender_read_at = null;
    await request.save();

    sendRealtimeEvent(request.from_user_id, "follow_request_updated", {
      userId,
      status: "accepted",
    });

    res.json({
      success: true,
      status: "accepted",
      message: "Follow request accepted",
    });
  } catch (error) {
    console.error("Error accepting follow request:", error);
    res.status(500).json({ success: false, message: "Unable to accept follow request" });
  }
};

export const declineFollowRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { requestId } = req.body;

    const request = await FollowRequest.findOneAndUpdate(
      { _id: requestId, to_user_id: userId, status: "pending" },
      {
        $set: {
          status: "declined",
          recipient_read_at: new Date(),
          sender_read_at: new Date(),
        },
      },
      { new: true },
    );

    if (!request) {
      return res.status(404).json({ success: false, message: "Follow request not found" });
    }

    sendRealtimeEvent(request.from_user_id, "follow_request_updated", {
      userId,
      status: "declined",
    });

    res.json({
      success: true,
      status: "declined",
      message: "Follow request declined",
    });
  } catch (error) {
    console.error("Error declining follow request:", error);
    res.status(500).json({ success: false, message: "Unable to decline follow request" });
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

    const [posts, likedPosts, followRequest] = await Promise.all([
      Post.find({ user: resolvedProfileId, ...visiblePostFilter }).populate('user').sort({ createdAt: -1 }),
      Post.find({ likes_count: resolvedProfileId, ...visiblePostFilter }).populate('user').sort({ createdAt: -1 }),
      resolvedProfileId === userId
        ? null
        : FollowRequest.findOne({
            from_user_id: userId,
            to_user_id: resolvedProfileId,
          }).select("status"),
    ]);

    const followStatus = viewer.following.includes(resolvedProfileId)
      ? "accepted"
      : followRequest?.status === "pending"
        ? "pending"
        : "none";

    res.json({success:true,profile,posts,likedPosts,followStatus});
    console.log("Profile:", profile);

  } catch (error) {
    console.log(error);
    res.json({success:false,message:error.message});
  }
};
// create post
