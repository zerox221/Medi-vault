import React, { useState } from "react";
import {
  X,
  Send,
  Clock,
  Loader2,
} from "lucide-react";
import { sharingApi } from "../../../api/sharingApi";

const availableRecordOptions = [
  "Complete Blood Count (CBC)",
  "Blood Sugar (HbA1c / Fasting)",
  "Lipid Profile Full Panel",
  "Electrocardiogram (ECG / EKG)",
  "Echocardiogram (Echo Doppler)",
  "CT Coronary Angiography",
  "Holter Monitor 24hr Report",
  "Thyroid Function Panel (T3, T4, TSH)",
  "Chest X-Ray PA View",
  "Prescriptions & Discharge Summaries",
];

const NewRequestModal = ({ onClose, onSubmitRequest }) => {
  const [patientEmail, setPatientEmail] = useState("");
  const [patientName, setPatientName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [expiry, setExpiry] = useState("48 Hours");
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleRecord = (rec) => {
    setSelectedRecords((prev) =>
      prev.includes(rec) ? prev.filter((r) => r !== rec) : [...prev, rec]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientEmail.trim()) {
      setError("Please provide patient email address.");
      return;
    }
    if (selectedRecords.length === 0) {
      setError("Please select at least one record type to request.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const hours = expiry.includes("24") ? 24 : expiry.includes("48") ? 48 : expiry.includes("7") ? 168 : 720;
      const res = await sharingApi.requestAccess({
        patientEmail: patientEmail.trim(),
        purpose: purpose.trim() || "Clinical consultation and diagnostic review",
        expiryHours: hours,
      });

      if (onSubmitRequest) onSubmitRequest(res?.request);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit access request. Please check patient email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              New Medical Records Access Request
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Patient authorization is required before records become viewable.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Patient Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Patient Full Name (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Patient Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="patient@example.com"
              value={patientEmail}
              onChange={(e) => {
                setPatientEmail(e.target.value);
                setError("");
              }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Requested Record Types */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Record Categories Needed <span className="text-red-500">*</span>
            </label>
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2.5 divide-y divide-slate-100 bg-slate-50/50">
              {availableRecordOptions.map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-2 py-1.5 px-1 cursor-pointer hover:bg-slate-100/60 rounded text-xs text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedRecords.includes(opt)}
                    onChange={() => toggleRecord(opt)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Clinical Purpose */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical Reason / Purpose of Access
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Cardiac consultation & evaluation of exertional symptoms"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Requested Access Duration
            </label>
            <select
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500"
            >
              <option value="24 Hours">24 Hours</option>
              <option value="48 Hours">48 Hours</option>
              <option value="7 Days">7 Days</option>
              <option value="30 Days">30 Days</option>
            </select>
          </div>

          {/* Consent reminder */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
            <Clock size={16} className="shrink-0 mt-0.5 text-amber-600" />
            <span>
              <strong>Zero-Trust Protocol:</strong> The patient will receive an authorization prompt in their MediVault app. Records remain locked until authorized.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition"
            >
              <Send size={14} />
              Send Access Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewRequestModal;
