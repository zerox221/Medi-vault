
import React from "react";
import { Search, Filter } from "lucide-react";

const TimelineFilters = ({
  search,
  setSearch,
  selectedYear,
  setSelectedYear,
  selectedType,
  setSelectedType,
  years,
  types,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Filter size={16} className="text-blue-600" />

        <h3 className="text-sm font-semibold text-slate-800">
          Filter Medical History
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

        {/* SEARCH */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports..."
            className="w-full h-10 pl-9 pr-3 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
          />
        </div>

        {/* YEAR FILTER */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="h-10 px-3 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
        >
          <option value="All">All Years</option>

          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        {/* TYPE FILTER */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="h-10 px-3 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
        >
          <option value="All">All Report Types</option>

          {types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

      </div>
    </div>
  );
};

export default TimelineFilters;
