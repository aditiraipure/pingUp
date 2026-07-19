import React, { useEffect, useRef, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { fetchUser } from "./features/userSlice.js";

// Pages
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Messages from "./pages/Messages";
import ChatBox from "./pages/ChatBox";
import Connection from "./pages/Connection.jsx";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import CreatePost from "./pages/CreatePost";
import Layout from "./pages/Layout";
import { fetchConnections } from "./features/connections/connectionSlice.js";
import { addMessage, fetchUnreadMessageCounts, incrementUnread, markChatRead, markMessagesSeen, setTyping } from "./features/messages/messagesSlice.js";
import api from "./api/axios.js";
import Notification from "./component/Notification";
import Loading from "./component/Loading";
import Appearance from "./pages/Appearance";
import Settings from "./pages/Settings";
import Archive from "./pages/Archive";
import FollowRequests from "./pages/FollowRequests";

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
      const eventSource = new EventSource(
        import.meta.env.VITE_BASEURL + "/api/message/events/" + user.id,
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
    </>
  );
};

export default App;
