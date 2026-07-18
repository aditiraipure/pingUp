import { Archive, Eye, EyeOff, HeartOff, MessageSquareOff, MoreVertical, Pencil, RotateCcw, Share2, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import EditPostModal from "./EditPostModal";
import { createElement } from "react";

const PostOptions = ({ post, onChanged, onRemoved }) => {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (event) => !menuRef.current?.contains(event.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const request = async (key, method, path, body, success, callback) => {
    if (busy) return;
    const previous = post;
    try {
      setBusy(key);
      if (callback.optimistic) onChanged(callback.optimistic);
      const { data } = await api[method](path, ...(body ? [body] : []), {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (!data.success) throw new Error(data.message);
      callback.done?.(data);
      toast.success(success);
      setOpen(false);
    } catch (error) {
      if (callback.optimistic) onChanged(previous);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setBusy("");
    }
  };

  const toggle = (field, label) => request(
    field,
    "patch",
    `/api/post/${post._id}`,
    { [field]: !post[field] },
    label,
    { optimistic: { ...post, [field]: !post[field] }, done: (data) => onChanged(data.post) },
  );

  const remove = async () => {
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;
    await request("delete", "delete", `/api/post/${post._id}`, null, "Post deleted", { done: onRemoved });
  };

  const items = post.is_archived
    ? [{ key: "restore", icon: RotateCcw, label: "Restore post", action: () => request("restore", "patch", `/api/post/${post._id}/restore`, {}, "Post restored successfully.", { done: (data) => { onChanged(data.post); onRemoved(); window.dispatchEvent(new CustomEvent("post-restored", { detail: { post: data.post } })); window.dispatchEvent(new Event("profile-updated")); } }) }]
    : [
        { key: "archive", icon: Archive, label: "Archive", action: () => request("archive", "patch", `/api/post/${post._id}/archive`, {}, "Post archived successfully.", { done: onRemoved }) },
        { key: "likes", icon: post.hide_like_count ? Eye : HeartOff, label: post.hide_like_count ? "Show Like Count" : "Hide Like Count", action: () => toggle("hide_like_count", "Like count setting updated") },
        { key: "shares", icon: post.hide_share_count ? Eye : EyeOff, label: post.hide_share_count ? "Show Share Count" : "Hide Share Count", action: () => toggle("hide_share_count", "Share count setting updated") },
        { key: "comments", icon: MessageSquareOff, label: post.commenting_disabled ? "Turn On Commenting" : "Turn Off Commenting", action: () => toggle("commenting_disabled", "Comment setting updated") },
        { key: "edit", icon: Pencil, label: "Edit Post", action: () => { setOpen(false); setEditing(true); } },
      ];

  return (
    <div ref={menuRef} className="relative ml-auto" onClick={(event) => event.stopPropagation()}>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label="More post options" aria-expanded={open} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><MoreVertical className="w-5 h-5" /></button>
      {open && (
        <>
          <div className="fixed inset-0 z-[215] bg-black/35 sm:hidden" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-[220] rounded-t-2xl bg-white p-2 pb-5 shadow-2xl sm:absolute sm:inset-auto sm:right-0 sm:top-10 sm:w-64 sm:rounded-xl sm:pb-2">
            <div className="flex items-center justify-between px-3 py-2 sm:hidden"><span className="font-semibold text-slate-800">Post options</span><button onClick={() => setOpen(false)}><X className="w-5 h-5" /></button></div>
            {items.map(({ key, icon, label, action }) => <button key={key} type="button" onClick={action} disabled={Boolean(busy)} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">{createElement(icon, { className: "w-5 h-5" })}<span>{busy === key ? "Updating..." : label}</span></button>)}
            <button type="button" onClick={remove} disabled={Boolean(busy)} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 className="w-5 h-5" /><span>{busy === "delete" ? "Deleting..." : "Delete Post"}</span></button>
          </div>
        </>
      )}
      {editing && <EditPostModal post={post} onClose={() => setEditing(false)} onSaved={onChanged} />}
    </div>
  );
};

export default PostOptions;
