import React, { useState, useContext, useRef, useEffect } from "react";
import { User, LogOut, ShieldCheck, Bell, Stethoscope, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { userContext } from "../../../Context/UserContext.jsx";
import { sharingApi } from "../../../api/sharingApi.js";

const TopNavbar = () => {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const { user, logout } = useContext(userContext);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowProfile(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Poll or fetch pending requests periodically
  useEffect(() => {
    const checkRequests = async () => {
      try {
        const data = await sharingApi.getPatientSharingRequests();
        const pending = (data?.requests || []).filter((r) => r.status === "pending");
        setPendingRequests(pending);
      } catch (err) {
        // silent
      }
    };

    checkRequests();
    const interval = setInterval(checkRequests, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    setShowProfile(false);
    await logout();
    navigate("/auth");
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "P";

  return (
    <header className="h-[58px] w-full bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-40">
      {/* LEFT SIDE */}
      <div className="flex items-center gap-3">
        <span className="text-base sm:text-lg font-semibold text-slate-800 hidden sm:block">
          Welcome back, {user?.name || "Patient"}
        </span>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <ShieldCheck size={14} />
          Protected Patient Portal
        </div>

        {/* NOTIFICATIONS BELL */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition relative cursor-pointer"
            title="Doctor Access Requests & Notifications"
          >
            <Bell size={20} />
            {pendingRequests.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl py-3 animate-in fade-in duration-150 z-50">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Doctor Access Requests
                </span>
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {pendingRequests.length} Pending
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {pendingRequests.length > 0 ? (
                  pendingRequests.map((req) => (
                    <div
                      key={req._id}
                      onClick={() => {
                        setShowNotifications(false);
                        navigate("/user/share?tab=requests");
                      }}
                      className="p-3.5 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Stethoscope size={16} />
                      </div>
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-bold text-slate-800 truncate">
                          Dr. {req.doctor?.name || "Doctor"}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {req.doctor?.specialization || "Clinical Review"}
                        </p>
                        <p className="text-[10px] text-amber-700 font-medium mt-1">
                          Click to Review & Authorize &rarr;
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No pending doctor requests
                  </div>
                )}
              </div>

              <div className="pt-2 px-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate("/user/share?tab=requests");
                  }}
                  className="w-full py-1.5 text-center text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Manage all sharing permissions &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PROFILE */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold hover:bg-blue-700 transition ring-2 ring-blue-50 cursor-pointer"
          >
            {initial}
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 animate-in fade-in duration-100 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {user?.name || "Patient"}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user?.email || ""}
                </p>
              </div>

              <button
                onClick={() => {
                  navigate("/user/profile");
                  setShowProfile(false);
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <User size={15} className="text-slate-400" />
                My Profile
              </button>

              <div className="border-t border-slate-100 my-1"></div>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-xs font-medium text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
