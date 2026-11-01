import React, { useState } from "react";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Eye,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import TimelineDetails from "./TimelineDetails";

const TimelineItem = ({ report, index, onSelectReport }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative pl-7 pb-6">
      {/* TIMELINE DOT */}
      <div className="absolute left-[3px] top-1.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-[3px] border-blue-100 z-10 shadow-2xs" />

      {/* TIMELINE VERTICAL CONNECTOR */}
      <div className="absolute left-[9px] top-4 bottom-0 w-[2px] bg-slate-200" />

      {/* REPORT CARD */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs hover:border-blue-200 transition">
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <FileText size={20} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] text-blue-600 font-semibold tracking-wide">
                  {report.date}
                </p>
                {report.aiSummary?.summary && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                    <Sparkles size={10} />
                    AI Analyzed
                  </span>
                )}
              </div>

              <h3
                onClick={() => onSelectReport && onSelectReport(report)}
                className={`text-sm font-bold text-slate-800 mt-1 leading-snug ${
                  onSelectReport ? "cursor-pointer hover:text-blue-600 hover:underline transition" : ""
                }`}
              >
                {report.name || report.title}
              </h3>

              <p className="text-xs text-slate-500 mt-0.5">
                {report.type || report.category} • {report.hospital || "Diagnostic Facility"}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            {report.status || "Completed"}
          </span>
        </div>

        {expanded && <TimelineDetails report={report} />}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div>
            {onSelectReport && (
              <button
                type="button"
                onClick={() => onSelectReport(report)}
                className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 font-semibold transition"
              >
                <ExternalLink size={13} />
                <span>Open Report</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold transition"
          >
            <Eye size={13} />
            <span>{expanded ? "Hide Details" : "Quick View"}</span>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimelineItem;
