import React, { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";

const ReportDetailsForm = ({ file, onCancel, onUpload, uploading }) => {
  const [validationError, setValidationError] = useState("");
  const [formData, setFormData] = useState({
    reportName: "",
    reportType: "Blood Test",
    reportDate: new Date().toISOString().split("T")[0],
    hospital: "",
    doctorName: "",
  });

  // Auto-fill report name from filename when file is selected
  useEffect(() => {
    if (file) {
      setValidationError("");
      if (!formData.reportName) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[_-]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        setFormData((prev) => ({ ...prev, reportName: cleanName }));
      }
    }
  }, [file]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError("");

    if (!file) {
      setValidationError("Please select or drop a PDF medical report first in the box above.");
      return;
    }

    onUpload(formData);
  };

  const inputClass =
    "w-full h-[38px] px-3.5 border border-slate-200 rounded-lg " +
    "text-xs text-slate-700 outline-none focus:border-blue-500 " +
    "focus:ring-2 focus:ring-blue-100 transition bg-white";

  const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5";

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4"
    >
      <div>
        <h3 className="text-sm font-bold text-slate-800">
          Report Information
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Provide contextual details to assist the AI clinical parser and timeline organization.
        </p>
      </div>

      {/* Report Name */}
      <div>
        <label className={labelClass}>
          Report Title *
        </label>
        <input
          type="text"
          name="reportName"
          placeholder="e.g. Complete Blood Count (CBC) Panel"
          value={formData.reportName}
          onChange={handleChange}
          required
          disabled={uploading}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Report Category */}
        <div>
          <label className={labelClass}>
            Category *
          </label>
          <select
            name="reportType"
            value={formData.reportType}
            onChange={handleChange}
            required
            disabled={uploading}
            className={inputClass}
          >
            <option value="Blood Test">Blood Test</option>
            <option value="Blood Sugar">Blood Sugar (HbA1c / Glucose)</option>
            <option value="Lab Reports">General Lab Reports</option>
            <option value="Cardiology">Cardiology (ECG / Echo / Holter)</option>
            <option value="Radiology">Radiology (X-Ray / MRI / CT Scan)</option>
            <option value="Prescription">Prescription</option>
            <option value="General Checkup">General Health Checkup</option>
            <option value="Other">Other Diagnostic Document</option>
          </select>
        </div>

        {/* Report Date */}
        <div>
          <label className={labelClass}>
            Report Date *
          </label>
          <input
            type="date"
            name="reportDate"
            value={formData.reportDate}
            onChange={handleChange}
            required
            disabled={uploading}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Hospital */}
        <div>
          <label className={labelClass}>
            Diagnostic Center / Hospital
          </label>
          <input
            type="text"
            name="hospital"
            placeholder="e.g. Apollo Diagnostics"
            value={formData.hospital}
            onChange={handleChange}
            disabled={uploading}
            className={inputClass}
          />
        </div>

        {/* Doctor Name */}
        <div>
          <label className={labelClass}>
            Attending Doctor (Optional)
          </label>
          <input
            type="text"
            name="doctorName"
            placeholder="e.g. Dr. Rajesh Mehta"
            value={formData.doctorName}
            onChange={handleChange}
            disabled={uploading}
            className={inputClass}
          />
        </div>
      </div>

      {validationError && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 animate-in fade-in">
          <AlertCircle size={15} className="shrink-0 text-amber-600" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={uploading}
          className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer"
        >
          Reset
        </button>

        <button
          type="submit"
          disabled={uploading}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {uploading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Uploading & Generating AI Summary...
            </>
          ) : (
            "Upload Report"
          )}
        </button>
      </div>
    </form>
  );
};

export default ReportDetailsForm;
