import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  FileText,
  Sparkles,
  Printer,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { recordsApi } from "../../../api/recordsApi";

const RecordPreviewModal = ({ record, onClose }) => {
  const navigate = useNavigate();
  const [currentRecord, setCurrentRecord] = useState(record);
  const [modalError, setModalError] = useState("");
  const [analyzingAI, setAnalyzingAI] = useState(false);

  if (!currentRecord) return null;

  const resolveFileUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `http://localhost:5001${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleViewOriginalReport = () => {
    if (!currentRecord.fileUrl) {
      setModalError("Report document file link is not available for this record.");
      return;
    }
    const targetUrl = resolveFileUrl(currentRecord.fileUrl);
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const handleTriggerAISummary = async () => {
    setAnalyzingAI(true);
    setModalError("");
    try {
      const res = await recordsApi.summarizeRecord(currentRecord.id || currentRecord._id);
      if (res?.aiSummary) {
        setCurrentRecord((prev) => ({
          ...prev,
          summary: res.aiSummary.summary,
          keyValues: res.aiSummary.keyBiomarkers || [],
          findings: res.aiSummary.findings || [],
          abnormalValues: res.aiSummary.abnormalValues || [],
          aiSummary: res.aiSummary,
        }));
      }
    } catch (err) {
      console.error("AI summarization failed:", err);
      setModalError(err.message || "Could not generate AI clinical summary at this time.");
    } finally {
      setAnalyzingAI(false);
    }
  };

  useEffect(() => {
    if (currentRecord && (!currentRecord.aiSummary?.summary && !currentRecord.summary)) {
      handleTriggerAISummary();
    }
  }, [currentRecord?._id, currentRecord?.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleAskAIAllReports = () => {
    const pId =
      (currentRecord.patient && typeof currentRecord.patient === "object"
        ? currentRecord.patient._id || currentRecord.patient.id
        : currentRecord.patient) ||
      (currentRecord.patientId && !currentRecord.patientId.toString().startsWith("PAT-")
        ? currentRecord.patientId
        : null) ||
      currentRecord._id ||
      currentRecord.id;

    if (pId) {
      onClose();
      navigate(`/doctor/search?patientId=${pId}`);
    } else {
      onClose();
      navigate("/doctor/search");
    }
  };

  const ai = currentRecord.aiSummary || {
    summary: currentRecord.summary,
    keyBiomarkers: currentRecord.keyValues || [],
    findings: currentRecord.findings || [],
    abnormalValues: currentRecord.abnormalValues || [],
  };

  const hasBiomarkers = ai.keyBiomarkers && ai.keyBiomarkers.length > 0;
  const hasFindings = ai.findings && ai.findings.length > 0;
  const hasAbnormals = ai.abnormalValues && ai.abnormalValues.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  {currentRecord.title}
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <ShieldCheck size={12} />
                  Patient Approved
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Shared by {currentRecord.patientName} • Valid until {currentRecord.accessExpires || "Active Consultation"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAskAIAllReports}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition"
              title="Search and ask AI across all reports of this patient"
            >
              <Sparkles size={13} />
              <span className="hidden sm:inline">Ask AI Across All Reports</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
              title="Print record"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition"
              title="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-sm">
          {modalError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-500 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Patient & Test Overview Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[11px] font-medium text-slate-400 block uppercase">
                Patient
              </span>
              <span className="font-semibold text-slate-800 text-sm truncate block mt-0.5">
                {currentRecord.patientName}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block uppercase">
                Category
              </span>
              <span className="font-semibold text-slate-800 text-sm block mt-0.5">
                {currentRecord.category}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block uppercase">
                Report Date
              </span>
              <span className="font-semibold text-slate-800 text-sm block mt-0.5">
                {currentRecord.date}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block uppercase">
                Diagnostic Facility
              </span>
              <span className="font-semibold text-slate-800 text-sm truncate block mt-0.5">
                {currentRecord.lab || "Diagnostic Center"}
              </span>
            </div>
          </div>

          {/* MediVault AI Clinical Summary Section */}
          {ai.summary ? (
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
                      Automated clinical synthesis of patient report values
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleTriggerAISummary}
                  disabled={analyzingAI}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition font-medium shadow-2xs disabled:opacity-60"
                  title="Re-run AI extraction"
                >
                  {analyzingAI ? (
                    <>
                      <Loader2 size={12} className="animate-spin text-blue-600" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={12} />
                      <span>Refresh AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Summary Text */}
              <p className="text-xs text-slate-700 leading-relaxed font-normal bg-white/70 p-3.5 rounded-lg border border-blue-100">
                {ai.summary}
              </p>

              {/* Observations & Findings */}
              {hasFindings && (
                <div className="space-y-1.5">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Clinical Observations & Major Findings
                  </h5>
                  <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside bg-white/60 p-3 rounded-lg border border-slate-200/60">
                    {ai.findings.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Abnormal Values Banner */}
              {hasAbnormals && (
                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                    <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                    Values Requiring Physician Review:
                  </div>
                  <ul className="list-disc list-inside text-amber-700 pl-1 text-[11px] space-y-0.5">
                    {ai.abnormalValues.map((v, idx) => (
                      <li key={idx}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Biomarkers Table */}
              {hasBiomarkers && (
                <div className="space-y-2">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Biomarker Reference Panel
                  </h5>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
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
                            <td className="py-2 px-3 font-bold text-slate-900">
                              {item.value}
                            </td>
                            <td className="py-2 px-3 text-slate-500">
                              {item.normalRange}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  item.flag === "Normal"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : item.flag === "Low" || item.flag === "Borderline"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
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
                ℹ️ {ai.disclaimer || "MediVault AI provides informational clinical assistance only and does not replace qualified physician judgment."}
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
                  Securely parsing diagnostic biomarkers from patient record.
                </p>
              </div>
            </div>
          )}

          {/* Attending Doctor / Lab Notes */}
          {currentRecord.doctorNotes && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Physician & Lab Assessment Notes
              </h4>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                {currentRecord.doctorNotes}
              </div>
            </div>
          )}

          {/* Patient Consent & Security Footer */}
          <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
              <span className="text-emerald-800">
                Authorized via Patient Digital Consent. All clinical views are logged in the secure MediVault audit trail.
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            File format: <span className="font-semibold text-slate-700">{currentRecord.fileType || "PDF"}</span> • Size: <span className="font-semibold text-slate-700">{currentRecord.fileSize || "1.2 MB"}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAskAIAllReports}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
              title="Search and ask AI across all reports of this patient"
            >
              <Sparkles size={14} />
              <span>Ask AI (All Reports)</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition"
            >
              Close
            </button>

            <button
              onClick={handleViewOriginalReport}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition"
            >
              <Eye size={15} />
              <span>View Report</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordPreviewModal;
