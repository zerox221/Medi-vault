import React, { useState, useContext } from "react";
import { Outlet } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { userContext } from "../Context/UserContext";
import DoctorSidebar from "../components/doctor/DoctorSidebar";
import DoctorTopNavbar from "../components/doctor/DoctorTopNavbar";
import VerifyEmailModal from "../components/auth/VerifyEmailModal";

const DoctorLayout = () => {
  const { user } = useContext(userContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      {/* Doctor Sidebar */}
      <DoctorSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <DoctorTopNavbar onMenuClick={() => setMobileOpen(true)} />

        {user && !user.isEmailVerified && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex items-center justify-between text-xs sm:text-sm text-amber-800 shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={18} className="text-amber-600 shrink-0" />
              <span>
                Your doctor account email (<strong>{user.email}</strong>) is not verified. Verify now to finalize clinical authorization.
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
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

export default DoctorLayout;
