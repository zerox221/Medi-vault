
import React from "react";
import { Search, SlidersHorizontal } from "lucide-react";

const ReportSearch = ({ search, setSearch }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">

      <div className="relative flex-1">

        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          placeholder="Search reports, doctors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />

      </div>

      <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
        <SlidersHorizontal size={17} />
        More Filters
      </button>

    </div>
  );
};

export default ReportSearch;
