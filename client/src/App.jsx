import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { fetchUser } from "./features/userSlice.js";

// Pages
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Messages from "./pages/Messages";
import ChatBox from "./pages/ChatBox";
import Connection from "./pages/connection";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import CreatePost from "./pages/CreatePost";
import Layout from "./pages/Layout";


const App = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const dispatch = useDispatch();


  useEffect(() => {

    const fetchData = async () => {
        if (user) {
           const token = await getToken();
         dispatch(fetchUser(token));
        getToken().then((token) => console.log(token));
        }
    }
    fetchData();
  
  }, [user, getToken,dispatch]); 

  return (
    <>
      {/* 🔹 Toast notifications */}
      <Toaster position="top-right" reverseOrder={false} />

      <Routes>
        {/* 🔹 Public route (login page) */}
        {!user && <Route path="/" element={<Login />} />}

        {/* 🔹 Protected routes (only if user logged in) */}
        {user && (
          <Route path="/" element={<Layout />}>
            {/* Feed */}
            <Route index element={<Feed />} />
            <Route path="feed" element={<Feed />} />

            {/* Messages */}
            <Route path="messages" element={<Messages />} />
            <Route path="messages/:userId" element={<ChatBox />} />

            {/* Connections */}
            <Route path="connections" element={<Connection />} />

            {/* Discover */}
            <Route path="discover" element={<Discover />} />

            {/* Profile */}
            <Route path="profile" element={<Profile />} />
            <Route path="profile/:profileId" element={<Profile />} />

            {/* Create Post */}
            <Route path="create-post" element={<CreatePost />} />
          </Route>
        )}

        {/* 🔹 Fallback route */}
        <Route path="*" element={user ? <Feed /> : <Login />} />
      </Routes>
    </>
  );
};

export default App;
