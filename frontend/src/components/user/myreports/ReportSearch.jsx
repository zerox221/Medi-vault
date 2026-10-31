
import React from "react";
import { Search } from "lucide-react";

const ReportSearch = ({ search, setSearch }) => {
  return (
    <div className="relative mb-3">

      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <input
        type="text"
        placeholder="Search your reports..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

    </div>
  );
};

export default ReportSearch;
