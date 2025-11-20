import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { dummyMessagesData, dummyUserData } from "../assets/assets";
import { ImageIcon, SendHorizonal } from "lucide-react";

const ChatBox = () => {
  const { userId } = useParams();
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(dummyUserData);
  const messagesEndRef = useRef(null);

  useEffect(() => {
   
    const userMessages = dummyMessagesData.filter(
      (msg) => msg.from_user_id === userId || msg.to_user_id === userId
    );
    setMessages(userMessages);
  }, [userId]);

  useEffect(() => {
   
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!text && !image) return;

    const newMessage = {
      id: Date.now(),
      from_user_id: user._id,
      to_user_id: userId,
      text: text,
      message_type: image ? "image" : "text",
      media_url: image ? URL.createObjectURL(image) : null,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setText("");
    setImage(null);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-2 p-2 md:px-10 xl:pl-42 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300">
        <img
          src={user.profile_pic || "/default-avatar.png"}
          alt="user avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="font-medium">{user.full_name}</p>
          <p className="text-sm text-gray-500 -mt-1.5">@{user.username}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="p-5 md:px-10 h-full overflow-y-scroll flex-1">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages
            .toSorted((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.from_user_id === user._id
                    ? "items-end"
                    : "items-start"
                }`}
              >
                <div
                  className={`p-2 text-sm max-w-sm ${
                    message.message_type === "image"
                      ? ""
                      : "bg-white shadow rounded-lg"
                  } text-slate-700`}
                >
                  {message.message_type === "image" && (
                    <img
                      src={message.media_url}
                      alt="sent media"
                      className="w-40 h-auto rounded-md"
                    />
                  )}
                  {message.text && <p>{message.text}</p>}
                </div>
              </div>
            ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Section */}
      <div className="px-4">
        <div className="flex items-center gap-3 pl-5 p-1.5 bg-white w-full max-w-xl mx-auto border border-gray-200 shadow rounded-full mb-5">
          <input
            type="text"
            className="flex-1 outline-none text-slate-700"
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            onChange={(e) => setText(e.target.value)}
            value={text}
          />

          <label htmlFor="image">
            {image ? (
              <img
                src={URL.createObjectURL(image)}
                alt="preview"
                className="h-8 rounded"
              />
            ) : (
              <ImageIcon className="w-7 h-7 text-gray-400 cursor-pointer" />
            )}
            <input
              type="file"
              id="image"
              accept="image/*"
              hidden
              onChange={(e) => setImage(e.target.files[0])}
            />
          </label>

          <button
            onClick={sendMessage}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 cursor-pointer text-white p-2 rounded-full">
            <SendHorizonal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
