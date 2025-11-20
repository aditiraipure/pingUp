import { useState, useEffect } from "react";
import { dummyRecentMessagesData } from "../assets/assets";
import { Link } from "react-router-dom";
import moment from "moment";

const RecentMessages = () => {
  const [messages, setMessages] = useState([]);

  const fetchRecentMessages = async () => {
    setMessages(dummyRecentMessagesData);
  };

  useEffect(() => {
    fetchRecentMessages();
  }, []);

  return (
    <div className="bg-white max-w-xs mt-4 p-4 min-h-20 rounded-md shadow text-sm text-slate-800">
      <h3 className="font-semibold text-slate-800 mb-4">Recent Messages</h3>
      {messages.map((message, index) => (
        <Link
          key={index}
          to={`/messages/${message.from_user_id._id}`}
          className="flex items-center gap-2 py-2 hover:bg-slate-100 rounded-md px-2"
        >
          {/* Profile Pic */}
          <img
            src={message.from_user_id.profile_picture}
            alt="profile"
            className="w-8 h-8 rounded-full"
          />

          {/* Message Info */}
          <div className="flex-1 min-w-0">
            {/* Top Row: Name + Time */}
            <div className="flex justify-between items-center">
              <p className="font-medium truncate">
                {message.from_user_id.full_name}
              </p>
              <p className="text-[10px] text-slate-400">
                {moment(message.createdAt).fromNow()}
              </p>
            </div>

            {/* Bottom Row: Message text + Seen badge */}
            <div className="flex justify-between items-center mt-0.5">
              <p className="text-gray-500 text-xs truncate">
                {message.text ? message.text : "media"}
              </p>
              {!message.seen && (
                <span className="bg-indigo-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px]">
                  1
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default RecentMessages;
