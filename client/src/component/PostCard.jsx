import { BadgeCheck, MessageCircle, RotateCcw, Share2Icon, Trash2 } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import PostCommentsModal from "./PostCommentsModal";
import SharePostModal from "./SharePostModal";
import PostImageViewer from "./PostImageViewer";
import LikeButton from "./LikeButton";
import PostOptions from "./PostOptions";
import OtherPostOptions from "./OtherPostOptions";
import { profileAvatar } from "../utils/profile";

const PostCard = ({ post, onLikeChange, onPostChange, onPostRemoved, archiveActions }) => {
  const [currentPost, setCurrentPost] = useState(post);
  const [likes, setLikes] = useState(post.likes_count || []);
  const [shareCount, setShareCount] = useState(post.share_count || 0);
  const [commentCount, setCommentCount] = useState(post.comments_count || 0);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(null);
  const [isHiding, setIsHiding] = useState(false);
  const currentUser = useSelector((state) => state.user.value);
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const isOwner = Boolean(currentUser?._id && currentPost?.user?._id === currentUser._id);
  const postWithHashTags = currentPost?.content?.replace(/(#\w+)/g, "<span class='text-indigo-600'>$1</span>");

  useEffect(() => {
    setCurrentPost(post);
    setLikes(post.likes_count || []);
    setShareCount(post.share_count || 0);
  }, [post]);

  useEffect(() => {
    const refreshProfile = (event) => {
      const updatedUser = event.detail?.user;
      if (!updatedUser?._id) return;
      setCurrentPost((item) => item.user?._id === updatedUser._id ? { ...item, user: updatedUser } : item);
      setComments((items) => items.map((comment) => comment.user?._id === updatedUser._id ? { ...comment, user: updatedUser } : comment));
    };
    window.addEventListener("profile-updated", refreshProfile);
    return () => window.removeEventListener("profile-updated", refreshProfile);
  }, []);

  useEffect(() => {
    let active = true;
    const loadComments = async () => {
      try {
        setCommentsLoading(true);
        const { data } = await api.get(`/api/post/${currentPost._id}/comments`, {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (!data.success) throw new Error(data.message);
        if (active) {
          setComments(data.comments || []);
          setCommentCount((data.comments || []).length);
          setCommentsError("");
        }
      } catch (error) {
        if (active) setCommentsError(error.message || "Unable to load comments");
      } finally {
        if (active) setCommentsLoading(false);
      }
    };
    loadComments();
    return () => { active = false; };
  }, [getToken, currentPost._id]);

  const changePost = (nextPost) => {
    setCurrentPost(nextPost);
    setLikes(nextPost.likes_count || []);
    setShareCount(nextPost.share_count || 0);
    onPostChange?.(nextPost);
    window.dispatchEvent(new CustomEvent("post-updated", { detail: { post: nextPost } }));
  };

  const removePost = () => {
    onPostRemoved?.(currentPost._id);
    window.dispatchEvent(new CustomEvent("post-removed", { detail: { postId: currentPost._id } }));
  };

  const hideFromFeed = () => {
    setIsHiding(true);
    window.setTimeout(removePost, 250);
  };

  const handleLike = async () => {
    try {
      const { data } = await api.post("/api/post/like", { postId: currentPost._id }, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (!data.success) throw new Error(data.message);
      const wasLiked = likes.includes(currentUser._id);
      setLikes((items) => items.includes(currentUser._id) ? items.filter((id) => id !== currentUser._id) : [...items, currentUser._id]);
      onLikeChange?.(!wasLiked);
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow p-4 space-y-4 w-full max-w-2xl transition-all duration-300 ${isHiding ? "-translate-y-2 opacity-0" : "translate-y-0 opacity-100"}`}>
      <div className="flex items-start">
        <div onClick={() => currentPost?.user?._id && navigate(`/profile/${currentPost.user._id}`)} className="inline-flex items-center gap-3 cursor-pointer">
          <img src={profileAvatar(currentPost?.user)} alt="" className="w-10 h-10 rounded-full shadow" />
          <div>
            <div className="flex items-center space-x-1"><span>{currentPost?.user?.full_name || "Unknown"}</span><BadgeCheck className="w-4 h-4 text-blue-500" /></div>
            <div className="text-gray-500 text-sm">@{currentPost?.user?.username || "unknown"} · {moment(currentPost?.createdAt).fromNow()}</div>
          </div>
        </div>
        {isOwner && <PostOptions post={currentPost} onChanged={changePost} onRemoved={removePost} />}
        {!isOwner && currentUser?._id && <OtherPostOptions post={currentPost} onNotInterested={hideFromFeed} />}
      </div>

      {currentPost?.content && <div className="text-gray-800 text-sm whitespace-pre-line" dangerouslySetInnerHTML={{ __html: postWithHashTags }} />}
      {currentPost?.location && <p className="text-xs text-slate-500">{currentPost.location}</p>}
      {currentPost?.tags?.length > 0 && <p className="text-sm text-indigo-600">{currentPost.tags.map((tag) => `#${tag}`).join(" ")}</p>}
      <div className="grid grid-cols-2 gap-2">
        {currentPost?.image_urls?.map((img, index) => (
          <button type="button" key={img} onClick={() => setImageViewerIndex(index)} className={currentPost.image_urls.length === 1 ? "col-span-2" : ""}>
            <img src={img} className={`w-full h-48 object-cover rounded-lg cursor-zoom-in ${currentPost.image_urls.length === 1 ? "h-auto" : ""}`} alt="" />
          </button>
        ))}
      </div>

      <div className="flex items-center gap-6 text-gray-600 text-sm pt-2 border-t border-gray-300">
        <LikeButton liked={Boolean(currentUser?._id && likes.includes(currentUser._id))} count={currentPost.hide_like_count ? undefined : likes.length} onClick={handleLike} ariaLabel="Like post" />
        <button type="button" onClick={() => setShowComments(true)} className="flex items-center gap-1 cursor-pointer"><MessageCircle className="w-4 h-4" /><span>{commentCount}</span></button>
        <button type="button" onClick={() => setShowShare(true)} className="flex items-center gap-1 cursor-pointer"><Share2Icon className="w-4 h-4" />{!currentPost.hide_share_count && <span>{shareCount}</span>}</button>
      </div>
      {archiveActions && (
        <div className="flex flex-col gap-2 border-t border-gray-200 pt-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => archiveActions.onRestore(currentPost)} disabled={archiveActions.busy === currentPost._id} className="flex items-center justify-center gap-2 rounded-lg border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50">
            <RotateCcw className="h-4 w-4" />
            {archiveActions.busy === currentPost._id ? "Restoring..." : "Restore"}
          </button>
          <button type="button" onClick={() => archiveActions.onDelete(currentPost)} disabled={archiveActions.busy === currentPost._id} className="flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50">
            <Trash2 className="h-4 w-4" />
            Delete Permanently
          </button>
        </div>
      )}

      {showComments && <PostCommentsModal post={currentPost} comments={comments} loading={commentsLoading} error={commentsError} onClose={() => setShowComments(false)} onCommentAdded={(comment) => { setComments((items) => [...items, comment]); setCommentCount((count) => count + 1); }} onCommentLike={(commentId, nextLikes) => setComments((items) => items.map((comment) => comment._id === commentId ? { ...comment, likes: nextLikes } : comment))} />}
      {showShare && <SharePostModal post={currentPost} onShared={(count) => changePost({ ...currentPost, share_count: count })} onClose={() => setShowShare(false)} />}
      {imageViewerIndex !== null && <PostImageViewer images={currentPost.image_urls} index={imageViewerIndex} onIndexChange={setImageViewerIndex} onClose={() => setImageViewerIndex(null)} />}
    </div>
  );
};

export default PostCard;
