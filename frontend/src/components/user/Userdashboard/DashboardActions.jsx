import React from "react";
import { Search, Upload } from "lucide-react";

const DashboardActions = () => {
  return (
    <div className="flex items-center gap-2">

      <button className="flex items-center gap-1 px-3 py-1.5 text-[8px] rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
        <Search size={13} />
        Search Reports
      </button>

      <button className="flex items-center gap-1 px-3 py-1.5 text-[8px] rounded-md bg-blue-600 text-white hover:bg-blue-700">
        <Upload size={13} />
        + Upload Report
      </button>

    </div>
  );
};

export default DashboardActions;