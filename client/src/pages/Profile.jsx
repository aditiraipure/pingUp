
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import UserProfileInfo from "../component/UserProfileInfo";
import PostCard from "../component/PostCard";
import { Link } from "react-router-dom";
import moment from "moment";
import ProfileModel from "../component/ProfileModel";
import {useAuth} from '@clerk/clerk-react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useSelector } from "react-redux";
import { Camera, Heart } from "lucide-react";

const EmptyProfileTab = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="min-h-56 flex flex-col items-center justify-center px-6 py-10 text-center">
    {Icon && <div className="w-20 h-20 rounded-full border-2 border-slate-300 flex items-center justify-center mb-4"><Icon className="w-9 h-9 text-slate-500" /></div>}
    <p className={description ? "font-bold text-slate-800" : "font-medium text-slate-700"}>{title}</p>
    {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    {actionLabel && <button type="button" onClick={onAction} className="mt-4 px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 transition text-sm font-medium text-white cursor-pointer">{actionLabel}</button>}
  </div>
);


const Profile = () => {
  const currentUser = useSelector((state)=>state.user.value)
  const {getToken} =  useAuth();
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUser = async (profileId) => {
    setLoading(true);
    setError("");
    try {
      const token =  await getToken()
      const {data} = await api.post(`/api/user/profile`,{profileId},{
        headers : {Authorization : `Bearer ${token}`}
      })
      if(data.success){
        setUser(data.profile)
        setPosts(data.posts)
        setLikedPosts(data.likedPosts || [])
      }else{
        toast.error(data.message)
        setError(data.message || "Unable to load profile");
      }
    } catch (error) {
      toast.error(error.message)
      setError(error.message || "Unable to load profile");
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  const targetProfileId = profileId || currentUser?._id;
  if (targetProfileId) fetchUser(targetProfileId);
}, [profileId, currentUser?._id]);

useEffect(() => {
  const refreshProfile = () => {
    const targetProfileId = profileId || currentUser?._id;
    if (targetProfileId) fetchUser(targetProfileId);
  };
  window.addEventListener("profile-updated", refreshProfile);
  return () => window.removeEventListener("profile-updated", refreshProfile);
}, [profileId, currentUser?._id]);


  if (loading) return <div className="p-6 max-w-3xl mx-auto space-y-4"><div className="h-56 rounded-2xl bg-purple-100 animate-pulse"/><div className="h-40 rounded-2xl bg-white animate-pulse"/></div>;
  if (error) return <div className="h-full flex items-center justify-center p-6"><div className="bg-white border border-purple-100 rounded-2xl shadow-sm p-8 text-center"><p className="font-semibold text-slate-800">Profile unavailable</p><p className="text-sm text-slate-500 mt-2">{error}</p><button onClick={() => fetchUser(profileId || currentUser?._id)} className="mt-5 px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white">Retry</button></div></div>;
  const isOwnProfile = Boolean(currentUser?._id && user?._id === currentUser._id);
  const mediaPosts = posts.filter((post) => post.image_urls?.length > 0);

  return user ? (
    <div className="relative h-full overflow-y-scroll bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {/* Cover Photo */}
          <div className="h-40 md:h-56 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200">
            {user.cover_photo && (
              <img
                src={user.cover_photo}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* User Info Section */}
          <UserProfileInfo
            user={user}
            posts={posts}
            profileId={profileId}
            setShowEdit={setShowEdit}
          />
        </div>

        {/*Tabs  */}
        <div className="mt-6 ">
          <div className="bg-white rounded-xl shadow p-1 flex max-w-md mx-auto items-center">
            {["posts", "media", "likes"].map((tab) => (
              <button 
                onClick={() => setActiveTab(tab)}
                key={tab}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white"
                    : "text-gray-900"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* posts */}
          {activeTab === "posts" && (
            <div className="mt-6 flex flex-col items-center gap-4">
              {posts.length > 0 ? (
                posts.map((post) => <PostCard key={post._id} post={post} />)
              ) : isOwnProfile ? (
                <EmptyProfileTab title="Create your first post" description="Share your point of view." actionLabel="Create Post" onAction={() => navigate("/create-post")} />
              ) : (
                <EmptyProfileTab icon={Camera} title="No posts yet" />
              )}
            </div>
          )}

          {/* media */}
          {activeTab === "media" && (
            <div className="flex flex-wrap mt-6 max-w-6xl gap-2">
              {mediaPosts.length > 0 ? (
                mediaPosts.map((post) =>
                  post.image_urls.map((image, index) => (
                    <Link
                      target="_blank"
                      to={image}
                      key={`${post._id}-${index}`}
                      className="relative group"
                    >
                      <img
                        src={image}
                        className="-64 aspect-video object-cover rounded-lg"
                        alt="media"
                      />
                      <p className="absolute bottom-0 right-0 text-xs p-1 px-3 backdrop-blur-xl text-white opacity-0 group-hover:opacity-100 transition duration-300">
                        Posted {moment(post.createdAt).fromNow()}
                      </p>
                    </Link>
                  ))
                )
              ) : isOwnProfile ? (
                <div className="w-full">
                  <EmptyProfileTab title="Share a moment with the world." actionLabel="Create Reels" onAction={() => navigate("/", { state: { openStoryComposer: true } })} />
                </div>
              ) : (
                <div className="w-full"><EmptyProfileTab icon={Camera} title="No media yet" /></div>
              )}
            </div>
          )}

          {activeTab === "likes" && (
            <div className="mt-6 flex flex-col items-center gap-4">
              {likedPosts.length > 0 ? (
                likedPosts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onLikeChange={(isLiked) => {
                      if (!isLiked) setLikedPosts((items) => items.filter((item) => item._id !== post._id));
                    }}
                  />
                ))
              ) : (
                <EmptyProfileTab icon={Heart} title={isOwnProfile ? "No liked posts yet" : "No likes yet"} />
              )}
            </div>
          )}
        </div>
      </div>
      {
        showEdit && <ProfileModel setShowEdit={setShowEdit}/>
      }
    </div>
  ) : (
    <div className="flex justify-center items-center h-screen">Loading...</div>
  );
};

export default Profile

