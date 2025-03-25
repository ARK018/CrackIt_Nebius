import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Feature1 from "./pages/Feature1";
import Interview from "./pages/Interview";
import Assessment from "./pages/Assessment";
import PrivateRoutes from "./pages/utils/PrivateRoutes";
import { AuthProvider } from "./lib/context/AuthContext";

function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="*" element={<NotFound />} />
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route element={<PrivateRoutes />}>
              <Route path="/dashboard" element={<Dashboard />}>
                <Route path="feature1" element={<Feature1 />} />
              </Route>
              <Route path="/dashboard/interview" element={<Interview />} />
              <Route path="/dashboard/assessment" element={<Assessment />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </>
  );
}

export default App;
