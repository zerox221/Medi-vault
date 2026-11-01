import React from "react";
import { FileText, CalendarDays, Activity } from "lucide-react";

const TimelineStats = ({ reports = [] }) => {
  const safeReports = Array.isArray(reports) ? reports : [];
  const totalReports = safeReports.length;

  const validYears = safeReports
    .map((report) => (report.date ? String(report.date).slice(0, 4) : ""))
    .filter(Boolean);
  const yearsCount = new Set(validYears).size || (totalReports > 0 ? 1 : 0);

  const categories = new Set(
    safeReports.map((report) => report.type || report.category || "General")
  ).size;

  const stats = [
    {
      title: "Total Reports",
      value: totalReports,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Years Covered",
      value: yearsCount,
      icon: CalendarDays,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Report Categories",
      value: categories,
      icon: Activity,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <div
            key={index}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  {stat.title}
                </p>
                <h2 className="text-2xl font-bold text-slate-800 mt-1">
                  {stat.value}
                </h2>
              </div>

              <div
                className={`w-11 h-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}
              >
                <Icon size={20} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimelineStats;
