import { useState } from "react";
import { FileImage, Image as GifIcon, Send, X } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import api from "../api/axios";
import toast from "react-hot-toast";
import LikeButton from "./LikeButton";
import { profileAvatar } from "../utils/profile";

const emojis = ["😀", "😂", "😍", "👍", "❤️", "🎉"];

const PostCommentsModal = ({ post, comments, loading, error, onClose, onCommentAdded, onCommentLike }) => {
  const currentUser = useSelector((state) => state.user.value);
  const { getToken } = useAuth();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [likingComment, setLikingComment] = useState("");
  const commentingDisabled = Boolean(post.commenting_disabled);

  const toggleCommentLike = async (comment) => {
    if (likingComment === comment._id) return;
    const wasLiked = comment.likes?.includes(currentUser._id);
    const previousLikes = comment.likes || [];
    const nextLikes = wasLiked
      ? previousLikes.filter((id) => id !== currentUser._id)
      : [...previousLikes, currentUser._id];

    onCommentLike?.(comment._id, nextLikes);
    setLikingComment(comment._id);
    try {
      const { data } = await api.post(
        `/api/post/comments/${comment._id}/like`,
        {},
        { headers: { Authorization: `Bearer ${await getToken()}` } },
      );
      if (!data.success) throw new Error(data.message);
      onCommentLike?.(comment._id, data.likes || nextLikes);
    } catch (error) {
      onCommentLike?.(comment._id, previousLikes);
      toast.error(error.message);
    } finally {
      setLikingComment("");
    }
  };

  const submitComment = async () => {
    if (!content.trim() || sending) return;
    try {
      setSending(true);
      const { data } = await api.post(
        `/api/post/${post._id}/comments`,
        { content: content.trim() },
        { headers: { Authorization: `Bearer ${await getToken()}` } },
      );
      if (!data.success) throw new Error(data.message);
      setContent("");
      onCommentAdded?.(data.comment);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[210] bg-black/50 p-4 flex items-center justify-center" role="dialog" aria-modal="true" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl h-[92vh] max-h-[92vh] flex flex-col">
        <div className="relative p-4 flex items-center justify-center">
          <h2 className="font-semibold text-slate-800 text-center">Comments</h2>
          <button type="button" onClick={onClose} aria-label="Close comments" className="absolute right-4"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && <p className="text-sm text-slate-400 text-center py-8">Loading comments...</p>}
          {!loading && error && <p className="text-sm text-red-500 text-center py-8">{error}</p>}
          {!loading && !error && comments.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No comments yet.</p>}
          {comments.map((comment) => (
            <div key={comment._id} className="flex items-start gap-3">
              <img src={profileAvatar(comment.user)} alt="" className="w-8 h-8 rounded-full object-cover" />
              <div className="bg-slate-50 rounded-xl px-3 py-2 min-w-0">
                <p className="text-xs font-semibold text-slate-700">{comment.user?.full_name}</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{comment.content}</p>
              </div>
              <div className="ml-auto shrink-0 self-center">
                <LikeButton
                liked={Boolean(comment.likes?.includes(currentUser._id))}
                count={comment.likes?.length || 0}
                onClick={() => toggleCommentLike(comment)}
                disabled={likingComment === comment._id}
                vertical
                compact
                ariaLabel="Like comment"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t p-4">
          {commentingDisabled ? <p className="py-3 text-center text-sm text-slate-500">Comments have been turned off by the post owner.</p> : <>
          <div className="flex gap-2 mb-2 pl-11">{emojis.map((emoji) => <button type="button" key={emoji} onClick={() => setContent((value) => value + emoji)} className="hover:scale-110 transition">{emoji}</button>)}</div>
          <div className="flex items-center gap-2">
            <img src={profileAvatar(currentUser)} alt="" className="w-9 h-9 rounded-full object-cover" />
            <div className="flex-1 flex items-center gap-2 rounded-full border border-slate-200 px-3">
              <input value={content} onChange={(event) => setContent(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submitComment()} placeholder="What do you think about this?" className="flex-1 py-2.5 text-sm outline-none min-w-0" />
              <button type="button" aria-label="Add photo" className="text-slate-400"><FileImage className="w-5 h-5" /></button>
              <button type="button" aria-label="Add GIF" className="text-slate-400"><GifIcon className="w-5 h-5" /></button>
            </div>
            <button type="button" onClick={submitComment} disabled={sending || !content.trim()} className="w-9 h-9 rounded-full bg-indigo-500 text-white grid place-items-center disabled:opacity-50"><Send className="w-4 h-4" /></button>
          </div>
          </>}
        </div>
      </div>
    </div>
  );
};

export default PostCommentsModal;
