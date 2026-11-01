import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Upload,
  Clock,
  Share2,
  Activity,
  UserRound,
  Sparkles,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { sharingApi } from "../../../api/sharingApi";

const Sidebar = () => {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const checkRequests = async () => {
      try {
        const data = await sharingApi.getPatientSharingRequests();
        const pending = (data?.requests || []).filter((r) => r.status === "pending").length;
        setPendingCount(pending);
      } catch (err) {
        // silent
      }
    };
    checkRequests();
    const interval = setInterval(checkRequests, 15000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      link: "/user",
    },
    {
      name: "AI Assistant",
      icon: Sparkles,
      link: "/user/ai-assistant",
    },
    {
      name: "My Reports",
      icon: FileText,
      link: "/user/reports",
    },
    {
      name: "Upload Report",
      icon: Upload,
      link: "/user/upload",
    },
    {
      name: "Medical Timeline",
      icon: Clock,
      link: "/user/timeline",
    },
    {
      name: "Share Reports",
      icon: Share2,
      link: "/user/share",
      badge: pendingCount,
    },
    {
      name: "Activity",
      icon: Activity,
      link: "/user/activity",
    },
  ];

  return (
    <aside className="w-[240px] shrink-0 min-h-screen bg-white border-r border-slate-200 p-4 flex flex-col">
      {/* Logo */}
      <h2 className="text-xl font-bold text-blue-600 px-2 my-4">
        MediVault
      </h2>

      {/* Navigation */}
      <nav className="flex flex-col gap-1.5 flex-1 mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.link}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
                }`
              }
            >
              <Icon size={18} />
              <span>{item.name}</span>
              {item.badge > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
