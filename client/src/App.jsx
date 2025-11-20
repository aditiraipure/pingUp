import React from "react";
import { Route, Routes } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";

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

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />

      <Routes>
        {/* Public route */}
        {!user && <Route path="/" element={<Login />} />}

        {/* Protected routes */}
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

        {/* Fallback: redirect unknown paths to Feed (optional) */}
        <Route path="*" element={user ? <Feed /> : <Login />} />
      </Routes>
    </>
  );
};

export default App;
