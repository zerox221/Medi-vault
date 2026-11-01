
import React from "react";
import { Search, Upload, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DashboardActions = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => navigate("/user/reports")}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
      >
        <Search size={16} />
        Search Reports
      </button>

      <button
        onClick={() => navigate("/user/upload")}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
      >
        <Upload size={16} />
        Upload Report
        <ArrowUpRight size={15} />
      </button>
    </div>
  );
};

export default DashboardActions;
