import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema({
  from_user_id: { type: String, ref: "User", required: true }, // The user who has the connection
  to_user_id: { type: String, ref: "User", required: true }, // The connected user
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }, // Connection status
}, { timestamps: true });

const Connection = mongoose.model('Connection', connectionSchema);

export default Connection;