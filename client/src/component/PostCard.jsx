import { BadgeCheck, MessageCircle, Share2Icon } from "lucide-react";
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

const PostCard = ({ post, onLikeChange }) => {
  const postWithHashTags = post?.content?.replace(
    /(#\w+)/g,
    "<span class='text-indigo-600'>$1</span>",
  );

  const [likes, setLikes] = useState(post.likes_count);
  const [commentCount, setCommentCount] = useState(post.comments_count || 0);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(null);
  const currentUser = useSelector((state) => state.user.value);
  const { getToken } = useAuth();

  useEffect(() => {
    let active = true;
    const loadComments = async () => {
      try {
        setCommentsLoading(true);
        const { data } = await api.get(`/api/post/${post._id}/comments`, {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (!data.success) throw new Error(data.message);
        if (active) {
          const loadedComments = data.comments || [];
          setComments(loadedComments);
          setCommentCount(loadedComments.length);
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
  }, [getToken, post._id]);

  const handleLike = async () => {
    try {
      const { data } = await api.post(
        "/api/post/like",
        { postId: post._id },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        },
      );

      if (data.success) {
        toast.success(data.message);
        const wasLiked = likes.includes(currentUser._id);

        setLikes((prev) => {
          if (prev.includes(currentUser._id)) {
            return prev.filter((id) => id !== currentUser._id);
          } else {
            return [...prev, currentUser._id];
          }
        });
        onLikeChange?.(!wasLiked);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-4 w-full max-w-2xl">
      <div
        onClick={() => post?.user?._id && navigate("/profile/" + post.user._id)}
        className="inline-flex items-center gap-3 cursor-pointer"
      >
        <img
          src={post?.user?.profile_picture || ""}
          alt=".profile_picture"
          className="w-10 h-10 rounded-full shadow"
        />
        <div>
          <div className="flex items-center space-x-1">
            <span>{post?.user?.full_name || "Unknown"}</span>
            <BadgeCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-gray-500 text-sm">
            @{post?.user?.username || "unknown"} ·{" "}
            {moment(post?.createdAt).fromNow()}
          </div>
        </div>
      </div>

      {/* content */}
      {post?.content && (
        <div
          className="text-gray-800 text-sm whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: postWithHashTags }}
        />
      )}

      {/* images */}
      <div className="grid grid-cols-2 gap-2">
        {post?.image_urls?.map((img, index) => (
          <button type="button" key={index} onClick={() => setImageViewerIndex(index)} className={post.image_urls.length === 1 ? "col-span-2" : ""}>
            <img
              src={img}
              className={`w-full h-48 object-cover rounded-lg cursor-zoom-in ${
              post.image_urls.length === 1 && "col-span-2 h-auto"
            }`}
              alt=""
            />
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 text-gray-600 text-sm pt-2 border-t border-gray-300">
        {/* Like */}
        <LikeButton
          liked={Boolean(Array.isArray(likes) && currentUser?._id && likes.includes(currentUser._id))}
          count={likes?.length || 0}
          onClick={handleLike}
          ariaLabel="Like post"
        />

        {/* Comments */}
        <button type="button" onClick={() => setShowComments(true)} className="flex items-center gap-1 cursor-pointer">
          <MessageCircle className="w-4 h-4" />
          <span>{commentCount}</span>
        </button>

        {/* Share */}
        <button type="button" onClick={() => setShowShare(true)} className="flex items-center gap-1 cursor-pointer">
          <Share2Icon className="w-4 h-4" />
        </button>
      </div>
      {showComments && (
        <PostCommentsModal
          post={post}
          comments={comments}
          loading={commentsLoading}
          error={commentsError}
          onClose={() => setShowComments(false)}
          onCommentAdded={(comment) => {
            setComments((items) => [...items, comment]);
            setCommentCount((count) => count + 1);
          }}
          onCommentLike={(commentId, likes) => {
            setComments((items) => items.map((comment) => comment._id === commentId ? { ...comment, likes } : comment));
          }}
        />
      )}
      {showShare && <SharePostModal post={post} onClose={() => setShowShare(false)} />}
      {imageViewerIndex !== null && <PostImageViewer images={post.image_urls} index={imageViewerIndex} onIndexChange={setImageViewerIndex} onClose={() => setImageViewerIndex(null)} />}
    </div>
  );
};

export default PostCard;
