import React from "react";
import { Building2, CalendarDays, FileText, Sparkles, AlertTriangle } from "lucide-react";

const TimelineDetails = ({ report }) => {
  const ai = report.aiSummary;

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-start gap-2">
          <Building2 size={16} className="text-slate-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Hospital / Lab</p>
            <p className="text-xs font-semibold text-slate-800 mt-0.5">{report.hospital || "Diagnostic Facility"}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <CalendarDays size={16} className="text-slate-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Report Date</p>
            <p className="text-xs font-semibold text-slate-800 mt-0.5">{report.date || "Recent"}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <FileText size={16} className="text-slate-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Category</p>
            <p className="text-xs font-semibold text-slate-800 mt-0.5">{report.type || "General"}</p>
          </div>
        </div>
      </div>

      {/* AI Summary Highlight if available */}
      {ai?.summary && (
        <div className="p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 rounded-lg border border-blue-100 text-xs text-slate-700 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[11px] uppercase tracking-wider">
            <Sparkles size={13} className="text-blue-600" />
            MediVault AI Clinical Note
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
            {ai.summary}
          </p>

          {ai.abnormalValues && ai.abnormalValues.length > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">
              <AlertTriangle size={12} className="text-amber-600 shrink-0" />
              <span>Flagged for review: {ai.abnormalValues.slice(0, 2).join("; ")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimelineDetails;
