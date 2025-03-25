import { ID } from "appwrite";
import { createContext, useContext, useEffect, useState } from "react";
import { account } from "../appwrite";
import { useNavigate } from "react-router-dom";
import Loader from "../../components/Loader";

// Create the AuthContext
export const AuthContext = createContext();

// Create the AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Initial loading state
  const navigate = useNavigate();

  useEffect(() => {
    checkUserStatus(); // Check user status on component mount
  }, []);

  const registerUser = async (userInfo) => {
    setLoading(true);
    try {
      // Create a new account
      await account.create(
        ID.unique(),
        userInfo.email,
        userInfo.password,
        userInfo.name
      );
      // Automatically log in the user after registration
      await loginUser(userInfo);
    } catch (error) {
      console.error("Register Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (userInfo, retryAttempt = 0) => {
    setLoading(true);
    try {
      // Create a session with email and password
      await account.createEmailPasswordSession(
        userInfo.email,
        userInfo.password
      );
      const accountDetails = await account.get();
      setUser(accountDetails);

      // Store user details in localStorage
      localStorage.setItem("userSession", JSON.stringify(accountDetails));
      navigate("/dashboard/feature1", { replace: true });
    } catch (error) {
      console.error("Login Error:", error.message);
      if (error.code === 401 && error.message.includes("Invalid credential")) {
        alert(error.message);
      }
      if (
        error.code === 401 &&
        error.message.includes("session is active") &&
        retryAttempt < 1
      ) {
        await account.deleteSession("current");
        return loginUser(userInfo, retryAttempt + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    setLoading(true);
    try {
      await account.deleteSession("current");
      setUser(null);

      // Clear localStorage on logout
      localStorage.removeItem("userSession");
      navigate("/");
    } catch (error) {
      console.error("Logout Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkUserStatus = async () => {
    setLoading(true);
    try {
      const savedSession = localStorage.getItem("userSession");
      if (savedSession) {
        // Verify the session with Appwrite
        const accountDetails = await account.get();
        setUser(accountDetails);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Session Check Error:", error.message);
      localStorage.removeItem("userSession"); // Clear invalid session
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const contextData = {
    user,
    loginUser,
    registerUser,
    logoutUser,
    checkUserStatus,
  };

  return (
    <AuthContext.Provider value={contextData}>
      {loading ? <Loader /> : children}
    </AuthContext.Provider>
  );
};

// Custom hook to use AuthContext
export const useAuth = () => useContext(AuthContext);
