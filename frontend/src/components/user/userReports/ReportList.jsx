import React, { useState } from "react";
import {
  FileText,
  CalendarDays,
  Building2,
  Sparkles,
  Share2,
  Eye,
  Download,
  Trash2,
  Loader2,
} from "lucide-react";
import { recordsApi } from "../../../api/recordsApi";

const ReportList = ({ reports = [], onViewReport, onDeleteReport }) => {
  const [downloadingId, setDownloadingId] = useState(null);
  const safeReports = Array.isArray(reports) ? reports : [];

  if (safeReports.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
        <FileText size={44} className="mx-auto text-slate-300" />
        <div>
          <h3 className="text-base font-semibold text-slate-700">
            No medical reports found
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Uploaded laboratory and diagnostic documents will appear here.
          </p>
        </div>
      </div>
    );
  }

  const resolveFileUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `http://localhost:5001${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleDownload = async (e, report) => {
    e.stopPropagation();
    const id = report._id || report.id;
    setDownloadingId(id);
    try {
      const data = await recordsApi.getRecordDownloadUrl(id);
      const targetUrl = resolveFileUrl(data?.downloadUrl || report.fileUrl);
      if (targetUrl) {
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.warn("Direct download fallback:", err);
      const targetUrl = resolveFileUrl(report.fileUrl);
      if (targetUrl) {
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800">
          Your Medical Records
        </h2>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {safeReports.length} {safeReports.length === 1 ? "Record" : "Records"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {safeReports.map((report, index) => {
          const reportId = report._id || report.id || index;
          const hasAISummary = Boolean(report.aiSummary?.summary);

          return (
            <div
              key={reportId}
              onClick={() => onViewReport && onViewReport(report)}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
                      <FileText size={22} />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition">
                        {report.title || "Untitled Medical Report"}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {report.category || report.type || "Lab Report"}
                      </p>
                    </div>
                  </div>

                  {report.fileSize && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {report.fileSize}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-slate-400" />
                    <span>{report.reportDate || report.date || "Recent"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-slate-400" />
                    <span className="truncate">
                      {report.hospital || report.lab || "Diagnostic Center"}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {hasAISummary && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <Sparkles size={11} />
                      AI Analyzed
                    </span>
                  )}
                  {report.doctorName && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                      Dr. {report.doctorName}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onViewReport) onViewReport(report);
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 py-1.5 px-2.5 rounded-lg hover:bg-blue-50 transition"
                >
                  <Eye size={14} />
                  View & AI Summary
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => handleDownload(e, report)}
                    disabled={downloadingId === reportId}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Download original file"
                  >
                    {downloadingId === reportId ? (
                      <Loader2 size={16} className="animate-spin text-blue-600" />
                    ) : (
                      <Download size={16} />
                    )}
                  </button>

                  {onDeleteReport && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteReport(report);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete record"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportList;
