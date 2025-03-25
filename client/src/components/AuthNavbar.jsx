import { useNavigate, useLocation } from "react-router-dom";

const AuthNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location

  const handleHomeClick = () => {
    navigate("/");
  };

  const handleClick = () => {
    if (isSignInPage) {
      navigate("/signup");
    } else {
      navigate("/signin");
    }
  };

  const isSignInPage = location.pathname === "/signin";
  const text = isSignInPage ? "Sign Up" : "Sign In";

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

      <p className="text-gray-600 text-base">
        {isSignInPage ? "Don't have an account?" : "Already have an account"}{" "}
        <button
          onClick={handleClick}
          className="text-[#abd61b] text-base font-semibold cursor-pointer hover:underline underline-offset-auto"
        >
          {text}
        </button>
      </p>
    </div>
  );
};

export default AuthNavbar;
