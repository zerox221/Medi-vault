
import React from "react";
import { FileText, Eye } from "lucide-react";

const DashboardStats = ({ totalReports = 0, reportsAccessed = 0 }) => {
  const stats = [
    {
      id: 1,
      title: "Total Reports",
      value: totalReports,
      description: "Reports in your library.",
      Icon: FileText,
    },
    {
      id: 2,
      title: "Reports Accessed",
      value: reportsAccessed,
      description: "Different reports opened by doctors, last 30 days.",
      Icon: Eye,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {stats.map((stat) => {
        const Icon = stat.Icon;

        return (
          <div
            key={stat.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon size={19} className="text-blue-600" />
              <span className="text-sm text-slate-500">
                {stat.title}
              </span>
            </div>

            <h2 className="text-3xl font-bold text-slate-800">
              {stat.value}
            </h2>

            <p className="text-xs text-slate-400 mt-2">
              {stat.description}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;
