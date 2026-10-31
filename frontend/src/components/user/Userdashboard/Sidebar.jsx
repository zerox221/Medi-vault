import React, { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Upload,
  Clock,
  Share2,
  Activity,
} from "lucide-react";

const Sidebar = () => {
  const [active, setActive] = useState("Dashboard");

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "My Reports", icon: FileText },
    { name: "Upload Report", icon: Upload },
    { name: "Medical Timeline", icon: Clock },
    { name: "Share Reports", icon: Share2 },
    { name: "Activity", icon: Activity },
  ];

  return (
    <aside className="w-[140px] shrink-0 border-r border-slate-200 bg-white min-h-screen p-2">

      <h2 className="text-xs font-bold text-blue-600 mx-1.5 my-2">
        MediVault
      </h2>

      <nav className="flex flex-col gap-1">

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.name}
              onClick={() => setActive(item.name)}
              className={`flex items-center gap-2 px-2 py-2 rounded-md text-[9px] cursor-pointer transition ${active === item.name
                  ? "bg-blue-50 text-blue-600 font-semibold"
                  : "text-slate-500 hover:bg-slate-100"
                }`}
            >
              <Icon size={16} />
              <span>{item.name}</span>
            </div>
          );
        })}

      </nav>
    </aside>
  );
};

export default Sidebar;