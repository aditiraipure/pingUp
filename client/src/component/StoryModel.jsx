import React, { useState } from "react";
import { ArrowLeft, Upload, Type as TextIcon, Sparkle } from "lucide-react";
import toast from "react-hot-toast";


const StoryModel = ({ setShowModel, fetchStories }) => {
  const [mode, setMode] = useState("text");
  const [background, setBackground] = useState("");
  const [text, setText] = useState("");
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  const bgGradients = [
    "linear-gradient(to right, #6366f1, #8b5cf6)", // Indigo → Purple
    "linear-gradient(to right, #ec4899, #facc15)", // Pink → Yellow
    "linear-gradient(to right, #22c55e, #3b82f6)", // Green → Blue
    "linear-gradient(to right, #f43f5e, #f97316)", // Red → Orange
    "linear-gradient(to right, #f472b6, #9333ea)", // Pink → Purple
    "linear-gradient(to right, #facc15, #16a34a)", // Yellow → Green
    "linear-gradient(to right, #06b6d4, #3b82f6)", // Cyan → Blue
    "linear-gradient(to right, #f87171, #fb7185)", // Red → Pink
    "linear-gradient(to right, #a3e635, #22c55e)", // Lime → Green
    "linear-gradient(to right, #f59e0b, #ef4444)", // Orange → Red
  ];

  const handleMediaUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMedia(file);
      setMediaPreview(URL.createObjectURL(file));
      setMode("media");
    }
  };

  const handleCreateStory = async () => {
    console.log({ mode, text, media, background });
    fetchStories?.();
    setShowModel(false);
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md rounded-2xl shadow-2xl border border-gray-700 overflow-hidden bg-gradient-to-br from-gray-500 to-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800">
          <button
            onClick={() => setShowModel(false)}
            className="text-gray-300 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700"
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-lg font-bold text-white tracking-wide">
            Create a New Story
          </h2>
          <span className="w-8" />
        </div>

        {/* Story Preview */}
        <div
          className="rounded-xl mt-6 mx-6 mb-4 h-64 flex items-center justify-center relative transition-all duration-300 overflow-hidden"
          style={{
            background:
              mode === "text" ? background || bgGradients[0] : "transparent",
            backgroundSize: "cover",
            backgroundPosition: "center",
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
                alt="Media Preview"
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

        {/* Gradient Buttons */}
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

        {/* Mode Switch */}
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

        <button onClick={()=> toast.promise(handleCreateStory(),{
          loading : 'Saving..',
          success: <p>Story Added</p>,
          error : e=> <p>{e.message}</p>,
        })} className="flex items-center justify-center gap-2 text-white py-3 px-6 m-4 mx-auto rounded bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-600 active:scale-95 transition cursor-pointer">
          <Sparkle size={18} /> Create Story
        </button>
      </div>
    </div>
  );
};

export default StoryModel;
