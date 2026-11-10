import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { fetchUser } from "./features/userSlice.js";

// Layout & Core
import Layout from "./pages/Layout";
import Loading from "./component/Loading";
import Notification from "./component/Notification";

// Lazy-loaded Pages (Code Splitting)
const Login = lazy(() => import("./pages/Login"));
const Feed = lazy(() => import("./pages/Feed"));
const Messages = lazy(() => import("./pages/Messages"));
const ChatBox = lazy(() => import("./pages/ChatBox"));
const Connection = lazy(() => import("./pages/Connection.jsx"));
const Discover = lazy(() => import("./pages/Discover"));
const Profile = lazy(() => import("./pages/Profile"));
const CreatePost = lazy(() => import("./pages/CreatePost"));
const Appearance = lazy(() => import("./pages/Appearance"));
const Settings = lazy(() => import("./pages/Settings"));
const Archive = lazy(() => import("./pages/Archive"));
const FollowRequests = lazy(() => import("./pages/FollowRequests"));

import { fetchConnections } from "./features/connections/connectionSlice.js";
import { addMessage, fetchUnreadMessageCounts, incrementUnread, markChatRead, markMessagesSeen, setTyping } from "./features/messages/messagesSlice.js";
import api from "./api/axios.js";

const App = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { pathname } = useLocation();
  const pathnameRef = useRef(pathname);
  const dispatch = useDispatch();
  const [initialDataReady, setInitialDataReady] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      if (!isLoaded) return;
      if (user) {
        setInitialDataReady(false);
        const token = await getToken();
        await Promise.all([
          dispatch(fetchUser(token)),
          dispatch(fetchConnections(token)),
          dispatch(fetchUnreadMessageCounts(token)),
        ]);
      }
      if (active) setInitialDataReady(true);
    };
    fetchData();
    return () => { active = false; };
  }, [user, isLoaded, getToken, dispatch]);

  useEffect(() => {
    if (!user) return;
    const refreshProfileData = async () => {
      const token = await getToken();
      dispatch(fetchUser(token));
      dispatch(fetchConnections(token));
      window.dispatchEvent(new Event("recent-messages-updated"));
    };
    window.addEventListener("profile-updated", refreshProfileData);
    return () => window.removeEventListener("profile-updated", refreshProfileData);
  }, [user, getToken, dispatch]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (user) {
      const baseUrl = import.meta.env.VITE_BASEURL || "";
      if (!baseUrl) {
        console.warn("VITE_BASEURL is not configured; realtime updates are disabled.");
        return;
      }

      const eventSource = new EventSource(
        baseUrl.replace(/\/$/, "") + "/api/message/events/" + user.id,
      );

      eventSource.onmessage = async (event) => {
        const realtimeEvent = JSON.parse(event.data);
        if (realtimeEvent.type === "connected") return;
        if (realtimeEvent.type === "follow_request") {
          const requester = realtimeEvent.payload?.fromUser;
          const token = await getToken();
          dispatch(fetchConnections(token));
          toast.success(`${requester?.full_name || "Someone"} requested to follow you.`);
          window.dispatchEvent(new CustomEvent("follow-request-received", { detail: realtimeEvent.payload }));
          return;
        }
        if (realtimeEvent.type === "follow_request_updated") {
          const token = await getToken();
          dispatch(fetchUser(token));
          dispatch(fetchConnections(token));
          window.dispatchEvent(new CustomEvent("follow-status-updated", { detail: realtimeEvent.payload }));
          toast.success(realtimeEvent.payload?.status === "accepted" ? "Connection accepted." : "Your follow request was declined.");
          return;
        }
        if (realtimeEvent.type === "follow_relationship_removed") {
          const token = await getToken();
          dispatch(fetchUser(token));
          dispatch(fetchConnections(token));
          window.dispatchEvent(new CustomEvent("follow-relationship-removed", { detail: realtimeEvent.payload }));
          window.dispatchEvent(new Event("profile-updated"));
          window.dispatchEvent(new Event("feed-refresh"));
          return;
        }
        if (realtimeEvent.type === "typing") {
          dispatch(setTyping({ userId: realtimeEvent.payload.from_user_id, isTyping: realtimeEvent.payload.is_typing }));
          return;
        }
        if (realtimeEvent.type === "seen") {
          dispatch(markMessagesSeen(realtimeEvent.payload.messageIds || []));
          return;
        }
        const message = realtimeEvent.type === "message" ? realtimeEvent.payload : realtimeEvent;
        const senderId = message?.from_user_id?._id || message?.from_user_id;
        window.dispatchEvent(new Event("recent-messages-updated"));

        if (
          senderId &&
          pathnameRef.current === "/messages/" + senderId
        ) {
          dispatch(addMessage(message));
          dispatch(markChatRead(senderId));
          const token = await getToken();
          api.post(
            "/api/message/read",
            { other_user_id: senderId },
            { headers: { Authorization: `Bearer ${token}` } },
          ).catch(() => dispatch(fetchUnreadMessageCounts(token)));
        } else {
          if (senderId) dispatch(incrementUnread(senderId));
          toast.custom((t) => <Notification t={t} message={message} />, {
            position: "bottom-right",
          });
        }
      };

      return () => {
        eventSource.close();
      };
    }
  }, [user, dispatch, getToken]);

  if (!isLoaded || (user && !initialDataReady)) {
    return <Loading />;
  }

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />

      <Suspense fallback={<Loading />}>
        <Routes>
          {!user && <Route path="/" element={<Login />} />}

          {user && (
            <Route path="/" element={<Layout />}>
              <Route index element={<Feed />} />
              <Route path="feed" element={<Feed />} />

              <Route path="messages" element={<Messages />} />
              <Route path="messages/:userId" element={<ChatBox />} />

              <Route path="connections" element={<Connection />} />

              <Route path="discover" element={<Discover />} />

              <Route path="profile" element={<Profile />} />
              <Route path="profile/:profileId" element={<Profile />} />

              <Route path="create-post" element={<CreatePost />} />
              <Route path="appearance" element={<Appearance />} />
              <Route path="settings" element={<Settings />} />
              <Route path="archive" element={<Archive />} />
              <Route path="follow-requests" element={<FollowRequests />} />
            </Route>
          )}

          <Route path="*" element={user ? <Feed /> : <Login />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
