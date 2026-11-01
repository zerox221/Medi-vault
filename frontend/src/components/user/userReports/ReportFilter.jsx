
import React from "react";

const ReportFilters = ({ status, setStatus }) => {

  const filters = [
    "All Reports",
    "Completed",
    "Processing",
    "Pending",
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">

      <div className="flex flex-wrap items-center gap-3">

        <span className="text-sm font-semibold text-slate-700">
          Filter by:
        </span>

        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setStatus(filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              status === filter
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {filter}
          </button>
        ))}

      </div>
    </div>
  );
};

export default ReportFilters;
