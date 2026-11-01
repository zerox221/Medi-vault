
import React from "react";
import { FileText } from "lucide-react";

const ReportItem = ({ report, selected, onToggle }) => {

  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-3 px-3 py-3 bg-white border rounded-xl cursor-pointer transition-all
        ${
          selected
            ? "border-slate-200 shadow-sm"
            : "border-slate-200 hover:border-blue-300"
        }`}
    >

      {/* CHECKBOX */}
      <div
        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0
          ${
            selected
              ? "bg-blue-600 border-blue-600"
              : "bg-white border-slate-300"
          }`}
      >
        {selected && (
          <svg
            viewBox="0 0 20 20"
            className="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path
              d="M4 10l4 4 8-8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* DOCUMENT ICON */}
      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
        <FileText size={17} className="text-blue-600" />
      </div>

      {/* REPORT INFORMATION */}
      <div className="min-w-0">

        <h3 className="text-xs font-medium text-slate-800">
          {report.name}
        </h3>

        <p className="text-[10px] text-slate-500 mt-0.5">
          {report.type} · {report.date}
        </p>

      </div>

    </div>
  );
};

export default ReportItem;
