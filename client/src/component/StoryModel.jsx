import React, { useState } from "react";
import { ArrowLeft, Upload, Type as TextIcon, Sparkle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";

const StoryModel = ({ setShowModel, fetchStories }) => {
  const [mode, setMode] = useState("text");
  const [background, setBackground] = useState("");
  const [text, setText] = useState("");
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  const { getToken } = useAuth();

  const MAX_VIDEO_DURATION = 60;
  const MAX_VIDEO_SIZE_MB = 50;

 const bgGradients = [
   "linear-gradient(to right, #a5b4fc, #c4b5fd)", // soft lavender-blue
   "linear-gradient(to right, #fbcfe8, #fde68a)", // pastel pink-yellow
   "linear-gradient(to right, #bbf7d0, #bfdbfe)", // mint blue
   "linear-gradient(to right, #fecaca, #fed7aa)", // soft peach
   "linear-gradient(to right, #e9d5ff, #fbcfe8)", // lilac pink
   "linear-gradient(to right, #fde68a, #bbf7d0)", // soft yellow green
   "linear-gradient(to right, #cffafe, #bfdbfe)", // aqua blue
   "linear-gradient(to right, #fcd5ce, #fbcfe8)", // blush pink
   "linear-gradient(to right, #d9f99d, #bbf7d0)", // light green
   "linear-gradient(to right, #fde68a, #fecaca)", // warm pastel
 ];

  const handleMediaUpload = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      if (file.type.startsWith("video")) {
        if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
          toast.error(`video file size cannot exceed ${MAX_VIDEO_SIZE_MB} MB`);
          setMedia(null);
          setMediaPreview(null);
          return;
        }

        const video = document.createElement("video");
        video.preload = "metadata";

        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);

          if (video.duration > MAX_VIDEO_DURATION) {
            toast.error("video duration cannot exceed 1 min");
            setMedia(null);
            setMediaPreview(null);
          } else {
            setMedia(file);
            setMediaPreview(URL.createObjectURL(file));
            setText("");
            setMode("media");
          }
        };

        video.src = URL.createObjectURL(file);
      } else if (file.type.startsWith("image")) {
        setMedia(file);
        setMediaPreview(URL.createObjectURL(file));
        setText("");
        setMode("media");
      }
    }
  };

  const handleCreateStory = async () => {
    const media_type =
      mode === "media"
        ? media?.type.startsWith("image")
          ? "image"
          : "video"
        : "text";

    if (media_type === "text" && !text) {
      throw new Error("please enter some text");
    }

    let formData = new FormData();
    formData.append("content", text);
    formData.append("media_type", media_type);
    formData.append("media", media);
    formData.append("background_color", background);

    const token = await getToken();

    try {
      const { data } = await api.post("/api/story/create", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setShowModel(false);
        toast.success("Story uploaded!");
        fetchStories();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md rounded-2xl shadow-2xl border border-gray-700 overflow-hidden bg-gradient-to-br from-gray-500 to-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800">
          <button
            onClick={() => setShowModel(false)}
            className="text-gray-300 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700"
          >
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-lg font-bold text-white tracking-wide">
            Create a New Story
          </h2>
          <span className="w-8" />
        </div>

        {/* Preview */}
        <div
          className="rounded-xl mt-6 mx-6 mb-4 h-64 flex items-center justify-center relative transition-all duration-300 overflow-hidden"
          style={{
            background:
              mode === "text" ? background || bgGradients[0] : "transparent",
          }}
        >
          {mode === "text" && (
            <textarea
              className="bg-transparent text-white w-full h-full p-6 text-xl font-medium resize-none focus:outline-none placeholder-gray-200"
              placeholder="What do you want to share?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={300}
              style={{ minHeight: "10rem" }}
            />
          )}

          {mode === "media" &&
            mediaPreview &&
            (media?.type.startsWith("image") ? (
              <img
                src={mediaPreview}
                alt="preview"
                className="object-cover w-full h-full"
              />
            ) : (
              <video
                src={mediaPreview}
                controls
                className="object-cover w-full h-full"
              />
            ))}
        </div>

        {/* Background options */}
        {mode === "text" && (
          <div className="flex mt-8 gap-2 px-6 pb-6 flex-wrap">
            {bgGradients.map((gradient) => (
              <button
                key={gradient}
                className={`w-6 h-6 rounded-full ring-2 ${
                  background === gradient ? "ring-white" : "ring-gray-300"
                } cursor-pointer`}
                style={{ background: gradient }}
                onClick={() => setBackground(gradient)}
              />
            ))}
          </div>
        )}

        {/* Mode switch */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => {
              setMode("text");
              setMedia(null);
              setMediaPreview(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1 p-2 ml-2 rounded cursor-pointer ${
              mode === "text" ? "bg-white text-black" : "bg-zinc-800 text-white"
            }`}
          >
            <TextIcon size={16} />
            Text
          </button>

          <label
            className={`flex-1 flex items-center justify-center gap-2 p-2 mr-2 rounded cursor-pointer ${
              mode === "media"
                ? "bg-white text-black"
                : "bg-zinc-800 text-white"
            }`}
          >
            <input
              onChange={handleMediaUpload}
              type="file"
              accept="image/*,video/*"
              className="hidden"
            />
            <Upload size={18} /> Photos/Videos
          </label>
        </div>

        {/* Submit */}
        <button
          onClick={() =>
            toast.promise(handleCreateStory(), {
              loading: "Saving..",
            })
          }
          className="flex items-center justify-center gap-2 text-white py-3 px-6 m-4 mx-auto rounded bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-600 active:scale-95 transition cursor-pointer"
        >
          <Sparkle size={18} /> Create Story
        </button>
      </div>
    </div>
  );
};

export default StoryModel;
