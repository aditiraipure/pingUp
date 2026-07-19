import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Check, UserRoundPlus, X } from "lucide-react";
import moment from "moment";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import api from "../api/axios";
import {
  fetchConnections,
  markConnectionNotificationsRead,
} from "../features/connections/connectionSlice";
import { fetchUser } from "../features/userSlice";
import { profileAvatar } from "../utils/profile";

const FollowRequests = () => {
  const { getToken } = useAuth();
  const dispatch = useDispatch();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

  const loadRequests = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const { data } = await api.get("/api/user/follow-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.message);
      setRequests(data.requests || []);
      dispatch(markConnectionNotificationsRead({ token, section: "pending" }));
    } catch (requestError) {
      const message = requestError.response?.data?.message || requestError.message;
      if (!silent) setError(message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [dispatch, getToken]);

  useEffect(() => {
    loadRequests();
    const intervalId = window.setInterval(() => loadRequests({ silent: true }), 15000);
    const refresh = () => loadRequests({ silent: true });
    window.addEventListener("follow-request-received", refresh);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("follow-request-received", refresh);
    };
  }, [loadRequests]);

  const respond = async (request, action) => {
    if (actionId) return;
    setActionId(request._id);
    try {
      const token = await getToken();
      const { data } = await api.post(
        `/api/user/follow-request/${action}`,
        { requestId: request._id },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!data.success) throw new Error(data.message);

      setRequests((current) => current.filter((item) => item._id !== request._id));
      dispatch(fetchUser(token));
      dispatch(fetchConnections(token));
      window.dispatchEvent(new Event("profile-updated"));
      toast.success(action === "accept" ? "Connection accepted." : "Follow request declined.");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || requestError.message);
    } finally {
      setActionId("");
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white p-6 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Follow Requests</h1>
          <p className="mt-2 text-slate-600">Choose who can follow your PingUp activity.</p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
          {loading ? (
            <div className="space-y-4 p-5">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : error ? (
            <div className="p-10 text-center">
              <p className="font-medium text-slate-800">Unable to load follow requests</p>
              <p className="mt-1 text-sm text-slate-500">{error}</p>
              <button type="button" onClick={() => loadRequests()} className="mt-5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-sm font-medium text-white">
                Retry
              </button>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center p-10 text-center">
              <span className="grid h-20 w-20 place-items-center rounded-full bg-indigo-50 text-indigo-600">
                <UserRoundPlus className="h-9 w-9" />
              </span>
              <h2 className="mt-5 text-lg font-semibold text-slate-800">No Follow Requests</h2>
              <p className="mt-1 text-sm text-slate-500">New follow requests will appear here.</p>
            </div>
          ) : (
            requests.map((request, index) => (
              <div key={request._id} className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center ${index < requests.length - 1 ? "border-b border-slate-100" : ""}`}>
                <img src={profileAvatar(request.requester)} alt={request.requester.full_name} className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-indigo-100" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800">{request.requester.full_name}</p>
                  <p className="truncate text-sm text-slate-500">@{request.requester.username}</p>
                  <p className="mt-1 text-xs text-slate-400">{moment(request.requestedAt).fromNow()}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" disabled={Boolean(actionId)} onClick={() => respond(request, "accept")} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-medium text-white transition active:scale-95 disabled:opacity-60">
                    <Check className="h-4 w-4" /> {actionId === request._id ? "Working..." : "Accept"}
                  </button>
                  <button type="button" disabled={Boolean(actionId)} onClick={() => respond(request, "decline")} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:opacity-60">
                    <X className="h-4 w-4" /> Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowRequests;
