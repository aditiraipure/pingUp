import React, { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import moment from "moment";
import StoryModel from "./StoryModel";
import StoryViewer from "./StoryViewer";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import { profileAvatar } from "../utils/profile";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

const StoriesBar = () => {
  const { getToken } = useAuth(); 
  const location = useLocation();
  const navigate = useNavigate();

  const [stories, setStories] = useState([]);
  const [showModel, setShowModel] = useState(false);
  const [viewStory, setViewStory] = useState(null);

  const fetchStories = useCallback(async () => {
    try {
      const token = await getToken();

      const { data } = await api.get("/api/story/get", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setStories(data.stories);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message); 
    }
  }, [getToken]);

  useEffect(() => {
    fetchStories();
    window.addEventListener("profile-updated", fetchStories);
    return () => window.removeEventListener("profile-updated", fetchStories);
  }, [fetchStories]);

  useEffect(() => {
    if (location.state?.openStoryComposer) {
      setShowModel(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  return (
    <div className="w-screen sm:w-[calc(100vw-240)] lg:max-w-2xl no-scrollbar overflow-x-auto px-4">
      <div className="flex gap-4 pb-5">
        {/* Add a story */}
        <div
          onClick={() => setShowModel(true)}
          className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl p-2 min-w-28 sm:min-w-32 max-w-28 sm:max-w-32 h-44 sm:h-48 flex flex-col items-center justify-center text-center cursor-pointer bg-white transition"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
            <Plus className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-xs font-semibold text-gray-800">Create story</p>
          <p className="text-[11px] text-gray-500 mt-1">Share a moment</p>
        </div>

        {/* Story items */}
        {stories.map((story, index) => (
          <div
            onClick={() => setViewStory(story)}
            key={story._id || index}
            className={`relative rounded-xl shadow min-w-28 sm:min-w-32 max-w-28 sm:max-w-32 h-44 sm:h-48 cursor-pointer overflow-hidden flex flex-col justify-between p-3 border-2 border-transparent hover:border-indigo-500 transition`}
            style={{ backgroundColor: story.background_color || "#374151" }}
          >
            {story.media_type === "image" && (
              <img
                src={story.media_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {story.media_type === "video" && (
              <video
                src={story.media_url}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            <div className="relative z-10 flex items-center gap-2">
              <img
                src={profileAvatar(story.user)}
                alt=""
                className="w-8 h-8 rounded-full border-2 border-white shadow"
              />
              <span className="text-white text-xs font-medium truncate drop-shadow">
                {story.user?.full_name?.split(" ")[0] || "User"}
              </span>
            </div>

            <div className="relative z-10">
              {story.content && (
                <p className="text-white text-xs line-clamp-2 drop-shadow font-medium">
                  {story.content}
                </p>
              )}
              <p className="text-white/80 text-[10px] mt-1 drop-shadow">
                {moment(story.createdAt).fromNow()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {showModel && (
        <StoryModel
          setShowModel={setShowModel}
          fetchStories={fetchStories}
        />
      )}

      {viewStory && (
        <StoryViewer
          viewStory={viewStory}
          setViewStory={setViewStory}
          fetchStories={fetchStories}
        />
      )}
    </div>
  );
};

export default StoriesBar;
