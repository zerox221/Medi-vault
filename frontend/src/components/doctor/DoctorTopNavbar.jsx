import React, { useState, useRef, useEffect, useContext } from "react";
import {
  Menu,
  Bell,
  User,
  LogOut,
  ShieldCheck,
  QrCode,
  FileText,
  Clock,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { userContext } from "../../Context/UserContext.jsx";

const DoctorTopNavbar = ({ onMenuClick }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useContext(userContext);
  const navigate = useNavigate();

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = [
    {
      id: 1,
      title: "Patient Access Approved",
      message: "Vikram Malhotra approved access to CT Angiography records.",
      time: "25m ago",
      read: false,
      link: "/doctor/records",
    },
    {
      id: 2,
      title: "Authorization Pending",
      message: "Request #AR-8091 for Rahul Sharma is awaiting patient approval.",
      time: "2h ago",
      read: false,
      link: "/doctor/requests",
    },
    {
      id: 3,
      title: "New Records Available",
      message: "Priya Singh shared Holter Monitor 24hr Report.",
      time: "1d ago",
      read: true,
      link: "/doctor/records",
    },
  ];

  return (
    <header className="h-[62px] w-full bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-40">
      {/* LEFT SIDE */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2.5">
          <span className="text-base sm:text-lg font-bold text-slate-800">
            Doctor Portal
          </span>
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck size={13} className="text-emerald-600" />
            Verified Medical Practitioner
          </span>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick QR scan shortcut */}
        <button
          onClick={() => navigate("/doctor/scan-qr")}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition border border-blue-200"
        >
          <QrCode size={15} />
          Scan Patient QR
        </button>

        {/* NOTIFICATIONS */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Notifications"
          >
            <Bell size={19} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 sm:w-88 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Notifications
                </span>
                <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  2 unread
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setShowNotifications(false);
                      navigate(n.link);
                    }}
                    className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition ${
                      !n.read ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800">
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {n.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-snug">
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>

              <div className="px-4 py-2 border-t border-slate-100 text-center">
                <Link
                  to="/doctor/requests"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  View all access requests &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* PROFILE DROPDOWN */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-blue-100 transition"
          >
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold shadow-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "DR"}
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                <p className="text-sm font-semibold text-slate-800">
                  {user?.name ? (user.name.startsWith("Dr.") ? user.name : `Dr. ${user.name}`) : "Doctor Account"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email || "doctor@medivault.com"}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {user?.specialization || "Clinical Practitioner"} • {user?.verificationStatus || "Registered"}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    navigate("/doctor/profile");
                    setShowProfile(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  <User size={16} className="text-slate-400" />
                  Doctor Profile & Credentials
                </button>

                <button
                  onClick={() => {
                    navigate("/doctor/requests");
                    setShowProfile(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  <Clock size={16} className="text-slate-400" />
                  Access Requests
                </button>

                <button
                  onClick={() => {
                    navigate("/doctor/records");
                    setShowProfile(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  <FileText size={16} className="text-slate-400" />
                  Approved Medical Records
                </button>
              </div>

              <div className="border-t border-slate-100 my-1"></div>

              <button
                onClick={async () => {
                  setShowProfile(false);
                  await logout();
                  navigate("/auth");
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DoctorTopNavbar;
