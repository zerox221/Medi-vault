import React from "react";
import ReportItem from "./ReportItem";

const ReportList = ({
  reports = [],
  selectedReports = [],
  onToggleReport,
}) => {
  if (!reports || reports.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
        No medical reports found. Upload a report first to share it with doctors.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reports.map((report) => (
        <ReportItem
          key={report.id}
          report={report}
          selected={selectedReports.includes(report.id)}
          onToggle={() => onToggleReport(report.id)}
        />
      ))}
    </div>
  );
};

export default ReportList;
