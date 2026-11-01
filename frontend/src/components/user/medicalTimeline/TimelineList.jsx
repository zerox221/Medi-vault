import React from "react";
import TimelineItem from "./TimelineItem";
import EmptyTimeline from "./EmptyTimeline";

const TimelineList = ({ reports = [], groupedReports: incomingGrouped = null, onSelectReport }) => {
  // Compute grouped reports safely whether passed pre-grouped or as array
  let grouped = incomingGrouped;

  if (!grouped || Object.keys(grouped).length === 0) {
    if (!reports || reports.length === 0) {
      return <EmptyTimeline />;
    }

    grouped = reports.reduce((acc, report) => {
      const year = report.date ? String(report.date).slice(0, 4) : "2026";
      if (!acc[year]) acc[year] = [];
      acc[year].push(report);
      return acc;
    }, {});
  }

  const sortedYears = Object.keys(grouped).sort((a, b) => b - a);

  // If no years or every year's list is empty
  const totalCount = sortedYears.reduce((sum, y) => sum + (grouped[y]?.length || 0), 0);
  if (totalCount === 0) {
    return <EmptyTimeline />;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
      <div className="mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800">
            Medical Timeline & Health Chronicle
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological progression of diagnostic investigations and hospital visits.
          </p>
        </div>
        <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
          {totalCount} {totalCount === 1 ? "Record" : "Records"}
        </span>
      </div>

      {sortedYears.map((year) => {
        const yearReports = grouped[year] || [];
        if (yearReports.length === 0) return null;

        return (
          <div key={year} className="mb-6 last:mb-0">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                {year}
              </span>
              <div className="flex-1 h-[1px] bg-slate-200" />
            </div>

            <div className="space-y-1">
              {yearReports.map((report, index) => (
                <TimelineItem
                  key={report.id || report._id || index}
                  report={report}
                  index={index}
                  onSelectReport={onSelectReport}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimelineList;
