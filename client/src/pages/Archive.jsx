import { Archive as ArchiveIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loading from "../component/Loading";
import PostCard from "../component/PostCard";

const Archive = () => {
  const { getToken } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    let active = true;
    const fetchArchivedPosts = async () => {
      try {
        const { data } = await api.get("/api/post/archive", {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (!data.success) throw new Error(data.message);
        if (active) setPosts(data.posts || []);
      } catch (error) {
        if (active) toast.error(error.response?.data?.message || error.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchArchivedPosts();
    return () => { active = false; };
  }, [getToken]);

  const restorePost = async (post) => {
    if (busy) return;
    try {
      setBusy(post._id);
      const { data } = await api.patch(`/api/post/${post._id}/restore`, {}, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (!data.success) throw new Error(data.message);
      setPosts((items) => items.filter((item) => item._id !== post._id));
      window.dispatchEvent(new CustomEvent("post-restored", { detail: { post: data.post } }));
      window.dispatchEvent(new Event("profile-updated"));
      toast.success("Post restored successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setBusy("");
    }
  };

  const deletePost = async (post) => {
    if (busy || !window.confirm("Are you sure you want to permanently delete this post? This action cannot be undone.")) return;
    try {
      setBusy(post._id);
      const { data } = await api.delete(`/api/post/${post._id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (!data.success) throw new Error(data.message);
      setPosts((items) => items.filter((item) => item._id !== post._id));
      window.dispatchEvent(new CustomEvent("post-removed", { detail: { postId: post._id } }));
      toast.success("Post permanently deleted.");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setBusy("");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-full bg-slate-50 p-6 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Archive</h1>
          <p className="mt-2 text-slate-600">Only you can see posts saved here.</p>
        </div>
        {posts.length > 0 ? (
          <div className="flex flex-col items-center gap-6">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onPostRemoved={(postId) => setPosts((items) => items.filter((item) => item._id !== postId))}
                onPostChange={(nextPost) => setPosts((items) => items.map((item) => item._id === nextPost._id ? nextPost : item))}
                archiveActions={{ busy, onRestore: restorePost, onDelete: deletePost }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-200/70">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-slate-300 text-slate-500"><ArchiveIcon className="h-9 w-9" /></div>
            <h2 className="mt-5 text-lg font-bold text-slate-800">No Archived Posts</h2>
            <p className="mt-2 text-sm text-slate-500">Posts you archive will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Archive;
