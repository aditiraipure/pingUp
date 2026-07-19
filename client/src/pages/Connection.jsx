import { useNavigate } from "react-router-dom";

import {
  Check,
  Eye,
  Users,
  UserPlus,
  UserCheck,
  UserRoundPen,
  MessageSquare,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import {
  fetchConnections,
  markConnectionNotificationsRead,
  resolveFollowerRemoval,
  resolvePendingFollowRequest,
  resolveUnfollow,
} from "../features/connections/connectionSlice";
import { fetchUser } from "../features/userSlice";
import api from "../api/axios";
import { profileAvatar } from "../utils/profile";
import toast from "react-hot-toast";
import moment from "moment";

const Connection = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const dispatch = useDispatch();

  const {
    connections,
    pendingFollowRequests,
    followers,
    following,
    notificationCounts,
  } = useSelector((state) => state.connections);

  const [currentTab, setCurrentTab] = useState("Followers");
  const [actionId, setActionId] = useState("");

  const dataArray = [
    { label: "Followers", value: followers || [], icon: Users },
    { label: "Following", value: following || [], icon: UserCheck },
    {
      label: "Pending",
      value: pendingFollowRequests || [],
      icon: UserRoundPen,
      unread: notificationCounts?.pending || 0,
    },
    {
      label: "Connections",
      value: connections || [],
      icon: UserPlus,
      unread: notificationCounts?.connections || 0,
    },
  ];

  useEffect(() => {
    getToken().then((token) => {
      dispatch(fetchConnections(token));
    });
  }, [dispatch, getToken]);

  const markSectionRead = useCallback(async (label) => {
    const section = label === "Pending"
      ? "pending"
      : label === "Connections"
        ? "connections"
        : "";
    if (!section) return;
    const token = await getToken();
    dispatch(markConnectionNotificationsRead({ token, section }));
  }, [dispatch, getToken]);

  const selectTab = (label) => {
    setCurrentTab(label);
    markSectionRead(label);
  };

  useEffect(() => {
    if (
      (currentTab === "Pending" && notificationCounts?.pending > 0) ||
      (currentTab === "Connections" && notificationCounts?.connections > 0)
    ) {
      markSectionRead(currentTab);
    }
  }, [currentTab, markSectionRead, notificationCounts?.pending, notificationCounts?.connections]);

  const handleUnFollow = async (userId) => {
    if (actionId) return;
    setActionId(userId);
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/user/unfollow",
        { id: userId },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (data.success) {
        dispatch(resolveUnfollow({
          userId,
          connectionRemoved: data.connectionRemoved,
        }));
        toast.success(data.message);
        dispatch(fetchUser(token));
        dispatch(fetchConnections(token));
        window.dispatchEvent(new Event("profile-updated"));
        window.dispatchEvent(new Event("feed-refresh"));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setActionId("");
    }
  };

  const handleRemoveFollower = async (userId) => {
    if (actionId) return;
    setActionId(userId);
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/user/remove-follower",
        { id: userId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!data.success) throw new Error(data.message);
      dispatch(resolveFollowerRemoval({
        userId,
        connectionRemoved: data.connectionRemoved,
      }));
      toast.success("Follower removed successfully.");
      dispatch(fetchUser(token));
      dispatch(fetchConnections(token));
      window.dispatchEvent(new Event("profile-updated"));
      window.dispatchEvent(new Event("feed-refresh"));
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setActionId("");
    }
  };

  const respondToFollowRequest = async (request, action) => {
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
      dispatch(resolvePendingFollowRequest({
        requestId: request._id,
        requester: request.requester,
        accepted: action === "accept",
      }));
      if (action === "accept") {
        setCurrentTab("Connections");
        markSectionRead("Connections");
      }
      toast.success(action === "accept" ? "Connection accepted." : "Follow request declined.");
      dispatch(fetchConnections(token));
      window.dispatchEvent(new Event("profile-updated"));
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setActionId("");
    }
  };

  const emptyMessages = {
    Pending: "No Pending Requests",
    Connections: "No Connections Yet",
    Followers: "No Followers Yet",
    Following: "Not Following Anyone Yet",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Connections
          </h1>
          <p className="text-slate-600">
            Manage and explore your network and discover new connections.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-6">
          {dataArray.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center gap-1 border h-20 w-40 border-gray-200 bg-white shadow rounded-md cursor-pointer"
              onClick={() => selectTab(item.label)}
            >
              <b>{item.value.length}</b>
              <p className="relative text-slate-600">
                {item.label}
                {item.unread > 0 && (
                  <span className="absolute -right-5 -top-2 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                    {item.unread > 99 ? "99+" : item.unread}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>

        <div className="inline-flex flex-wrap items-center border border-gray-200 rounded-md p-1 bg-white shadow-sm">
          {dataArray.map((tab) => (
            <button
              onClick={() => selectTab(tab.label)}
              key={tab.label}
              className={`cursor-pointer flex items-center px-3 py-1 text-sm rounded-md transition-colors ${
                currentTab === tab.label
                  ? "bg-white font-medium text-black"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="ml-1">{tab.label}</span>
              {tab.unread > 0 && (
                <span className="ml-1.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                  {tab.unread > 99 ? "99+" : tab.unread}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex max-w-xl flex-col gap-3 mt-6">
          {(dataArray.find((item) => item.label === currentTab)?.value || []).length === 0 ? (
            <div className="w-full min-h-52 flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white text-center">
              <UserRoundPen className="w-10 h-10 text-indigo-400 mb-3" />
              <p className="font-medium text-slate-700">{emptyMessages[currentTab]}</p>
            </div>
          ) : (dataArray.find((item) => item.label === currentTab)?.value || []).map((item) => {
            const isFollowRequest = currentTab === "Pending";
            const isFollowing = currentTab === "Following";
            const isFollower = currentTab === "Followers";
            const isConnection = currentTab === "Connections";
            const user = isFollowRequest ? item.requester : item;
            return (
            <div
              key={isFollowRequest ? item._id : user._id}
              className="relative w-full gap-5 flex p-5 bg-white shadow rounded-md"
            >
              <img
                src={profileAvatar(user)}
                alt=""
                className="rounded-full w-12 h-12 object-cover shadow-md shrink-0"
              />
              {isFollowRequest && (
                <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      disabled={Boolean(actionId)}
                      onClick={() => respondToFollowRequest(item, "accept")}
                      className="min-h-9 px-3.5 py-1.5 text-sm rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white active:scale-95 transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      {actionId === item._id ? "Working..." : "Accept"}
                    </button>
                    <button
                      disabled={Boolean(actionId)}
                      onClick={() => respondToFollowRequest(item, "decline")}
                      className="min-h-9 px-3.5 py-1.5 text-sm rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 active:scale-95 transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      Decline
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    Requested {moment(item.requestedAt).fromNow()}
                  </p>
                </div>
              )}
              {isFollowing && (
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${user._id}`)}
                    aria-label={`View ${user.full_name} profile`}
                    className="size-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition cursor-pointer grid place-items-center"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    disabled={Boolean(actionId)}
                    onClick={() => handleUnFollow(user._id)}
                    className="min-h-9 px-3.5 py-1.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition cursor-pointer disabled:opacity-60"
                  >
                    {actionId === user._id ? "Unfollowing..." : "Unfollow"}
                  </button>
                </div>
              )}
              {isFollower && (
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${user._id}`)}
                    aria-label={`View ${user.full_name} profile`}
                    className="size-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition cursor-pointer grid place-items-center"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(actionId)}
                    onClick={() => handleRemoveFollower(user._id)}
                    className="min-h-9 px-3.5 py-1.5 text-sm rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-800 active:scale-95 transition cursor-pointer disabled:opacity-60"
                  >
                    {actionId === user._id ? "Removing..." : "Remove"}
                  </button>
                </div>
              )}
              {isConnection && (
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${user._id}`)}
                    aria-label={`View ${user.full_name} profile`}
                    className="size-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition cursor-pointer grid place-items-center"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/messages/${user._id}`)}
                    className="min-h-9 px-3.5 py-1.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message
                  </button>
                </div>
              )}
              <div className={`min-w-0 flex-1 ${
                isFollowRequest
                  ? "pt-16 sm:pt-0 sm:pr-52"
                  : isFollowing
                    ? "pt-12 sm:pt-0 sm:pr-40"
                    : isFollower
                      ? "pt-12 sm:pt-0 sm:pr-40"
                      : "pt-12 sm:pt-0 sm:pr-44"
              }`}>
                <p className="font-medium text-slate-700">{user.full_name}</p>
                <p className="text-slate-500">@{user.username}</p>
                {user.bio && (
                  <p className="text-sm text-slate-600">
                    {user.bio.slice(0, 48)}{user.bio.length > 48 ? "..." : ""}
                  </p>
                )}
                {typeof (user.is_online ?? user.online) === "boolean" && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <span className={`h-2 w-2 rounded-full ${
                      (user.is_online ?? user.online) ? "bg-emerald-500" : "bg-slate-300"
                    }`} />
                    {(user.is_online ?? user.online) ? "Online" : "Offline"}
                  </p>
                )}
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
  );
};

export default Connection;
