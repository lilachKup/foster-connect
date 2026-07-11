import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import FosterRegister from "./pages/FosterRegister.jsx";
import FosterProfile from "./pages/FosterProfile.jsx";
import OrgRegister from "./pages/OrgRegister.jsx";
import OrgDashboard from "./pages/OrgDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminFosterSearch from "./pages/AdminFosterSearch.jsx";

export default function App() {
  return (
    <>
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register/foster" element={<FosterRegister />} />
          <Route path="/register/organization" element={<OrgRegister />} />
          <Route
            path="/foster"
            element={
              <ProtectedRoute role="foster">
                <FosterProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization"
            element={
              <ProtectedRoute role="organization">
                <OrgDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/fosters"
            element={
              <ProtectedRoute role="admin">
                <AdminFosterSearch />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </>
  );
}
