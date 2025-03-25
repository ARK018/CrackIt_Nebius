import { useState, useEffect } from "react";
import AuthNavbar from "../components/AuthNavbar";
import { useAuth } from "../lib/context/AuthContext";

import auth from "../assets/auth.jpg";
import { Eye, EyeOff } from "lucide-react";

const SignIn = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mailError, setMailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");

  const { user, loginUser } = useAuth();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setMailError("");
    setPasswordError("");

    // Validate email
    if (!validateEmail(email)) {
      setMailError("Please enter a valid email address");
      return;
    }

    // Validate password
    if (!validatePassword(password)) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    const userInfo = { email, password };
    await loginUser(userInfo);
  };

  return (
    <div>
      <AuthNavbar />
      <div className="bg-[#fffffb] flex justify-center items-center w-full h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center justify-center w-1/2 h-full px-[180px]">
          <div className="items-start pb-8 w-full">
            <h1 className="font-overpass text-3xl text-left tracking-[5%]">
              CrackIt
            </h1>
            <p className="text-gray-600">
              Your Ultimate AI-Powered Career Companion.
              <br /> Unlock Your Future with Smart Guidance!
            </p>
          </div>
          <div className="flex flex-col w-full">
            <form className="space-y-6">
              <div className="flex flex-col w-full">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="off"
                  placeholder="john@gmail.com"
                  className="border-b border-gray-300 focus:outline-hidden pl py-2 "
                />
                {mailError && (
                  <p className="text-red-500 text-sm">{mailError}</p>
                )}
              </div>
              <div className="relative flex flex-col w-full">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                  }}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  autoComplete="off"
                  placeholder="••••••••"
                  className="border-b border-gray-300 focus:outline-hidden pl py-2 "
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 rounded cursor-pointer"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {passwordError && (
                  <p className="text-red-500 text-sm">{passwordError}</p>
                )}
              </div>
              <button
                onClick={handleSignIn}
                className="text-black bg-[#c4e456] rounded-full py-2 w-full cursor-pointer"
              >
                Sign In
              </button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </form>
          </div>
        </div>
        <div className="relative w-1/2 h-full">
          <img
            src={auth}
            alt="auth-image"
            className="absoute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default SignIn;
