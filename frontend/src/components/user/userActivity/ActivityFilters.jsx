
import React from "react";

const filters = [
  "All Activity",
  "Uploads",
  "Doctor Access",
  "Sharing",
];

const ActivityFilters = ({ activeFilter, setActiveFilter }) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => setActiveFilter(filter)}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all
            ${
              activeFilter === filter
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-500 border-slate-200 hover:bg-blue-50 hover:text-blue-600"
            }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
};

export default ActivityFilters;
