import { EyeOff, Flag, MoreVertical, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import ReportPostModal from "./ReportPostModal";

const OtherPostOptions = ({ post, onNotInterested }) => {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [hiding, setHiding] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (event) => !menuRef.current?.contains(event.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const hidePost = async () => {
    if (hiding) return;
    try {
      setHiding(true);
      const { data } = await api.post(`/api/post/${post._id}/not-interested`, {}, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (!data.success) throw new Error(data.message);
      toast.success("Thanks for your feedback.");
      setOpen(false);
      onNotInterested();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      setHiding(false);
    }
  };

  return (
    <div ref={menuRef} className="relative ml-auto" onClick={(event) => event.stopPropagation()}>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label="More post options" aria-expanded={open} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><MoreVertical className="h-5 w-5" /></button>
      {open && <>
        <div className="fixed inset-0 z-[215] bg-black/35 sm:hidden" onClick={() => setOpen(false)} />
        <div className="fixed inset-x-0 bottom-0 z-[220] rounded-t-2xl bg-white p-2 pb-5 shadow-2xl sm:absolute sm:inset-auto sm:right-0 sm:top-10 sm:w-64 sm:rounded-xl sm:pb-2">
          <div className="flex items-center justify-between px-3 py-2 sm:hidden"><span className="font-semibold text-slate-800">Post options</span><button type="button" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button></div>
          <button type="button" onClick={hidePost} disabled={hiding} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"><EyeOff className="h-5 w-5" /><span>{hiding ? "Hiding..." : "Not Interested"}</span></button>
          <button type="button" onClick={() => { setOpen(false); setReporting(true); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-red-600 hover:bg-red-50"><Flag className="h-5 w-5" /><span>Report</span></button>
        </div>
      </>}
      {reporting && <ReportPostModal postId={post._id} onClose={() => setReporting(false)} />}
    </div>
  );
};

export default OtherPostOptions;
