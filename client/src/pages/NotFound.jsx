import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate("/");
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-gray-100 to-gray-200">
      <div className="text-center px-4 lg:px-40 py-8 rounded-lg bg-white shadow-2xl">
        <div className="mb-8">
          <h1 className="text-8xl font-extrabold text-primary relative z-10">
            404
          </h1>
        </div>
        <p className="text-2xl font-medium text-gray-600 mb-6">
          Oops! Page Not Found
        </p>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          className="px-6 py-3 bg-[#abd61b] text-sm font-medium rounded-full hover:bg-[#c4e456] hover:scale-97 transition-all duration-200 inline-flex items-center cursor-pointer"
          onClick={handleHomeClick}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Return Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
