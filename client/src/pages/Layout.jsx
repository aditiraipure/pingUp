import { dummyUserData } from "../assets/assets";
import { Outlet } from "react-router-dom";
import { X, Menu } from "lucide-react";
import Loading from "../component/Loading";
import Sidebar from "../component/Sidebar";
import { useState } from "react";
import React from "react";

const Layout = () => {
  const user = dummyUserData;
  const [sideBarOpen, setSidebarOpen] = useState(false);

  return user ? (
    <div className="w-full flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar sideBarOpen={sideBarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex-1 bg-slate-50 overflow-y-auto">
        <Outlet />
      </div>

      {/* Mobile toggle button */}
      {sideBarOpen ? (
        <X
          className="absolute top-4 right-4 p-2 z-50 bg-white rounded-md shadow w-10 h-10 text-gray-600 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : (
        <Menu
          className="absolute top-4 right-4 p-2 z-50 bg-white rounded-md shadow w-10 h-10 text-gray-600 sm:hidden"
          onClick={() => setSidebarOpen(true)}
        />
      )}
    </div>
  ) : (
    <Loading />
  );
};

export default Layout;
