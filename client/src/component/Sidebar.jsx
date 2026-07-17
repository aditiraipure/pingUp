import { Link, useNavigate } from "react-router-dom";
import MenuItems from "./MenuItems";
import { assets } from "../assets/assets";
import { CirclePlus, LogOut } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { useSelector } from "react-redux";

const Sidebar = ({ sideBarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const { signOut } = useClerk();

  return (
    <div
      className={`w-60 xl:w-72 bg-white border-r border-gray-200  flex flex-col justify-between items-center max:sm:absolute top-0 bottom-0 z-20 ${
        sideBarOpen ? "translate-x-0" : "max-sm:translate-x-full"
      } transition-all duration-300 ease-in-out`}
    >
      <div className="w-full">
        <img
          onClick={() => navigate("/")}
          src={assets.logo}
          alt="Logo"
          className="w-26 ml-7 my-2 cursor-pointer"
        />
        <hr className="border-gray-300 mb-8" />

        <MenuItems setSidebarOpen={setSidebarOpen}></MenuItems>
        <Link
          to="/create-post"
          className="flex items-center justify-center gap-2 py-2 mt-6 mx-6 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-800 active:scale-95 transition cursor-pointer"
          onClick={() => setSidebarOpen(false)}
        >
          <CirclePlus className="w-5 h-5" />
          Create Post
        </Link>
      </div>

      <div className="w-full border-t border-gray-200 p-4 px-7 flex items-center justify-between">
        <div onClick={() => navigate(`/profile/${user._id}`)} className="flex gap-2 items-center cursor-pointer min-w-0">
          <div className="relative shrink-0"><img src={user.profile_picture || assets.sample_profile} alt={user.full_name || "Profile"} className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-100" /><span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" /></div>

          <div>
            <h1 className="text-sm font-medium truncate">{user.full_name}</h1>
            <p className="text-xs text-gray-500">@{user.username}</p>
          </div>
        </div>

        <LogOut
          className="w-4.5 text-gray-400 hover:text-gray-700 transition cursor-pointer"
          onClick={signOut}
        />
      </div>
    </div>
  );
};

export default Sidebar;
