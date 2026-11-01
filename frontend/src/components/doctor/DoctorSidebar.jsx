import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  FileCheck2,
  QrCode,
  UserRound,
  ShieldCheck,
  X,
  Stethoscope,
  Search,
  Sparkles,
} from "lucide-react";

const DoctorSidebar = ({ mobileOpen, setMobileOpen, pendingRequestsCount = 0 }) => {
  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      link: "/doctor",
      end: true,
    },
    {
      name: "AI Medical Search",
      icon: Sparkles,
      link: "/doctor/search",
    },
    {
      name: "My Patients",
      icon: Users,
      link: "/doctor/patients",
    },
    {
      name: "Access Requests",
      icon: ShieldAlert,
      link: "/doctor/requests",
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : null,
    },
    {
      name: "Shared Records",
      icon: FileCheck2,
      link: "/doctor/records",
    },
    {
      name: "QR Scanner",
      icon: QrCode,
      link: "/doctor/scan-qr",
    },
    {
      name: "Doctor Profile",
      icon: UserRound,
      link: "/doctor/profile",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[260px] shrink-0 bg-white border-r border-slate-200 p-4 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header / Brand */}
        <div className="flex items-center justify-between px-2 pt-2 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Stethoscope size={18} />
              </div>
              <h2 className="text-xl font-bold text-blue-600 tracking-tight">
                MediVault
              </h2>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 ml-0.5">
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Doctor Portal
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                <ShieldCheck size={11} />
                Verified
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5 flex-1 mt-5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.link}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-semibold shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                  }`
                }
              >
                <Icon size={18} />
                <span className="truncate">{item.name}</span>
                {item.badge > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default DoctorSidebar;
