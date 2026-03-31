import React, { useEffect, useRef } from "react";
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
import { addMessage } from "./features/messages/messagesSlice.js";
import Notification from "./component/Notification";

const App = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { pathname } = useLocation();
  const pathnameRef = useRef(pathname);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const token = await getToken();
        dispatch(fetchUser(token));
        dispatch(fetchConnections(token));
      }
    };
    fetchData();
  }, [user, getToken, dispatch]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (user) {
      const eventSource = new EventSource(
        import.meta.env.VITE_BASEURL + "/api/message/" + user.id,
      );

     eventSource.onmessage = (event) => {
       const message = JSON.parse(event.data);

       if (
         message?.from_user_id?._id &&
         pathnameRef.current === "/messages/" + message.from_user_id._id
       ) {
         dispatch(addMessage(message));
       } else {
         toast.custom((t) => <Notification t={t} message={message} />, {
           position: "bottom-right",
         });
       }
     };

      return () => {
        eventSource.close();
      };
    }
  }, [user, dispatch]);

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
          </Route>
        )}

        <Route path="*" element={user ? <Feed /> : <Login />} />
      </Routes>
    </>
  );
};

export default App;
