import React from "react";
import { FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ReportsHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <FileText size={20} />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            My Medical Reports
          </h1>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          View, organize, analyze, and manage your private medical records.
        </p>
      </div>

      <button
        onClick={() => navigate("/user/upload")}
        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs self-start sm:self-auto"
      >
        <Plus size={18} />
        Upload New Report
      </button>
    </div>
  );
};

export default ReportsHeader;
