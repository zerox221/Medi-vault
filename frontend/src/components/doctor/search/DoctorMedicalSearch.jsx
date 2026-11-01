import React, { useState, useEffect } from "react";
import {
  Search,
  Sparkles,
  User,
  FileText,
  AlertCircle,
  ExternalLink,
  Loader2,
  ShieldCheck,
  RotateCcw,
  Eye,
  CheckCircle2,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  FolderOpen,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { aiApi } from "../../../api/aiApi";
import RecordPreviewModal from "../records/RecordPreviewModal";

const DOCTOR_CLINICAL_PROMPTS = [
  "Summarize the latest CBC & blood test results for this patient.",
  "Identify all abnormal, elevated, or flagged biomarker values.",
  "What is the patient's creatinine and kidney function status?",
  "Compare the patient's latest test results with previous reports.",
];

/**
 * Safely renders clinical markdown (bold **text**, bullet points, numbered lists)
 */
const renderFormattedClinicalText = (text) => {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, lIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const formattedLine = parts.map((part, pIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={pIdx} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ") || trimmed.startsWith("* ")) {
      return (
        <div key={lIdx} className="flex items-start gap-2 my-1 ml-1 text-slate-800">
          <span className="text-blue-600 font-bold leading-5">•</span>
          <span className="leading-relaxed flex-1">
            {trimmed.slice(2).split(/(\*\*[^*]+\*\*)/g).map((sub, sIdx) => {
              if (sub.startsWith("**") && sub.endsWith("**")) {
                return <strong key={sIdx} className="font-semibold text-slate-900">{sub.slice(2, -2)}</strong>;
              }
              return sub;
            })}
          </span>
        </div>
      );
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const numMatch = trimmed.match(/^(\d+\.)\s*(.*)$/);
      return (
        <div key={lIdx} className="flex items-start gap-2 my-1 ml-1 text-slate-800">
          <span className="text-blue-600 font-bold leading-5 shrink-0">{numMatch?.[1]}</span>
          <span className="leading-relaxed flex-1">
            {numMatch?.[2].split(/(\*\*[^*]+\*\*)/g).map((sub, sIdx) => {
              if (sub.startsWith("**") && sub.endsWith("**")) {
                return <strong key={sIdx} className="font-semibold text-slate-900">{sub.slice(2, -2)}</strong>;
              }
              return sub;
            })}
          </span>
        </div>
      );
    }

    if (trimmed === "") {
      return <div key={lIdx} className="h-2" />;
    }

    return (
      <p key={lIdx} className="my-1 leading-relaxed">
        {formattedLine}
      </p>
    );
  });
};

const DoctorMedicalSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPatientId = searchParams.get("patientId") || "";

  // State: Patients & Selection
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(urlPatientId);
  const [patientReports, setPatientReports] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);

  // Active View Tab: 'ai' | 'records'
  const [activeTab, setActiveTab] = useState("ai");

  // State: Search & Results
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [qaResponse, setQaResponse] = useState(null);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // State: Modal
  const [previewRecord, setPreviewRecord] = useState(null);

  // Load authorized patients on mount
  useEffect(() => {
    fetchAuthorizedPatients();
  }, []);

  // Fetch reports whenever selected patient changes
  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientReports(selectedPatientId);
    } else {
      setPatientReports([]);
    }
  }, [selectedPatientId]);

  const fetchAuthorizedPatients = async () => {
    setLoadingPatients(true);
    try {
      const data = await aiApi.getAuthorizedPatients();
      const list = data?.patients || [];
      setPatients(list);

      // Pre-select patient from URL if valid, or default to first patient
      if (urlPatientId) {
        const cleanParam = urlPatientId.replace(/^PAT-/i, "").toLowerCase();
        const found = list.find((p) => {
          const idStr = (p._id || p.id || "").toString().toLowerCase();
          return idStr === urlPatientId.toLowerCase() || idStr.endsWith(cleanParam);
        });
        if (found) {
          setSelectedPatientId(found._id || found.id);
        } else if (list.length > 0 && !selectedPatientId) {
          setSelectedPatientId(list[0]._id || list[0].id);
        }
      } else if (list.length > 0 && !selectedPatientId) {
        setSelectedPatientId(list[0]._id || list[0].id);
      }
    } catch (err) {
      setError("Could not load authorized patient registry. Please refresh.");
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchPatientReports = async (pId) => {
    setLoadingReports(true);
    try {
      const data = await aiApi.getPatientAuthorizedReports(pId);
      setPatientReports(data?.records || []);
    } catch (err) {
      console.warn("Could not fetch reports for patient:", err);
      setPatientReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  const handlePatientChange = (pId) => {
    setSelectedPatientId(pId);
    setSearchParams(pId ? { patientId: pId } : {});
    setQaResponse(null);
    setHasSearched(false);
    setError("");
  };

  const handleExecute = async (queryText) => {
    const textToSearch = (queryText || query).trim();
    if (!textToSearch) return;

    if (!selectedPatientId) {
      setError("Please select an authorized patient to query.");
      return;
    }

    setError("");
    setSearching(true);
    setHasSearched(true);
    setActiveTab("ai");

    try {
      const payload = {
        patientId: selectedPatientId,
        question: textToSearch,
        topK: 6,
      };

      const res = await aiApi.doctorAskQuestion(payload);
      setQaResponse(res);
    } catch (err) {
      setError(err.message || "Failed to search patient records. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setQaResponse(null);
    setHasSearched(false);
    setError("");
  };

  const selectedPatient = patients.find(
    (p) => (p._id || p.id) === selectedPatientId
  );

  const handleOpenSourceReport = (source) => {
    const matching = patientReports.find(
      (r) =>
        (r._id && r._id.toString() === source.recordId?.toString()) ||
        r.title?.toLowerCase() === source.reportTitle?.toLowerCase()
    );

    if (matching) {
      setPreviewRecord(matching);
    } else {
      setPreviewRecord({
        _id: source.recordId,
        id: source.recordId,
        title: source.reportTitle || "Medical Report",
        reportDate: source.reportDate || "Recent",
        fileUrl: "",
        patient: selectedPatient,
      });
    }
  };

  const handleOpenRecord = (record) => {
    setPreviewRecord({
      ...record,
      patient: selectedPatient,
    });
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Clean Minimal Clinical Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Stethoscope size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Clinical Report Assistant
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review patient records and ask AI clinical questions with cited findings.
            </p>
          </div>
        </div>

        {/* Patient Selector */}
        <div className="w-full sm:w-72 shrink-0">
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Active Patient
          </label>
          <select
            value={selectedPatientId}
            onChange={(e) => handlePatientChange(e.target.value)}
            disabled={loadingPatients}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition cursor-pointer"
          >
            {patients.length === 0 ? (
              <option value="">No authorized patients found</option>
            ) : (
              patients.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name} ({p.gender || "Patient"})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Selected Patient Banner with View Toggle (AI Assistant vs Patient Records) */}
      {selectedPatient && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center shrink-0 text-sm border border-blue-100">
              {selectedPatient?.name
                ? selectedPatient.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()
                : "PT"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900 truncate">
                  {selectedPatient.name}
                </span>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {selectedPatient.gender || "Patient"} • Blood Group {selectedPatient.bloodGroup || "O+"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {patientReports.length} authorized {patientReports.length === 1 ? "report" : "reports"} on file
              </p>
            </div>
          </div>

          {/* Minimal Tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-center">
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                activeTab === "ai"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles size={13} />
              <span>AI Evaluation</span>
            </button>
            <button
              onClick={() => setActiveTab("records")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                activeTab === "records"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FolderOpen size={13} />
              <span>Records ({patientReports.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 1: PATIENT RECORDS LIST */}
      {activeTab === "records" && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FolderOpen size={16} className="text-blue-600" />
              <span>Authorized Reports for {selectedPatient?.name || "Patient"}</span>
            </h2>
            <span className="text-xs text-slate-400">
              Total {patientReports.length} documents
            </span>
          </div>

          {loadingReports ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Loader2 size={20} className="animate-spin mb-2 text-blue-600" />
              Loading records...
            </div>
          ) : patientReports.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No authorized reports available for this patient.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {patientReports.map((rec) => (
                <div
                  key={rec._id || rec.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText size={17} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 truncate">
                        {rec.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {rec.reportDate || "Recent"} • {rec.category || "Report"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenRecord(rec)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition shrink-0 cursor-pointer"
                  >
                    <Eye size={12} />
                    <span>View</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: AI CLINICAL EVALUATION & SEARCH */}
      {activeTab === "ai" && (
        <div className="space-y-4">
          {/* Minimal Search & Question Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleExecute();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Ask any clinical question across all reports of ${selectedPatient?.name || "this patient"}...`}
                  disabled={searching || !selectedPatientId}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                disabled={searching || !query.trim() || !selectedPatientId}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-medium text-sm transition flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
              >
                {searching ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Search size={15} />
                    <span>Ask AI</span>
                  </span>
                )}
              </button>
            </form>

            {/* Quick Clinical Prompts */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                Quick:
              </span>
              {DOCTOR_CLINICAL_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(prompt);
                    handleExecute(prompt);
                  }}
                  disabled={searching || !selectedPatientId}
                  className="text-left text-xs text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/80 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Loading Indicator */}
          {searching && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center space-y-2">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <p className="text-xs font-semibold text-slate-700">
                Reviewing authorized reports for {selectedPatient?.name}...
              </p>
            </div>
          )}

          {/* Clinical Findings Evaluation Card */}
          {!searching && qaResponse && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Sparkles size={14} />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Clinical Evaluation & Findings
                  </h2>
                </div>

                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    qaResponse.status === "answered"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {qaResponse.status === "answered" ? "Evidence Verified" : "Insufficient Evidence"}
                </span>
              </div>

              {/* Formatted Answer */}
              <div className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {renderFormattedClinicalText(qaResponse.answer)}
              </div>

              {/* Clinical Disclaimer */}
              {qaResponse.disclaimer && (
                <div className="pt-2 text-[11px] text-slate-400 italic border-t border-slate-100">
                  {qaResponse.disclaimer}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Record Preview Modal when doctor clicks 'View' on citation or record */}
      {previewRecord && (
        <RecordPreviewModal
          record={previewRecord}
          onClose={() => setPreviewRecord(null)}
        />
      )}
    </div>
  );
};

export default DoctorMedicalSearch;
