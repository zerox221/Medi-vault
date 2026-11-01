import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  Download,
  Sparkles,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Calendar,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { recordsApi } from "../../../api/recordsApi";

const ReportDetailModal = ({ report, onClose, onRefresh }) => {
  const [downloading, setDownloading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentReport, setCurrentReport] = useState(report);
  const [error, setError] = useState("");

  if (!currentReport) return null;

  const resolveFileUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `http://localhost:5001${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError("");
    try {
      const data = await recordsApi.getRecordDownloadUrl(currentReport._id || currentReport.id);
      const targetUrl = resolveFileUrl(data?.downloadUrl || currentReport.fileUrl);
      if (targetUrl) {
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      } else {
        setError("Download link is unavailable for this record.");
      }
    } catch (err) {
      console.warn("Download link error:", err);
      const targetUrl = resolveFileUrl(currentReport.fileUrl);
      if (targetUrl) {
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      } else {
        setError(err.message || "Failed to generate download URL.");
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleTriggerAISummary = async () => {
    setAnalyzing(true);
    setError("");
    try {
      const res = await recordsApi.summarizeRecord(currentReport._id || currentReport.id);
      if (res?.aiSummary) {
        const updated = { ...currentReport, aiSummary: res.aiSummary };
        setCurrentReport(updated);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setError(err.message || "Could not generate AI summary at this time.");
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (currentReport && (!currentReport.aiSummary || !currentReport.aiSummary.summary)) {
      handleTriggerAISummary();
    }
  }, [currentReport?._id]);

  const ai = currentReport.aiSummary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {currentReport.title || currentReport.name}
              </h3>
              <p className="text-xs text-slate-500">
                {currentReport.category || currentReport.type} • {currentReport.reportDate || currentReport.date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition"
              title="Print"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-sm">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[11px] font-medium text-slate-400 block uppercase">
                Diagnostic Facility
              </span>
              <span className="font-semibold text-slate-800 truncate block mt-0.5">
                {currentReport.hospital || currentReport.lab || "Diagnostic Center"}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block uppercase">
                Report Date
              </span>
              <span className="font-semibold text-slate-800 block mt-0.5">
                {currentReport.reportDate || currentReport.date || "Recorded"}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block uppercase">
                Attending Doctor
              </span>
              <span className="font-semibold text-slate-800 truncate block mt-0.5">
                {currentReport.doctorName || "Treating Physician"}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block uppercase">
                File Details
              </span>
              <span className="font-semibold text-slate-800 block mt-0.5">
                {currentReport.fileSize || "PDF Document"}
              </span>
            </div>
          </div>

          {/* Gemini AI Clinical Summary */}
          {ai?.summary ? (
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-slate-50 border border-blue-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                      MediVault AI Clinical Summary
                    </h4>
                    <p className="text-[11px] text-blue-700">
                      Google Gemini AI synthesis of diagnostic values
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                    {ai.reportType || "Lab Report"}
                  </span>
                  <button
                    onClick={handleTriggerAISummary}
                    disabled={analyzing}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 px-2 py-0.5 rounded-lg transition font-medium shadow-2xs disabled:opacity-50"
                    title="Re-analyze medical report with Gemini AI"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 size={11} className="animate-spin text-blue-600" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw size={11} />
                        <span>Refresh AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-normal bg-white/70 p-3.5 rounded-lg border border-blue-100">
                {ai.summary}
              </p>

              {/* Findings */}
              {ai.findings && ai.findings.length > 0 && (
                <div className="space-y-1.5">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Key Clinical Observations
                  </h5>
                  <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside bg-white/60 p-3 rounded-lg border border-slate-200/60">
                    {ai.findings.map((finding, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Abnormal Values Banner if any */}
              {ai.abnormalValues && ai.abnormalValues.length > 0 && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                    <AlertTriangle size={14} className="text-amber-600" />
                    Values Requiring Physician Review:
                  </div>
                  <ul className="list-disc list-inside text-amber-700 pl-1 text-[11px]">
                    {ai.abnormalValues.map((v, idx) => (
                      <li key={idx}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Biomarkers Table */}
              {ai.keyBiomarkers && ai.keyBiomarkers.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Biomarker Reference Panel
                  </h5>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Test Parameter</th>
                          <th className="py-2 px-3">Measured Result</th>
                          <th className="py-2 px-3">Biological Reference</th>
                          <th className="py-2 px-3 text-right">Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ai.keyBiomarkers.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-medium text-slate-800">
                              {item.parameter}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-900">
                              {item.value}
                            </td>
                            <td className="py-2 px-3 text-slate-500">
                              {item.normalRange || "Reference Standard"}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  item.flag === "Normal"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {item.flag || "Recorded"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-[10px] text-slate-400 italic leading-relaxed pt-1">
                ℹ️ {ai.disclaimer || "MediVault AI provides informational clinical assistance only and does not replace professional medical judgment."}
              </p>
            </div>
          ) : (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
              <Loader2 size={24} className="mx-auto text-blue-600 animate-spin" />
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Synthesizing clinical insights and lab values with AI...
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Securely parsing diagnostic biomarkers from vault document.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck size={16} className="text-emerald-600" />
            Zero-knowledge patient encrypted
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition"
            >
              Close
            </button>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Accessing Vault...
                </>
              ) : (
                <>
                  <Download size={14} />
                  Download Original PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailModal;
