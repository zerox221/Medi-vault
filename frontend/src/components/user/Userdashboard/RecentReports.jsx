
import React from "react";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RecentReports = ({ reports = [] }) => {
  const navigate = useNavigate();

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Recently Added Reports
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Your latest medical documents.
          </p>
        </div>

        <button
          onClick={() => navigate("/user/reports")}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All Reports
        </button>
      </div>

      <div className="space-y-3">
        {reports.length > 0 ? (
          reports.map((report) => (
            <div
              key={report.id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition"
            >
              <div className="w-10 h-10 shrink-0 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-blue-600" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-800">
                  {report.title}
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  {report.category} · {report.date} · {report.lab}
                </p>

                <div className="flex flex-wrap gap-2 mt-2">
                  {(report.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className={`text-[10px] px-2 py-1 rounded-md ${
                        tag === "Currently shared"
                          ? "bg-green-50 text-green-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate("/user/reports")}
                className="shrink-0 px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                View
              </button>
            </div>
          ))
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
            No reports uploaded yet.
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentReports;
