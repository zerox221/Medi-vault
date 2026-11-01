
import React from "react";
import { Check } from "lucide-react";
import ReportList from "./ReportList";

const ReportSelection = ({
  reports,
  selectedReports,
  onToggleReport,
  onSelectAll,
  onDeselectAll,
  onContinue,
}) => {

  return (
    <div>

      {/* SELECTION HEADER */}
      <div className="flex items-center justify-between mb-3">

        <p className="text-xs font-semibold text-slate-700">
          {selectedReports.length} reports selected.
        </p>

        <div className="flex gap-2">

          <button
            onClick={onSelectAll}
            className="px-3 py-2 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Select All
          </button>

          <button
            onClick={onDeselectAll}
            className="px-3 py-2 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Deselect All
          </button>

        </div>

      </div>

      {/* REPORT LIST */}
      <ReportList
        reports={reports}
        selectedReports={selectedReports}
        onToggleReport={onToggleReport}
      />

      {/* CONTINUE BUTTON */}
      <div className="flex justify-end mt-4">

        <button
          onClick={onContinue}
          disabled={selectedReports.length === 0}
          className="px-5 py-2.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
        >
          Continue
          <Check size={14} className="inline ml-2" />
        </button>

      </div>

    </div>
  );
};

export default ReportSelection;
