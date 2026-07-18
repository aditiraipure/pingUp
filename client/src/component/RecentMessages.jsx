import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../api/axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { profileAvatar } from "../utils/profile";

const getMessageTimestamp = (message) => message.createdAt;

const getMessagePreview = (message) => {
  if (message.shared_post) return "Shared post";
  if (message.shared_story) return "Shared story";

  const mimeType = message.media_mime_type?.toLowerCase() || "";
  const fileName = message.media_name?.split("?")[0].toLowerCase() || "";
  const extension = fileName.includes(".") ? fileName.split(".").pop() : "";
  const messageType = message.message_type?.toLowerCase();

  if (mimeType === "application/pdf" || extension === "pdf") return "📕 PDF";
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    ["doc", "docx"].includes(extension)
  ) return "📄 Document";
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv" ||
    ["xls", "xlsx", "csv"].includes(extension)
  ) return "📊 Spreadsheet";
  if (mimeType.startsWith("image/") || messageType === "image") return "🖼️ Photo";
  if (mimeType.startsWith("video/") || messageType === "video") return "🎥 Video";
  if (mimeType.startsWith("audio/") || messageType === "audio") return "🎵 Audio";
  if (messageType === "file" || message.media_url) return "📁 File";
  return message.message || "";
};

const formatMessageTime = (value) => {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (elapsedSeconds < 60) return "Just now";

  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  if (hours < 48) return "Yesterday";

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  const weeks = Math.floor(days / 7);
  if (days < 30) return `${weeks}w`;

  const months = Math.floor(days / 30);
  if (days < 365) return `${months}mo`;

  const years = Math.floor(days / 365);
  return `${years}y`;
};

const RecentMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const latestRequestRef = useRef(0);
  const { user } = useUser();
  const { getToken } = useAuth();

  const fetchRecentMessages = useCallback(async () => {
    const requestId = ++latestRequestRef.current;
    try {
      const token = await getToken();

      const { data } = await api.get("/api/message/recent", {
        headers: { Authorization: `Bearer ${token}` },
        params: { _ts: Date.now() },
      });

      if (requestId !== latestRequestRef.current) return;
      if (data.success) {
        const groupedMessages = (data.messages || data.message || []).reduce(
          (acc, message) => {
            const participant =
              message.from_user_id?._id === user.id
                ? message.to_user_id
                : message.from_user_id;
            if (!participant?._id) return acc;

            const participantId = participant._id;
            const currentTimestamp = getMessageTimestamp(message);
            const savedTimestamp = getMessageTimestamp(acc[participantId] || {});

            if (
              !acc[participantId] ||
              new Date(currentTimestamp) > new Date(savedTimestamp)
            ) {
              acc[participantId] = { ...message, chat_user: participant };
            }
            return acc;
          },
          {},
        );

        const sortedMessages = Object.values(groupedMessages).sort(
          (a, b) => new Date(getMessageTimestamp(b)) - new Date(getMessageTimestamp(a)),
        );

        setMessages(sortedMessages);
        setError("");
      } else {
        setError(data.message || "Unable to load recent messages");
        toast.error(data.message);
      }
    } catch (error) {
      if (requestId !== latestRequestRef.current) return;
      setError(error?.message || "Unable to load recent messages");
      toast.error(error?.message || "Something went wrong");
    } finally {
      if (requestId === latestRequestRef.current) setLoading(false);
    }
  }, [getToken, user?.id]);

  useEffect(() => {
    if (user) {
      fetchRecentMessages();
      const id = setInterval(fetchRecentMessages, 30000);
      window.addEventListener("recent-messages-updated", fetchRecentMessages);
      return () => {
        latestRequestRef.current += 1;
        clearInterval(id);
        window.removeEventListener("recent-messages-updated", fetchRecentMessages);
      };
    }
  }, [fetchRecentMessages, user]);

  return (
    <div className="bg-white max-w-xs mt-4 p-4 min-h-20 rounded-md shadow text-sm text-slate-800">
      <h3 className="font-semibold text-slate-800 mb-4">Recent Messages</h3>
      {loading && <p className="text-xs text-slate-400 px-2 py-2">Loading...</p>}
      {!loading && error && <p className="text-xs text-slate-400 px-2 py-2">{error}</p>}
      {messages.map((message) => (
        <Link
          key={message.chat_user._id}
          to={`/messages/${message?.chat_user?._id}`}
          className="flex items-center gap-2 py-2 hover:bg-slate-100 rounded-md px-2"
        >
          <img
            src={profileAvatar(message?.chat_user)}
            alt="profile"
            className="w-8 h-8 rounded-full"
          />

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <p className="font-medium truncate">
                {message?.chat_user?.full_name}
              </p>
              <p className="text-[10px] text-slate-400">
                {formatMessageTime(getMessageTimestamp(message))}
              </p>
            </div>

            <div className="flex justify-between items-center mt-0.5">
              <p className="text-gray-500 text-xs truncate">
                {getMessagePreview(message)}
              </p>

              {message.to_user_id?._id === user.id && !message.is_seen && (
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
