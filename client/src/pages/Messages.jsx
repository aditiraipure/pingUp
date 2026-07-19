import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, MessageSquare, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../api/axios";
import { profileAvatar } from "../utils/profile";

const messagePreview = (message) => {
  if (!message) return "";
  if (message.shared_post) return "Shared a post";
  if (message.shared_story) return "Shared a story";
  if (message.media_mime_type?.startsWith("image/")) return "Photo";
  if (message.media_mime_type?.startsWith("video/")) return "Video";
  if (message.media_mime_type?.startsWith("audio/")) return "Audio";
  if (message.media_url) return message.media_name || "Attachment";
  return message.message || "";
};

const Messages = () => {
  const { connections } = useSelector((state) => state.connections);
  const unreadByUser = useSelector((state) => state.messages.unreadByUser);
  const { getToken } = useAuth();
  const { user: currentUser } = useUser();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [recentMessages, setRecentMessages] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [searchError, setSearchError] = useState("");

  const fetchRecentMessages = useCallback(async () => {
    try {
      const token = await getToken();
      const { data } = await api.get("/api/message/recent", {
        headers: { Authorization: `Bearer ${token}` },
        params: { _ts: Date.now() },
      });
      if (data.success) setRecentMessages(data.messages || []);
    } finally {
      setLoadingRecent(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchRecentMessages();
    window.addEventListener("recent-messages-updated", fetchRecentMessages);
    return () => window.removeEventListener("recent-messages-updated", fetchRecentMessages);
  }, [fetchRecentMessages]);

  useEffect(() => {
    const input = query.trim();
    if (!input) {
      setSearchResults([]);
      setSearchError("");
      setSearching(false);
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      try {
        const token = await getToken();
        const { data } = await api.post(
          "/api/user/discover",
          { input, scope: "messages" },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!active) return;
        if (data.success) setSearchResults(data.users || []);
        else setSearchError(data.message || "Unable to search users");
      } catch (error) {
        if (active) {
          setSearchResults([]);
          setSearchError(error.response?.data?.message || "Unable to search users");
        }
      } finally {
        if (active) setSearching(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [getToken, query]);

  const conversationUsers = useMemo(() => {
    const usersById = new Map();

    recentMessages.forEach((message) => {
      const fromId = message.from_user_id?._id || message.from_user_id;
      const participant = fromId === currentUser?.id
        ? message.to_user_id
        : message.from_user_id;
      if (participant?._id && !usersById.has(participant._id)) {
        usersById.set(participant._id, { ...participant, latestMessage: message });
      }
    });

    connections.forEach((user) => {
      if (!usersById.has(user._id)) usersById.set(user._id, user);
    });

    return [...usersById.values()];
  }, [connections, currentUser?.id, recentMessages]);

  const users = query.trim() ? searchResults : conversationUsers;
  const emptyMessage = query.trim() ? "No users found" : "No conversations yet";

  return (
    <div className="min-h-screen relative bg-slate-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-5">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Messages</h1>
          <p className="text-slate-600">Talk to your friends and family</p>
        </div>

        <div className="relative max-w-xl mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or username"
            aria-label="Search registered users"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-slate-700 outline-none shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {(searching || (!query.trim() && loadingRecent)) && (
          <div className="max-w-xl space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-28 rounded-xl bg-white shadow-sm animate-pulse" />
            ))}
          </div>
        )}

        {!searching && searchError && (
          <div className="max-w-xl rounded-xl border border-red-100 bg-white p-6 text-center text-sm text-red-500">
            {searchError}
          </div>
        )}

        {!searching && !searchError && users.length === 0 && !loadingRecent && (
          <div className="max-w-xl min-h-44 rounded-xl border border-slate-200 bg-white grid place-items-center text-slate-500 shadow-sm">
            {emptyMessage}
          </div>
        )}

        {!searching && !searchError && (
          <div className="flex flex-col gap-3">
            {users.map((user) => (
              <div
                key={user._id}
                className="max-w-xl flex items-center gap-4 p-5 bg-white shadow rounded-md"
              >
                <img
                  src={profileAvatar(user)}
                  alt={user.full_name || "Profile"}
                  className="rounded-full w-12 h-12 object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-700 truncate">{user.full_name}</p>
                    {(unreadByUser[user._id] || 0) > 0 && (
                      <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center">
                        {unreadByUser[user._id] > 99 ? "99+" : unreadByUser[user._id]}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 truncate">@{user.username}</p>
                  <p className="text-sm text-gray-600 truncate">
                    {user.latestMessage
                      ? messagePreview(user.latestMessage)
                      : user.bio?.slice(0, 80) || "Start a conversation"}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${user._id}`)}
                    className="px-3 py-2 flex items-center justify-center text-sm rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition cursor-pointer gap-1.5"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="max-sm:hidden">View Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/messages/${user._id}`)}
                    aria-label={`Message ${user.full_name}`}
                    className="size-10 flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white active:scale-95 transition cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
