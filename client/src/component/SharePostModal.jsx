import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import api from "../api/axios";
import toast from "react-hot-toast";

const SharePostModal = ({ post, story, onClose }) => {
  const friends = useSelector((state) => state.connections.connections || []);
  const { getToken } = useAuth();
  const [query, setQuery] = useState("");
  const [sendingTo, setSendingTo] = useState("");
  const filteredFriends = useMemo(() => friends.filter((friend) => `${friend.full_name} ${friend.username}`.toLowerCase().includes(query.toLowerCase())), [friends, query]);

  const shareWith = async (friend) => {
    try {
      setSendingTo(friend._id);
      const formData = new FormData();
      formData.append("to_user_id", friend._id);
      formData.append("message", story ? "Shared a story" : "Shared a post");
      formData.append(story ? "shared_story_id" : "shared_post_id", (story || post)._id);
      const { data } = await api.post("/api/message/send", formData, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (!data.success) throw new Error(data.message);
      window.dispatchEvent(new Event("recent-messages-updated"));
      toast.success(`Shared with ${friend.full_name}`);
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSendingTo("");
    }
  };

  return (
    <div className="fixed inset-0 z-[210] bg-black/50 p-4 flex items-center justify-center" role="dialog" aria-modal="true" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[75vh] flex flex-col">
        <div className="relative p-4 flex items-center justify-center"><h2 className="font-semibold text-slate-800 text-center">{story ? "Share Story" : "Share Post"}</h2><button type="button" onClick={onClose} aria-label="Close share dialog" className="absolute right-4"><X className="w-5 h-5" /></button></div>
        <div className="m-4 flex items-center gap-2 rounded-lg border border-slate-200 px-3"><Search className="w-4 h-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search friends" className="w-full py-2.5 text-sm outline-none" /></div>
        <div className="overflow-y-auto px-4 pb-4 space-y-1">
          {filteredFriends.map((friend) => <button type="button" key={friend._id} onClick={() => shareWith(friend)} disabled={Boolean(sendingTo)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 text-left disabled:opacity-60"><img src={friend.profile_picture} alt="" className="w-10 h-10 rounded-full object-cover" /><span className="flex-1 font-medium text-sm text-slate-700">{friend.full_name}</span><span className="text-xs text-indigo-600">{sendingTo === friend._id ? "Sending..." : "Send"}</span></button>)}
          {filteredFriends.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No friends found.</p>}
        </div>
      </div>
    </div>
  );
};

export default SharePostModal;
