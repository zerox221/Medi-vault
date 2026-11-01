import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { userContext } from "../Context/UserContext.jsx";

const DoctorProtectedRoute = ({ user: propUser }) => {
  const { user: ctxUser, loading } = useContext(userContext);
  const user = propUser !== undefined ? propUser : ctxUser;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500 text-sm">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Validating medical session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role !== "doctor") {
    if (user.role === "user") {
      return <Navigate to="/user" replace />;
    }
    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default DoctorProtectedRoute;
