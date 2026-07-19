import { Inngest } from "inngest";
import User from "../models/User.js";
import Connection from "../models/Connections.js";
import sendEmail  from "../configs/nodeMailer.js";
import Story from "../models/story.js";
import Message from "../models/message.js";
import dotenv from "dotenv";
import imagekit from "../configs/imageKit.js";
import FollowRequest from "../models/FollowRequest.js";

dotenv.config();
// Create a client to send and receive events
export const inngest = new Inngest({
  id: "pingUp-app",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url, has_image } = event.data;

    let username = email_addresses?.[0]?.email_address.split("@")[0];

    const user = await User.findOne({ username });
    if (user) {
      username = username + Math.floor(Math.random() * 1000);
    }

    const userData = {
      _id: id,
      email: email_addresses?.[0]?.email_address,
      full_name: [first_name, last_name].filter(Boolean).join(" ") || username,
      username,
      profile_picture: has_image ? image_url : "",
    };

    await User.findOneAndUpdate(
      { _id: id },
      { $setOnInsert: userData },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
);

const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url, has_image } = event.data;

    const updatedUserData = {
      email: email_addresses?.[0]?.email_address,
      full_name: [first_name, last_name].filter(Boolean).join(" ") || email_addresses?.[0]?.email_address.split("@")[0],
    };

    const existingUser = await User.findById(id);
    if (!existingUser) {
      await User.findOneAndUpdate(
        { _id: id },
        { $setOnInsert: {
          ...updatedUserData,
          username: email_addresses?.[0]?.email_address.split("@")[0],
          profile_picture: has_image ? image_url : "",
        } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    } else {
      if (!existingUser.profile_picture && has_image && image_url) updatedUserData.profile_picture = image_url;
      await User.findByIdAndUpdate(id, updatedUserData);
    }
  }
);

const syncUserDeletion =  inngest.createFunction(
    {id:'delete-user-with-clerk'},
    {event:'clerk/user.deleted'},
    async ({ event }) => {
        const {id} = event.data;
        await User.findByIdAndDelete(id);
        }
);

const sendReminderEmail = inngest.createFunction(
    {id:'send-reminder-email'},
    {event:'app/connection-request'},
    async ({ event ,step}) => {
        const {connectionId} = event.data;
        await step.run("send-reminder-email", async()=>{
            const connection = await Connection.findById(connectionId).populate('to_user_id');

            const subject = `New connection request!`;
            const body = `<div style="font-family: Arial, sans-serif; padding: 20px; ">
            <h2>Hi ${connection.to_user_id.full_name},</h2>
            <p>You have a new connection request on PingUp! from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
            <p>Click <a href=${process.env.FRONTEND_URL}/connections" style ="color:#10b981">here</a> to view the request.</p>
            <br/>
            <p>Thanks,<br/>The PingUp Team - Stay Connected</p>
        </div>`;

        await sendEmail({
            to: connection.to_user_id.email,
            subject,
            body
        });
    })

    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait-for-24-hours", in24Hours);

    await step.run("send-reminder-email", async()=>{
        const connection = await Connection.findById(connectionId).populate('from_user_id to_user_id');

        if(connection.status === 'accepted'){
            return {message:'Already accepted'};
        }

        const subject = `New connection request!`;
        const body = `<div style="font-family: Arial, sans-serif; padding: 20px; ">
            <h2>Hi ${connection.to_user_id.full_name},</h2>
            <p>You have a new connection request on PingUp! from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
            <p>Click <a href=${process.env.FRONTEND_URL}/connections" style ="color:#10b981">here</a> to view the request.</p>
            <br/>
            <p>Thanks,<br/>The PingUp Team - Stay Connected</p>
        </div>`;

        await sendEmail({
            to: connection.to_user_id.email,
            subject,
            body
        });

        return {message:'Reminder email sent successfully'};
        
     })
 }
);

const sendFollowRequestNotification = inngest.createFunction(
  { id: "send-follow-request-notification" },
  { event: "app/follow-request" },
  async ({ event, step }) => {
    const { followRequestId } = event.data;

    return step.run("send-follow-request-notification", async () => {
      const request = await FollowRequest.findById(followRequestId)
        .populate("from_user_id to_user_id");

      if (!request || request.status !== "pending" || !request.from_user_id || !request.to_user_id) {
        return { message: "Follow request is no longer pending" };
      }

      const recipient = request.to_user_id;
      const requester = request.from_user_id;
      const body = `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Hi ${recipient.full_name},</h2>
        <p>${requester.full_name} (@${requester.username}) requested to follow you on PingUp.</p>
        <p>Open <a href="${process.env.FRONTEND_URL}/follow-requests" style="color:#6366f1">Follow Requests</a> to accept or decline.</p>
        <br/>
        <p>Thanks,<br/>The PingUp Team - Stay Connected</p>
      </div>`;

      await sendEmail({
        to: recipient.email,
        subject: "New follow request on PingUp",
        body,
      });

      return { message: "Follow request notification sent" };
    });
  },
);

// inngest functions to delete stories after 24 hours
const deleteStory = inngest.createFunction(
    {id:'delete-story='},
    {event:'app/story-delete'},
    async ({ event ,step}) => {
        const {storyId} = event.data;
        const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await step.sleepUntil("wait-for-24-hours", in24Hours);
        console.log("EVENT KEY:", process.env.INNGEST_EVENT_KEY);

        await step.run("delete-story", async()=>{
            const story = await Story.findById(storyId);
            if (story?.media_file_id) {
                await imagekit.deleteFile(story.media_file_id);
            }
            await Story.findByIdAndDelete(storyId);
            return {message:'Story deleted '};
        });
    }
);

// get notification 
const getNotification = inngest.createFunction(
    {id:'get-notifications'},
   {cron:"TZ=Asia/Kolkata 0 9 * * *"},
    async ({step}) => {
        const message = await Message.find({seen : false}).populate('to_user_id');

        const unseenCount = {};

        for (const msg of message) {
           const userId = msg.to_user_id && msg.to_user_id._id ? msg.to_user_id._id : msg.to_user_id;
            if (!userId) continue;

            unseenCount[userId] = (unseenCount[userId] || 0) + 1;
        }

       for(const userId in unseenCount ){
    const user = await User.findById(userId);

    if (!user) continue;  

    const subject = `You have ${unseenCount[userId]} unread messages!`;
    const body = `<div style="font-family: Arial, sans-serif; padding: 20px; ">
        <h2>Hi ${user.full_name},</h2>
        <p>You have ${unseenCount[userId]} unread messages on PingUp!</p>
        <p>Click <a href=${process.env.FRONTEND_URL}/messages" style ="color:#10b981">here</a> to view your messages.</p>
        <br/>
        <p>Thanks,<br/>The PingUp Team - Stay Connected</p>
    </div>`;

    await sendEmail({
        to: user.email,
        subject,
        body
    });
}
        return {message:'Notification sent '};
    }
);

export const functions = [
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion,
    sendReminderEmail,
    sendFollowRequestNotification,
    deleteStory,
    getNotification
];
