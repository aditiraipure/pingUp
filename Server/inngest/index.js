import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "my-app" });

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

const syncUserdeletion =  inngest.createFunction(
    {id:'delete-user-with-clerk'},
    {event:'clerk/user.deleted'},
    async ({ event }) => {
        const {id} = event.data;
        await User.findByIdAndDelete(id);
        }
    
);


export const functions = [
    syncUserCreation,
    syncUserUpdation,
    syncUserdeletion
];