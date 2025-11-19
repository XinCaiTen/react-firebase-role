// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import PrivateRoute from "./components/PrivateRoute";
import RoleRoute from "./components/RoleRoute";
import Roles from "./pages/Roles";

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RoleRoute roles={["admin"]}>
              <Admin />
            </RoleRoute>
          }
        />
        <Route
  path="/roles"
  element={
    <RoleRoute roles={["admin"]}>
      <Roles />
    </RoleRoute>
  }
/>

        <Route path="*" element={<NotFound />} />
      </Routes>
      

    </>
  );
}
