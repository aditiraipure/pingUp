import { useState } from "react";
import { MapPin, X } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import api from "../api/axios";

const EditPostModal = ({ post, onClose, onSaved }) => {
  const { getToken } = useAuth();
  const [content, setContent] = useState(post.content || "");
  const [tags, setTags] = useState((post.tags || []).join(", "));
  const [location, setLocation] = useState(post.location || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (saving) return;
    try {
      setSaving(true);
      const { data } = await api.patch(
        `/api/post/${post._id}`,
        { content, location, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean) },
        { headers: { Authorization: `Bearer ${await getToken()}` } },
      );
      if (!data.success) throw new Error(data.message);
      onSaved(data.post);
      toast.success("Post updated");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[230] bg-black/50 p-4 flex items-center justify-center" role="dialog" aria-modal="true" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="relative border-b p-4 text-center">
          <h2 className="font-semibold text-slate-800">Edit post</h2>
          <button type="button" onClick={onClose} className="absolute right-4 top-4" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4 p-5">
          <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={5} className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400" placeholder="Add a caption..." />
          <input value={tags} onChange={(event) => setTags(event.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400" placeholder="Tags, separated by commas" />
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
            <MapPin className="w-4 h-4 text-slate-400" />
            <input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={120} className="w-full py-3 text-sm outline-none" placeholder="Location" />
          </div>
          {post.image_urls?.length > 0 && <p className="text-xs text-slate-400">Media stays unchanged.</p>}
        </div>
        <div className="flex justify-end gap-2 border-t p-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-600">Cancel</button>
          <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-60">{saving ? "Saving..." : "Save"}</button>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;
