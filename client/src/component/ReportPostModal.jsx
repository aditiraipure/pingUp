import { useState } from "react";
import { Flag, X } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import api from "../api/axios";

const reasons = ["Spam", "Nudity or Sexual Content", "Violence", "Hate Speech", "Harassment or Bullying", "False Information", "Scam or Fraud", "Intellectual Property Violation", "Other"];

const ReportPostModal = ({ postId, onClose }) => {
  const { getToken } = useAuth();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!reason) {
      toast.error("Please select a reason");
      return;
    }
    try {
      setSubmitting(true);
      const { data } = await api.post(`/api/post/${postId}/report`, { reason, details }, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (!data.success) throw new Error(data.message);
      toast.success("Thanks for your report. We'll review this content.");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[230] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
        <div className="relative border-b p-4 text-center">
          <h2 className="font-semibold text-slate-800">Report post</h2>
          <button type="button" onClick={onClose} aria-label="Close report dialog" className="absolute right-4 top-4"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto p-5">
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-500"><Flag className="h-4 w-4 text-red-500" /><span>Why are you reporting this post?</span></div>
          <div className="space-y-2">
            {reasons.map((item) => (
              <label key={item} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${reason === item ? "border-indigo-400 bg-indigo-50" : "border-slate-200"}`}>
                <input type="radio" name="report-reason" value={item} checked={reason === item} onChange={() => setReason(item)} className="accent-indigo-600" />
                <span className="text-slate-700">{item}</span>
              </label>
            ))}
          </div>
          <textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={1000} rows={3} className="mt-4 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400" placeholder="Additional details (optional)" />
        </div>
        <div className="flex justify-end gap-2 border-t p-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-600">Cancel</button>
          <button type="button" onClick={submit} disabled={submitting || !reason} className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">{submitting ? "Submitting..." : "Submit report"}</button>
        </div>
      </div>
    </div>
  );
};

export default ReportPostModal;
