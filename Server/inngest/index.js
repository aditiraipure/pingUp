import { Inngest } from "inngest";
import User from "../models/User.js";
import Connection from "../models/Connections.js";
import { sendEmail } from "../configs/nodeMailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "pingUp-app",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
const syncUserCreation =  inngest.createFunction(
    {id:'sync-user-from-clerk'},
    {event:'clerk/user.created'},
    async ({ event }) => {
        const {id, first_name, last_name, email_address,image_url} = event.data;
        let username = email_address[0].email_address.split('@')[0]

        const user = await User.findOne({username});
        if(user){
            username = username + Math.floor(Math.random() * 1000);
        }
            const userData = {
                _id:id,
                email:email_address[0].email_address,   
                full_name:first_name + ' ' + last_name,
                username,
                profile_picture:image_url
            };
            await User.create(userData);
        }
    
);

const syncUserUpdation =  inngest.createFunction(
    {id:'update-user-from-clerk'},
    {event:'clerk/user.updated'},
    async ({ event }) => {
        const {id, first_name, last_name, email_address,image_url} = event.data;
        const updatedUserData = {
            email:email_address[0].email_address,   
            full_name:first_name + ' ' + last_name,
            profile_picture:image_url   
        };
        await User.findByIdAndUpdate(id,updatedUserData);
        
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
        
     }
  )
 }
);


export const functions = [
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion,
    sendReminderEmail
];