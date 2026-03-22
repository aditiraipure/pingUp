import User from '../models/User.js';
import fs from 'fs';
import imagekit from "../configs/imageKit.js";

export const getUser = async (req, res) => {
  try {
    const authData = req.auth();
    console.log("Auth Data:", authData); // 👈 ये देखना है

    const { userId } = authData;
    console.log("User ID:", userId); // 👈 ये भी

    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });

  } catch (error) {
    console.error('Error:', error);
    res.json({ success: false, message: 'Error fetching user data' });
  }
};

// update user details
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    let { username, bio, location, full_name } = req.body;

    const tempUser = await User.findOne({ _id: userId }); // ✅ FIX

    !username && (username = tempUser.username);

    if (tempUser.username !== username) {
      const user = await User.findOne({ username }); // ✅ FIX (await added)
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

    const profile = req.files?.profile && req.files.profile[0]; // ✅ safe access
    const cover = req.files?.cover && req.files.cover[0];       // ✅ safe access

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
  console.error("FULL ERROR:", error); // 👈 important
  res.json({ success: false, message: error.message }); // 👈 real error दिखाओ
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

    if(user.following.includes(id)){
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
export const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

   const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
   const connectionRequest = await Connection.findOne({
    from_user_id: userId,
    to_user_id: id,
    createdAt: { $gte: last24Hours }
   });

    if(connectionRequest && connectionRequest.length >=15){
      return res.json({success:false,message:'You have already sent 15 connection requests to this user in the last 24 hours'});
    }
    const connection = await connection.findOne({
      $or:[
        {from_user_id: userId, to_user_id: id},
        {from_user_id: id, to_user_id: userId}
      ],
      
     });

     if(!connection){await Connection.create({
      from_user_id: userId,
      to_user_id: id,
     })
     return res.json({success:true,message:'Connection request sent successfully'});  

    }
    else if(connection && connection.status === 'accepted'){
      return res.json({success:false,message:'You are already connected with this user'});
    }
    return res.json({success:false,message:'Connection request pending'});

  } catch (error) {
    console.error('Error fetching user data:', error);
    res.json({ success: false, message: 'Error fetching user data' });
  }
}

// get user connections
export const getConnections = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId).populate('connections followers following');

    const connections = user.connections
    const followers = user.followers
    const following = user.following

    const pendingConnections = await Connection.find({
      to_user_id: userId,
      status: 'pending'
    }).populate('from_user_id').map(connection => connection.from_user_id);

    res.json({ success: true, connections, followers, following, pendingConnections });


  } catch (error) {
    console.error('Error fetching user data:', error);
    res.json({ success: false, message: 'Error fetching user data' });
  }
}

// accept connection request
export const acceptConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const connection = await Connection.findOne({
      from_user_id: id,to_user_id: userId });

    if(!connection){
      return res.json({success:false,message:'connection request not found'});
    }
    const user = await User.findById(userId);
    user.connections.push(id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.connections.push(userId);
    await toUser.save();

    connection.status = 'accepted';
    await connection.save();

    res.json({success:true,message:'Connectio accepted successfully'});

  } catch (error) {
    console.error('Error fetching user data:', error);
    res.json({ success: false, message: 'Error fetching user data' });
  }
}