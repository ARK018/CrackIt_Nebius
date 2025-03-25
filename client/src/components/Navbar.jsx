import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleHomeClick = () => {
    navigate("/");
  };

  const handleSignInClick = () => {
    navigate("/signin");
  };

  const handleDashboardClick = () => {
    const selected = localStorage.getItem("selected");
    if (selected !== "feature1") {
      localStorage.setItem("selected", "feature1");
      navigate("/dashboard/feature1");
    } else {
      navigate("/dashboard/feature1");
    }
    console.log(selected);
  };

  return (
    <div className="bg-[#fffffb] w-full h-16 flex justify-between items-center px-12 border border-black/5">
      <div
        onClick={handleHomeClick}
        className="flex items-center justify-center gap-2 cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="29"
          height="29"
          fill="#000000"
          viewBox="0 0 256 256"
        >
          <path d="M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z"></path>
        </svg>

        <h1 className="font-overpass text-base tracking-[5%] mt-1">CrackIt</h1>
      </div>

      {user ? (
        <button
          onClick={handleDashboardClick}
          className="flex items-center justify-center px-6 py-[5px] bg-transparent text-black border-2 rounded-full font-semibold text-base hover:bg-black/5 transition-colors cursor-pointer"
        >
          <p className=" text-black font-medium text-base">Dashboard</p>
        </button>
      ) : (
        <button
          onClick={handleSignInClick}
          className="flex items-center justify-center px-6 py-[5px] bg-transparent text-black border-2 rounded-full font-semibold text-base hover:bg-black/5 transition-colors cursor-pointer"
        >
          <p className="text-black font-medium text-base">Sign In</p>
        </button>
      )}
    </div>
  );
};

export default Navbar;
