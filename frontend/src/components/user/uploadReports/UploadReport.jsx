import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  ExternalLink,
} from "lucide-react";

import UploadPageHeader from "./UploadPageHeader";
import UploadDropzone from "./UploadDropzone";
import ReportDetailsForm from "./ReportDetailsForm";
import { recordsApi } from "../../../api/recordsApi";

const UploadReport = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [uploadedRecord, setUploadedRecord] = useState(null);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleCancel = () => {
    setFile(null);
    setError("");
    setUploadedRecord(null);
  };

  const handleUpload = async (formData) => {
    if (!file) return;

    setError("");
    setUploading(true);
    setProgress(10);
    setStatusMessage("Encrypting and uploading medical report to secure Cloudinary vault...");

    try {
      const data = new FormData();
      data.append("file", file);
      data.append("reportName", formData.reportName);
      data.append("reportType", formData.reportType);
      data.append("category", formData.reportType);
      data.append("reportDate", formData.reportDate);
      if (formData.hospital) data.append("hospital", formData.hospital);
      if (formData.doctorName) data.append("doctorName", formData.doctorName);

      const res = await recordsApi.uploadRecord(data, (percent) => {
        setProgress(Math.min(percent, 85));
        if (percent >= 85) {
          setStatusMessage("Extracting text and generating Google Gemini AI Clinical Summary...");
        }
      });

      setProgress(100);
      setStatusMessage("Done!");
      setUploadedRecord(res.record);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload medical report. Please check the PDF file and try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleResetForNext = () => {
    setFile(null);
    setUploadedRecord(null);
    setProgress(0);
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-4 lg:px-10 pb-16">
      <div className="max-w-[800px] mx-auto space-y-5">
        {/* PAGE HEADER */}
        <UploadPageHeader />

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 animate-in fade-in">
            <AlertCircle size={18} className="shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-semibold">Upload Failed</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* UPLOAD IN PROGRESS INDICATOR */}
        {uploading && (
          <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-sm space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2 text-blue-700">
                <RefreshCw size={14} className="animate-spin text-blue-600" />
                {statusMessage}
              </span>
              <span className="text-slate-500">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Your document is securely encrypted and stored with authenticated private permissions.
            </p>
          </div>
        )}

        {/* SUCCESS & AI SUMMARY CARD */}
        {uploadedRecord && (
          <div className="bg-white border border-emerald-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-800">
                      {uploadedRecord.title}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <ShieldCheck size={12} />
                      Cloudinary Stored
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {uploadedRecord.category} • {uploadedRecord.hospital} • {uploadedRecord.reportDate} • {uploadedRecord.fileSize}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/user/reports")}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
                >
                  View in My Reports
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={handleResetForNext}
                  className="px-3.5 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Upload Another
                </button>
              </div>
            </div>

            {/* AI Summary Section */}
            {uploadedRecord.aiSummary && (
              <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-slate-50 border border-blue-200 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                      Gemini AI Clinical Summary
                    </h4>
                    <p className="text-[11px] text-blue-700">
                      Automated analysis of extracted report data
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-normal bg-white/70 p-3.5 rounded-lg border border-blue-100">
                  {uploadedRecord.aiSummary.summary}
                </p>

                {/* Key Biomarkers if present */}
                {uploadedRecord.aiSummary.keyBiomarkers &&
                  uploadedRecord.aiSummary.keyBiomarkers.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        Extracted Biomarkers & Test Values
                      </h5>
                      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3">Parameter</th>
                              <th className="py-2 px-3">Result</th>
                              <th className="py-2 px-3">Normal Reference</th>
                              <th className="py-2 px-3 text-right">Flag</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {uploadedRecord.aiSummary.keyBiomarkers.map((b, i) => (
                              <tr key={i} className="hover:bg-slate-50/50">
                                <td className="py-2 px-3 font-medium text-slate-800">
                                  {b.parameter}
                                </td>
                                <td className="py-2 px-3 font-semibold text-slate-900">
                                  {b.value}
                                </td>
                                <td className="py-2 px-3 text-slate-500">
                                  {b.normalRange || "Reference standard"}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      b.flag === "Normal"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-amber-50 text-amber-700 border border-amber-200"
                                    }`}
                                  >
                                    {b.flag || "Recorded"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                {/* Clinical Disclaimer */}
                <p className="text-[10px] text-slate-400 italic leading-normal">
                  ⚠️ {uploadedRecord.aiSummary.disclaimer}
                </p>
              </div>
            )}
          </div>
        )}

        {/* UPLOAD FORM (When not already uploaded) */}
        {!uploadedRecord && (
          <>
            {/* PDF DROPZONE */}
            <UploadDropzone
              file={file}
              setFile={setFile}
            />

            {/* REPORT DETAILS FORM */}
            <ReportDetailsForm
              file={file}
              uploading={uploading}
              onCancel={handleCancel}
              onUpload={handleUpload}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default UploadReport;
