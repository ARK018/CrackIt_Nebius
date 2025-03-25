import { Navigate, Outlet } from "react-router-dom";

const PrivateRoutes = () => {
  const savedSession = localStorage.getItem("userSession");
  return savedSession ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoutes;
