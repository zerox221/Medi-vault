import React from "react";
import { Search } from "lucide-react";

const TopNavbar = () => {
  return (
    <header className="h-[34px] bg-white border-b border-slate-200 flex items-center justify-end px-5">

      <div className="flex items-center gap-3">

        <span className="text-[7px] text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
          Demo mode · synthetic data
        </span>

        <Search size={16} className="text-slate-700" />

        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px]">
          P
        </div>

      </div>

    </header>
  );
};

export default TopNavbar;