import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Download, FileArchive, FileCode, FileSpreadsheet, FileText, ImageIcon, Minus, Music, Paperclip, Plus, Presentation, SendHorizonal, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  addMessage,
  fetchMessages,
  markMessageFailed,
  replaceMessage,
  resetMessages,
} from "../features/messages/messagesSlice";
import PostCard from "../component/PostCard";
import StoryViewer from "../component/StoryViewer";
import { profileAvatar } from "../utils/profile";

const ChatBox = () => {
  const messages = useSelector((state) => state.messages.messages || []);
  const { userId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user: currentUser } = useUser();
  const dispatch = useDispatch();

  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [viewerImage, setViewerImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [postPreview, setPostPreview] = useState(null);
  const [storyPreview, setStoryPreview] = useState(null);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTyping = useSelector((state) => state.messages.typingByUser?.[userId]);

  const connections = useSelector((state) => state.connections.connections);

  const getAttachmentType = (message) => {
    if (message.media_mime_type?.startsWith("image/")) return "image";
    if (message.media_mime_type?.startsWith("video/")) return "video";
    if (message.media_mime_type?.startsWith("audio/")) return "audio";
    const fileName = `${message.media_name || ""} ${message.media_url || ""}`.split("?")[0].toLowerCase();
    if (/\.(jpe?g|png|webp|gif|avif|bmp|svg)$/.test(fileName)) return "image";
    if (/\.(mp4|webm|mov|m4v|ogg)$/.test(fileName)) return "video";
    if (/\.(mp3|wav|aac|m4a|flac)$/.test(fileName)) return "audio";
    if (message.message_type && message.message_type !== "text") return message.message_type;
    if (message.media_url) return "file";
    return "text";
  };

  const formatFileSize = (size) => {
    if (!size) return "";
    if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentKind = (name = "") => {
    const extension = name.split(".").pop()?.toLowerCase();
    if (extension === "pdf") return "pdf";
    if (["doc", "docx"].includes(extension)) return "word";
    if (["xls", "xlsx", "csv"].includes(extension)) return "sheet";
    if (["ppt", "pptx"].includes(extension)) return "presentation";
    if (["zip", "rar", "7z"].includes(extension)) return "archive";
    if (["js","ts","jsx","tsx","html","css","java","c","cpp","py","php","rb","go","rs","json","xml","sql","yml","yaml"].includes(extension)) return "code";
    return "document";
  };

  const DocumentIcon = ({ kind }) => {
    const iconProps = { size: 21, className: "text-purple-600 shrink-0" };
    if (kind === "sheet") return <FileSpreadsheet {...iconProps}/>;
    if (kind === "presentation") return <Presentation {...iconProps}/>;
    if (kind === "archive") return <FileArchive {...iconProps}/>;
    if (kind === "code") return <FileCode {...iconProps}/>;
    return <FileText {...iconProps}/>;
  };

  const openImageViewer = (message) => {
    setZoom(1);
    setViewerImage({ url: message.media_url, name: message.media_name || "Image attachment" });
  };

  const closeImageViewer = () => {
    setViewerImage(null);
    setZoom(1);
  };

  const downloadAttachment = async (url, fileName) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");
      const blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "attachment";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
      toast.error("Direct download was unavailable. The file was opened instead.");
    }
  };

  const selectAttachment = (attachment, isImagePicker = false) => {
    if (!attachment) return;
    const extension = `.${attachment.name.split(".").pop()?.toLowerCase()}`;
    const allowed = new Set([".jpg",".jpeg",".png",".webp",".gif",".svg",".avif",".bmp",".mp4",".mov",".avi",".mkv",".webm",".m4v",".mp3",".wav",".aac",".ogg",".m4a",".flac",".pdf",".doc",".docx",".xls",".xlsx",".csv",".ppt",".pptx",".txt",".zip",".rar",".7z",".json",".xml",".js",".ts",".jsx",".tsx",".html",".css",".java",".c",".cpp",".h",".hpp",".py",".php",".rb",".go",".rs",".sql",".md",".yml",".yaml"]);
    if (!allowed.has(extension)) return toast.error("This file type is not supported");
    if (attachment.size > 25 * 1024 * 1024) return toast.error("Attachments must be 25 MB or smaller");
    if (isImagePicker && !attachment.type.startsWith("image/")) return toast.error("Please select an image file");
    if (isImagePicker) { setImage(attachment); setFile(null); }
    else { setFile(attachment); setImage(null); }
  };

  const fetchUserMessages = async () => {
    try {
      const token = await getToken();
      await dispatch(fetchMessages({ token, userId }));
      window.dispatchEvent(new Event("recent-messages-updated"));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendMessage = async () => {
    let tempId;
    try {
      if ((!text.trim() && !image && !file) || sending) return;

      const token = await getToken();
      tempId = `temp-${Date.now()}`;
      const selectedAttachment = image || file;
      const optimisticType = selectedAttachment?.type.startsWith("image/") ? "image" : selectedAttachment?.type.startsWith("video/") ? "video" : selectedAttachment?.type.startsWith("audio/") ? "audio" : selectedAttachment ? "file" : "text";
      dispatch(addMessage({ _id: tempId, from_user_id: currentUser?.id, to_user_id: userId, message: text.trim(), message_type: optimisticType, media_url: selectedAttachment ? URL.createObjectURL(selectedAttachment) : "", media_name: selectedAttachment?.name, media_mime_type: selectedAttachment?.type, media_size: selectedAttachment?.size, delivery_status: "sending", createdAt: new Date().toISOString() }));
      setSending(true);
      setUploadProgress(0);
      const formData = new FormData();

      formData.append("to_user_id", userId);
      formData.append("message", text.trim());

      if (image) {
        formData.append("image", image);
      }
      if (file) formData.append("file", file);

      const { data } = await api.post("/api/message/send", formData, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: (event) => {
          if (event.total) setUploadProgress(Math.round((event.loaded * 100) / event.total));
        },
      });

      if (data.success) {
        setText("");
        setImage(null);
        setFile(null);
        dispatch(replaceMessage({ tempId, message: data.message }));
        window.dispatchEvent(new Event("recent-messages-updated"));
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      if (tempId) dispatch(markMessageFailed(tempId));
      toast.error(error.response?.data?.message || error.message || "Attachment upload failed");
    } finally {
      setSending(false);
      setUploadProgress(0);
    }
  };

  const handleTyping = async (value) => {
    setText(value);
    try {
      const token = await getToken();
      api.post("/api/message/typing", { to_user_id: userId, is_typing: true }, { headers: { Authorization: `Bearer ${token}` } });
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => api.post("/api/message/typing", { to_user_id: userId, is_typing: false }, { headers: { Authorization: `Bearer ${token}` } }), 1000);
    } catch { /* typing status must not block composing */ }
  };

  useEffect(() => {
    fetchUserMessages();
    return () => {
      dispatch(resetMessages());
    };
  }, [userId]);

  useEffect(() => {
    let active = true;
    const foundUser = connections.find((connection) => connection._id === userId);
    if (foundUser) {
      setUser(foundUser);
      return () => { active = false; };
    }

    const loadChatUser = async () => {
      try {
        const token = await getToken();
        const { data } = await api.post(
          "/api/user/profile",
          { profileId: userId },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (active && data.success) setUser(data.profile);
      } catch {
        if (active) setUser(null);
      }
    };
    loadChatUser();
    return () => { active = false; };
  }, [connections, getToken, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!viewerImage) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => event.key === "Escape" && closeImageViewer();
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [viewerImage]);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-2 p-2 md:px-10 xl:pl-42 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300">
        <button
          type="button"
          onClick={() => navigate(`/profile/${userId}`)}
          aria-label={`View ${user?.full_name || "user"} profile`}
          className="flex items-center gap-2 rounded-lg text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
        >
          <img
            src={profileAvatar(user)}
            alt={user?.full_name ? `${user.full_name}'s avatar` : "User avatar"}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-medium">{user?.full_name || "Loading profile..."}</p>
            {user?.username && <p className="text-sm text-gray-500 -mt-1.5">@{user.username}</p>}
            {isTyping && <p className="text-xs text-purple-600">typing...</p>}
          </div>
        </button>
      </div>

      {/* Messages */}
      <div className="p-5 md:px-10 h-full overflow-y-scroll flex-1">
        <div className="space-y-4 max-w-4xl mx-auto">
          {(messages || [])
            .slice()
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .map((message) => (
              <div
                key={message._id}
                className={`flex flex-col ${
                  (message.from_user_id?._id || message.from_user_id) ===
                  currentUser?.id
                    ? "items-end"
                    : "items-start"
                }`}
              >
                <div
                  className={`p-2 text-sm max-w-sm ${
                    getAttachmentType(message) === "image"
                      ? ""
                      : "bg-white shadow rounded-lg"
                  } text-slate-700`}
                >
                  {/*  Image */}
                  {getAttachmentType(message) === "image" && message.media_url && <div className="relative group w-fit max-w-[min(70vw,18rem)] overflow-hidden rounded-2xl bg-purple-50 shadow-sm"><button type="button" onClick={() => openImageViewer(message)} aria-label="Open image viewer" className="block cursor-zoom-in"><img src={message.media_url} alt={message.media_name || "Image attachment"} loading="lazy" className="block w-auto min-w-32 max-w-full h-auto max-h-72 object-contain rounded-2xl" /></button><button type="button" onClick={() => downloadAttachment(message.media_url, message.media_name || "image")} aria-label="Download image" className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white grid place-items-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"><Download size={15}/></button></div>}
                  {getAttachmentType(message) === "video" && message.media_url && <video src={message.media_url} controls preload="metadata" className="w-64 max-h-72 rounded-lg" />}
                  {getAttachmentType(message) === "audio" && message.media_url && <div className="w-64 rounded-xl border border-purple-100 bg-purple-50 p-3"><div className="flex items-center gap-2 mb-2"><Music size={18} className="text-purple-600"/><span className="text-xs font-medium truncate">{message.media_name || "Audio message"}</span></div><audio src={message.media_url} controls preload="metadata" className="w-full h-9" /></div>}
                  {getAttachmentType(message) === "file" && message.media_url && (() => { const kind = getDocumentKind(message.media_name); return <div className="w-60 rounded-lg border border-purple-100 bg-purple-50 p-2.5"><div className="flex items-center gap-2"><DocumentIcon kind={kind}/><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-700">{message.media_name || "Document"}</p><p className="text-[10px] text-slate-400">{formatFileSize(message.media_size)}{message.createdAt ? ` · ${new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</p></div></div><div className="mt-2 flex gap-2">{kind === "pdf" ? <button type="button" onClick={() => setDocumentPreview({ url: message.media_url, name: message.media_name })} className="flex-1 rounded-md bg-white px-2 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100">Preview</button> : <a href={message.media_url} target="_blank" rel="noreferrer" className="flex-1 rounded-md bg-white px-2 py-1.5 text-center text-xs font-medium text-purple-700 hover:bg-purple-100">Open</a>}<button type="button" onClick={() => downloadAttachment(message.media_url, message.media_name || "document")} className="w-8 rounded-md bg-purple-600 text-white grid place-items-center hover:bg-purple-700" aria-label="Download document"><Download size={14}/></button></div></div>; })()}

                  {/*  Text */}
                  {message.shared_story && (
                    <button type="button" onClick={() => setStoryPreview(message.shared_story)} className="block w-60 overflow-hidden rounded-xl border border-purple-100 bg-purple-50 text-left">
                      {message.shared_story.media_type === "image" && <img src={message.shared_story.media_url} alt="" className="w-full h-28 object-cover" />}
                      {message.shared_story.media_type === "video" && <video src={message.shared_story.media_url} muted preload="metadata" playsInline className="w-full h-28 object-cover" />}
                      {message.shared_story.media_type === "text" && <div className="w-full h-28 grid place-items-center p-3 text-center text-sm text-white" style={{ background: message.shared_story.background_color || "#4f46e5" }}>{message.shared_story.content}</div>}
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-slate-700">{message.shared_story.user?.full_name}</p>
                      </div>
                    </button>
                  )}
                  {message.shared_post && (
                    <button type="button" onClick={() => setPostPreview(message.shared_post)} className="block w-60 overflow-hidden rounded-xl border border-purple-100 bg-purple-50 text-left">
                      {message.shared_post.image_urls?.[0] && <img src={message.shared_post.image_urls[0]} alt="" className="w-full h-28 object-cover" />}
                      <div className="p-3">
                        <p className="text-xs font-semibold text-slate-700">{message.shared_post.user?.full_name || "Shared post"}</p>
                        <p className="mt-1 text-xs text-slate-500 truncate">{message.shared_post.content || "View post"}</p>
                      </div>
                    </button>
                  )}
                  {message.message && !["shared a post", "shared a story"].includes(message.message.trim().toLowerCase()) && <p>{message.message}</p>}
                  {(message.from_user_id?._id || message.from_user_id) === currentUser?.id && <p className="text-[10px] text-right text-slate-400 mt-1">{message.delivery_status || "sent"}</p>}
                </div>
              </div>
            ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-4">
        {(image || file) && <div className="max-w-xl mx-auto mb-2 flex items-center gap-3 rounded-xl border border-purple-100 bg-white p-2 shadow-sm">{image ? <img src={URL.createObjectURL(image)} alt="Selected attachment" className="w-12 h-12 rounded-lg object-cover" /> : <Paperclip className="w-6 h-6 text-purple-500" />}<div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-700 truncate">{(image || file).name}</p><p className="text-xs text-slate-400">{Math.ceil((image || file).size / 1024)} KB</p></div><button type="button" aria-label="Remove attachment" onClick={() => { setImage(null); setFile(null); }} className="text-slate-400 hover:text-red-500">×</button></div>}
        <div className="flex items-center gap-3 pl-5 p-1.5 bg-white w-full max-w-xl mx-auto border border-gray-200 shadow rounded-full mb-5">
          <input
            type="text"
            className="flex-1 outline-none text-slate-700"
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            onChange={(e) => handleTyping(e.target.value)}
            value={text}
          />

          <div className="relative"><button type="button" onClick={() => setShowEmoji((open) => !open)} className="text-xl">😊</button>{showEmoji && <div className="absolute bottom-10 right-0 bg-white border border-purple-100 shadow-lg rounded-xl p-2 flex gap-1">{["😀","😂","😍","👍","❤️","🎉"].map((emoji) => <button type="button" key={emoji} onClick={() => { setText((value) => value + emoji); setShowEmoji(false); }}>{emoji}</button>)}</div>}</div>

          <label htmlFor="image">
            {image ? (
              <img
                src={URL.createObjectURL(image)}
                alt="preview"
                className="h-8 rounded"
              />
            ) : (
              <ImageIcon className="w-7 h-7 text-gray-400 cursor-pointer" />
            )}
            <input
              type="file"
              id="image"
              accept="image/*"
              hidden
              onChange={(e) => selectAttachment(e.target.files?.[0], true)}
            />
          </label>
          <label htmlFor="file" className="cursor-pointer" aria-label="Attach file"><Paperclip className="w-6 h-6 text-gray-400"/><input type="file" id="file" hidden onChange={(e) => selectAttachment(e.target.files?.[0])} /></label>

          <button
            onClick={sendMessage}
            disabled={sending}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 cursor-pointer text-white p-2 rounded-full disabled:opacity-50"
          >
            <SendHorizonal size={18} />
          </button>
        </div>
        {sending && (image || file) && <div className="max-w-xl mx-auto -mt-3 mb-4"><div className="flex justify-between text-[10px] text-slate-500 mb-1"><span>Uploading attachment</span><span>{uploadProgress}%</span></div><div className="h-1.5 rounded-full bg-purple-100 overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all" style={{ width: uploadProgress + "%" }} /></div></div>}
      </div>
      {viewerImage && <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-[fadeIn_180ms_ease-out]" role="dialog" aria-modal="true" aria-label="Image viewer" onMouseDown={(event) => event.target === event.currentTarget && closeImageViewer()}><button type="button" onClick={closeImageViewer} aria-label="Close image viewer" className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/10 text-white grid place-items-center hover:bg-white/20 transition"><X size={24}/></button><div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-full bg-black/50 p-1.5 text-white"><button type="button" onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))} aria-label="Zoom out" className="w-9 h-9 rounded-full grid place-items-center hover:bg-white/15"><Minus size={18}/></button><span className="w-12 text-center text-xs">{Math.round(zoom * 100)}%</span><button type="button" onClick={() => setZoom((value) => Math.min(3, value + 0.25))} aria-label="Zoom in" className="w-9 h-9 rounded-full grid place-items-center hover:bg-white/15"><Plus size={18}/></button></div><div className="max-w-[95vw] max-h-[90vh] overflow-auto p-4" onMouseDown={(event) => event.stopPropagation()}><img src={viewerImage.url} alt={viewerImage.name} className="max-w-[90vw] max-h-[85vh] object-contain transition-transform duration-200 ease-out select-none" style={{ transform: "scale(" + zoom + ")" }} /></div></div>}
      {documentPreview && <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="PDF preview" onMouseDown={(event) => event.target === event.currentTarget && setDocumentPreview(null)}><div className="w-full max-w-5xl h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"><div className="p-3 border-b flex items-center justify-between"><p className="font-medium text-slate-700 truncate">{documentPreview.name || "PDF preview"}</p><button type="button" onClick={() => setDocumentPreview(null)} aria-label="Close PDF preview"><X/></button></div><iframe src={documentPreview.url} title={documentPreview.name || "PDF preview"} className="w-full flex-1" /></div></div>}
      {postPreview && <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto" role="dialog" aria-modal="true" aria-label="Shared post" onMouseDown={(event) => event.target === event.currentTarget && setPostPreview(null)}><button type="button" onClick={() => setPostPreview(null)} aria-label="Close shared post" className="fixed top-4 right-4 w-10 h-10 rounded-full bg-white text-slate-700 grid place-items-center shadow"><X /></button><PostCard post={postPreview} /></div>}
      {storyPreview && <StoryViewer viewStory={storyPreview} setViewStory={setStoryPreview} />}
    </div>
  );
};

export default ChatBox;
