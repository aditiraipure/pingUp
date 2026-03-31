import React, { useEffect, useState } from "react";
// import { dummyConnectionsData } from "../assets/assets";
import { Search } from "lucide-react";
import UserCard from "../component/UserCard";
import Loading from "../component/Loading";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { fetchUser } from "../features/userSlice.js";

const Discover = () => {
  const [input, setInput] = useState("");
  const [user, setUser] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();
  const dispatch = useDispatch();

  const handelSearch = (e) => {
    if (e.key === "Enter") {
      (async () => {
        try {
          setUser([]);
          setLoading(true);

          const token = await getToken();

          const { data } = await api.post(
            `/api/user/discover`,
            { input },
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          data.success ? setUser(data.users) : toast.error(data.message);

          setInput("");
        } catch (error) {
          toast.error(error.message);
        } finally {
          setLoading(false);
        }
      })();
    }
  };

  useEffect(() => {
    getToken().then((token) => {
      dispatch(fetchUser(token));
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Discover People
          </h1>
          <p className="text-slate-600">
            Connect with amazing people and grow your network
          </p>
        </div>

        {/* Search */}
        <div className="mb-8 shadow-md rounded-md border border-slate-200/60 bg-white/80">
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search with Meta AI"
                className="pl-10 sm:pl-12 py-2 w-full border border-gray-300 rounded-md max-sm:text-sm"
                onChange={(e) => setInput(e.target.value)}
                value={input}
                onKeyUp={handelSearch}
              />
            </div>
          </div>
        </div>

        {/* User Cards */}
        <div className="flex flex-wrap gap-6">
          {user.map((user) => (
            <UserCard user={user} key={user._id} />
          ))}
        </div>

        {/* Loading */}
        {loading && <Loading height="60vh" />}
      </div>
    </div>
  );
};

export default Discover;
