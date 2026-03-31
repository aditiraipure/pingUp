import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../api/axios";
import { Link } from "react-router-dom";
import moment from "moment";
import toast from "react-hot-toast";

const RecentMessages = () => {
  const [messages, setMessages] = useState([]);
  const { user } = useUser();
  const { getToken } = useAuth();

  const fetchRecentMessages = async () => {
    try {
      const token = await getToken();

      const { data } = await api.get("/api/message/recent", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        const groupedMessages = (data.messages || data.message || []).reduce(
          (acc, message) => {
            if (!message.from_user_id) return acc;

            const senderId = message.from_user_id._id;

            if (
              !acc[senderId] ||
              new Date(message.createdAt) > new Date(acc[senderId].createdAt)
            ) {
              acc[senderId] = message;
            }
            return acc;
          },
          {},
        );

        const sortedMessages = Object.values(groupedMessages).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );

        setMessages(sortedMessages);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.message || "Something went wrong");
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecentMessages();
      const id = setInterval(fetchRecentMessages, 30000);
      return () => {
        clearInterval(id);
      };
    }
  }, [user]);

  return (
    <div className="bg-white max-w-xs mt-4 p-4 min-h-20 rounded-md shadow text-sm text-slate-800">
      <h3 className="font-semibold text-slate-800 mb-4">Recent Messages</h3>
      {messages.map((message, index) => (
        <Link
          key={index}
          to={`/messages/${message?.from_user_id?._id}`}
          className="flex items-center gap-2 py-2 hover:bg-slate-100 rounded-md px-2"
        >
          <img
            src={message?.from_user_id?.profile_picture}
            alt="profile"
            className="w-8 h-8 rounded-full"
          />

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <p className="font-medium truncate">
                {message?.from_user_id?.full_name}
              </p>
              <p className="text-[10px] text-slate-400">
                {moment(message.createdAt).fromNow()}
              </p>
            </div>

            <div className="flex justify-between items-center mt-0.5">
              <p className="text-gray-500 text-xs truncate">
                {message.message ? message.message : "media"}
              </p>

              {!message.is_seen && (
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
