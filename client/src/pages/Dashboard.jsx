import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/context/AuthContext";
import { LogOut } from "lucide-react";

import ai from "../assets/ai.png";

const Dashboard = () => {
  const { logoutUser } = useAuth();
  const navigate = useNavigate();

  const [selected, setSelected] = useState();

  useEffect(() => {
    const selected = localStorage.getItem("selected");
    if (selected) {
      setSelected(selected);
    }
  }, []);

  const handleHomeClick = () => {
    navigate("/");
  };

  const handleLogoutClick = async () => {
    logoutUser();
  };

  const handlefeature1 = () => {
    const newSelected = "feature1";
    setSelected(newSelected);
    localStorage.setItem("selected", newSelected);
    navigate("feature1");
  };

  return (
    <div className="flex w-full  relative bg-[#fffffb]">
      <div className="flex flex-col justify-between items-center h-screen top-0 sticky bg-[#f8f8ec] border-r border-gray-300 px-4 py-6">
        <div onClick={handleHomeClick} className="cursor-pointer">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            fill="#000000"
            viewBox="0 0 256 256"
          >
            <path d="M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z"></path>
          </svg>
        </div>

        {/* Nav Links */}
        <div className="flex flex-col items-center gap-6">
          <div
            className={`p-2 cursor-pointer ${
              selected === "feature1" ? "bg-[#c4e456]" : "bg-transparent"
            } rounded-md`}
            onClick={handlefeature1}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill={selected === "feature1" ? "black" : "#6b7280"}
              viewBox="0 0 256 256"
            >
              <path d="M122.34,109.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0,0-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40a8,8,0,0,0,0,11.32ZM128,35.31,156.69,64,128,92.69,99.31,64Zm5.66,111a8,8,0,0,0-11.32,0l-40,40a8,8,0,0,0,0,11.32l40,40a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0,0-11.32ZM128,220.69,99.31,192,128,163.31,156.69,192Zm109.66-98.35-40-40a8,8,0,0,0-11.32,0l-40,40a8,8,0,0,0,0,11.32l40,40a8,8,0,0,0,11.32,0l40-40A8,8,0,0,0,237.66,122.34ZM192,156.69,163.31,128,192,99.31,220.69,128Zm-82.34-34.35-40-40a8,8,0,0,0-11.32,0l-40,40a8,8,0,0,0,0,11.32l40,40a8,8,0,0,0,11.32,0l40-40A8,8,0,0,0,109.66,122.34ZM64,156.69,35.31,128,64,99.31,92.69,128Z"></path>
            </svg>
          </div>
        </div>

        {/* User */}
        <LogOut
          onClick={handleLogoutClick}
          className="text-[#374151] cursor-pointer hover:text-[#1e2632]"
        />
      </div>
      <div className="flex justify-center w-full">
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;
