import React, { useState, useContext } from "react";
import { Outlet } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { userContext } from "../Context/UserContext";
import Sidebar from "../components/user/Userdashboard/Sidebar";
import TopNavbar from "../components/user/Userdashboard/TopNavbar";
import VerifyEmailModal from "../components/auth/VerifyEmailModal";

const UserLayout = () => {
  const { user } = useContext(userContext);
  const [verifyOpen, setVerifyOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopNavbar />

        {user && !user.isEmailVerified && (
          <div className="mx-6 mt-4 p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex items-center justify-between text-xs sm:text-sm text-amber-800 shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={18} className="text-amber-600 shrink-0" />
              <span>
                Your email (<strong>{user.email}</strong>) is unverified. Verify to activate zero-trust security.
              </span>
            </div>
            <button
              onClick={() => setVerifyOpen(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition shrink-0 ml-3 cursor-pointer"
            >
              Verify Now
            </button>
          </div>
        )}

        <main className="p-6 flex-1">
          <Outlet />
        </main>
      </div>

      {user && (
        <VerifyEmailModal
          isOpen={verifyOpen}
          email={user.email}
          onClose={() => setVerifyOpen(false)}
          onVerified={() => setVerifyOpen(false)}
        />
      )}
    </div>
  );
};

export default UserLayout;
