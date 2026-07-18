import { BadgeCheck, Send, Share2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import SharePostModal from "./SharePostModal";
import { profileAvatar } from "../utils/profile";

const StoryViewer = ({viewStory, setViewStory}) => {

  const [progress ,setProgress] = useState(0);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const { getToken } = useAuth();

  useEffect(() => {
    let timer , progressInterval;
    if(viewStory && viewStory.media_type !== 'video'){
      setProgress(0)
      const duration = 15000;
      const setTime= 100;
      let elapsed =0;

     progressInterval =  setInterval(() => {
        elapsed += setTime
        setProgress((elapsed / duration)*100);
      }, setTime);

      timer = setTimeout(() => {
        setViewStory(null);
      },duration );
    }
    return ()=>{
      clearTimeout(timer)
      clearInterval(progressInterval)
    }
  }, [viewStory, setViewStory]);

  const handleClose = ()=>{
    setViewStory(null)
  }

  const sendReply = async () => {
    if (!reply.trim() || sending) return;
    try {
      setSending(true);
      const formData = new FormData();
      formData.append("to_user_id", viewStory.user?._id || viewStory.user);
      formData.append("message", reply.trim());
      formData.append("shared_story_id", viewStory._id);
      const { data } = await api.post("/api/message/send", formData, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (!data.success) throw new Error(data.message);
      setReply("");
      setSent(true);
      window.dispatchEvent(new Event("recent-messages-updated"));
      setTimeout(() => setSent(false), 2000);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const renderContent = ()=>{
    switch (viewStory.media_type) {
      case "image":
        return (
          <img
            src={viewStory.media_url}
            alt=""
            className="max-w-full max-h-screen object-contain"
          />
        );
      case "video":
        return (
          <video
            onEnded={() => setViewStory(null)}
            src={viewStory.media_url}
            className="max-h-screen" controls autoPlay
          />
        );
      case "text":
        return (
          <div className="w-full h-full flex items-center justify-center p-8 text-white text-2xl  text-center">
          {viewStory.content}
   </div>
        );
        default:
          return null;
    }
  }
  return (
    <div
      className="fixed inset-0 h-screen bg-black bg-opacity-90 z-110 flex items-center justify-center"
      style={{
        background:
          viewStory.media_type === "text"
            ? viewStory.background_color
            : "#000000",
      }}
    >
      {/* progress bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-700">
        <div
          className="h-full bg-white transition-all duration-100 linear"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      {/* user info */}
      <div className="absolute top-4 left-4 items-center space-x-3 p-2 px-4 sm:p-4 sm:px-8 backdrop-blur-2xl rounded bg-black/50">
        <img
          src={profileAvatar(viewStory.user)}
          alt=""
          className="size-7 sm:size-8 rounded-full object-cover border border-white"
        />
        <div className="text-white font-medium flex items-center gap-1.5">
          <span>{viewStory.user?.full_name}</span>
          <BadgeCheck size={18} />
        </div>
      </div>

      {/* close buitton */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-white text-3xl font-bold focus:outline-none"
      >
        <X className="w-8 h-8 hover:scale-110 trasition cursor-pointer" />
      </button>

      {/* story wrapper */}
      <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        {renderContent()}
      </div>
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[min(92vw,34rem)]">
        {sent && <p className="mb-2 text-center text-sm text-white">Message sent</p>}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center rounded-full border border-white/50 bg-black/40 backdrop-blur px-4">
            <input
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && sendReply()}
              placeholder="Reply to story..."
              className="w-full bg-transparent py-3 text-sm text-white placeholder:text-white/70 outline-none"
            />
            <button type="button" onClick={sendReply} disabled={sending || !reply.trim()} aria-label="Send story reply" className="text-white disabled:opacity-50">
              <Send className="w-5 h-5" />
            </button>
          </div>
          <button type="button" onClick={() => setShowShare(true)} aria-label="Share story" className="w-11 h-11 shrink-0 rounded-full border border-white/50 bg-black/40 text-white grid place-items-center backdrop-blur">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      {showShare && <SharePostModal story={viewStory} onClose={() => setShowShare(false)} />}
    </div>
  );
}
export default StoryViewer
