import imagekit from "../configs/imagekit.js";
import Message from "../models/message.js";
import fs from "fs";

const connections = {}

export const sseController = (req, res) => {
    const {userId} = req.params;
    console.log("new client connected");
    
    res.setHeader('Content-Type','text/event-stream')
    res.setHeader('Cache-Control','no-cache')
    res.setHeader('Connection','keep-alive')
    res.setHeader('Access-Control-Allow-Origin','*')

    connections[userId] = res;
    res.write(`data: connected\n\n`);
    req.on('close',()=>{
        console.log('client disconnected');
        delete connections[userId];
    })
}

// send message to client
export const sendMessage = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {to_user_id, message, message_type} = req.body;
        const image = req.file;

        let media_url = '';

        if (message_type === 'image' && image) {
            const fileBuffer = fs.readFileSync(image.path);
            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: image.originalname
            });
            media_url = imagekit.url({
                path: response.filePath,
                transformation: [{
                    quality: 'auto',
                    format: 'webp',
                    width: "1280",
                }]
            });
        }

        const messageData =  await Message.create({
            from_user_id: userId,
            to_user_id,
            message,
            message_type,
            media_url
        });

        res.json({success:true,message: messageData});

        const messageWithUserData = await Message.findById(messageData._id).populate('from_user_id');

        if(connections[to_user_id]){
            connections[to_user_id].write(`data: ${JSON.stringify(messageWithUserData)}\n\n`);
        }
        
    }catch (error) {
        console.log(error);
        res.json({success:false,message:error.message});
    }
}   

// get chat message 
export const getChatMessages = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {to_user_id} = req.body;

        const messages = await Message.find({
            $or:[
                {from_user_id:userId,to_user_id},
                {from_user_id:to_user_id,to_user_id:userId}
            ]
        }).sort({createdAt:1});
        
        // mark msg as seen 
        await Message.updateMany({
            from_user_id:to_user_id,
            to_user_id:userId,
            is_seen: false
        }, { is_seen: true });

        res.json({success:true,messages});

    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message});
    }
}

export const getUserRecentChats = async (req, res) => {
    try {
        const {userId} = req.auth();

        const recentChats = await Message.find({to_user_id: userId
        }).sort({createdAt: -1}).populate('from_user_id to_user_id');

        res.json({success:true,recentChats});
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message});
    }
}