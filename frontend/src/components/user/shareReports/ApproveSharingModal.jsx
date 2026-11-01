import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  X,
  CheckCircle2,
  AlertTriangle,
  User,
  Stethoscope,
  Building2,
  Clock,
  FileText,
  Loader2,
  Lock,
} from "lucide-react";
import { sharingApi } from "../../../api/sharingApi";
import { recordsApi } from "../../../api/recordsApi";

export default function ApproveSharingModal({
  isOpen,
  request,
  onClose,
  onSuccess,
}) {
  const [patientRecords, setPatientRecords] = useState([]);
  const [selectedRecordIds, setSelectedRecordIds] = useState([]);
  const [expiryHours, setExpiryHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submittingAction, setSubmittingAction] = useState(""); // 'approve' | 'reject'

  useEffect(() => {
    if (!isOpen || !request) return;

    setError("");
    // If request already has specific records requested, pre-select them
    if (request.records && request.records.length > 0) {
      setSelectedRecordIds(request.records.map((r) => r._id || r.id || r));
    }

    // Fetch patient's full records to allow custom selection
    const loadRecords = async () => {
      try {
        const res = await recordsApi.getPatientRecords();
        if (res?.records) {
          setPatientRecords(res.records);
          if (!request.records || request.records.length === 0) {
            setSelectedRecordIds(res.records.map((r) => r._id));
          }
        }
      } catch (err) {
        console.warn("Could not load records for modal:", err.message);
      }
    };

    loadRecords();
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const doctor = request.doctor || {};

  const handleToggleRecord = (id) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedRecordIds(patientRecords.map((r) => r._id));
  };

  const handleDeselectAll = () => {
    setSelectedRecordIds([]);
  };

  const handleApprove = async () => {
    if (selectedRecordIds.length === 0) {
      setError("Please select at least one medical record to authorize.");
      return;
    }

    setSubmittingAction("approve");
    setLoading(true);
    setError("");

    try {
      await sharingApi.approveSharingRequest(request._id || request.id, {
        selectedRecords: selectedRecordIds,
        expiryHours: parseInt(expiryHours, 10) || 24,
      });

      if (onSuccess) onSuccess("approved");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to authorize access.");
    } finally {
      setLoading(false);
      setSubmittingAction("");
    }
  };

  const handleReject = async () => {
    const confirmReject = window.confirm("Are you sure you want to decline this doctor access request?");
    if (!confirmReject) return;

    setSubmittingAction("reject");
    setLoading(true);
    setError("");

    try {
      await sharingApi.rejectSharingRequest(request._id || request.id);
      if (onSuccess) onSuccess("rejected");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to decline request.");
    } finally {
      setLoading(false);
      setSubmittingAction("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Authorize Doctor Records Access
              </h3>
              <p className="text-xs text-slate-500">
                Grant temporary, cryptographic permission to view your diagnostic reports.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Doctor Info Card */}
          <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                  Requesting Physician
                </span>
                <h4 className="text-sm font-bold text-slate-800 mt-0.5">
                  Dr. {doctor.name || "Authorized Physician"}
                </h4>
                <p className="text-xs text-blue-700 font-medium">
                  {doctor.specialization || "General Medicine"} • {doctor.qualification || "Registered Medical Practitioner"}
                </p>
              </div>

              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                Verified Doctor
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-100 text-[11px] text-slate-600">
              <div>
                <span className="text-slate-400 block">HOSPITAL / CLINIC</span>
                <span className="font-semibold text-slate-700 truncate block mt-0.5">
                  {doctor.hospitalName || "Clinical Consultation"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">REGISTRATION NUMBER</span>
                <span className="font-semibold text-slate-700 block mt-0.5">
                  {doctor.medicalRegistrationNumber || "Verified"}
                </span>
              </div>
            </div>
          </div>

          {/* Clinical Purpose */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Clinical Purpose Stated By Doctor:
            </span>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-medium italic">
              "{request.purpose || "Clinical evaluation and medical records review"}"
            </div>
          </div>

          {/* Report Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Select Medical Records to Share ({selectedRecordIds.length} of {patientRecords.length})
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-slate-500 hover:underline cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
              {patientRecords.map((rec) => {
                const isSelected = selectedRecordIds.includes(rec._id);
                return (
                  <div
                    key={rec._id}
                    onClick={() => handleToggleRecord(rec._id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 border-blue-300 text-blue-900"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <FileText size={16} className={isSelected ? "text-blue-600" : "text-slate-400"} />
                      <div className="truncate">
                        <span className="font-semibold block truncate text-xs">{rec.title}</span>
                        <span className="text-[10px] text-slate-400 block">{rec.category} • {rec.reportDate}</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-medium text-slate-400 shrink-0 ml-2">
                      {rec.fileSize || "PDF"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Access Duration */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Access Duration (Auto-Revokes Afterward):
            </label>
            <select
              value={expiryHours}
              onChange={(e) => setExpiryHours(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition cursor-pointer"
            >
              <option value={1}>1 Hour (Quick Consultation)</option>
              <option value={6}>6 Hours (Outpatient Visit)</option>
              <option value={24}>24 Hours (Standard 1 Day)</option>
              <option value={48}>48 Hours (2 Days)</option>
              <option value={168}>7 Days (Weekly Follow-up)</option>
              <option value={720}>30 Days (Extended Treatment)</option>
            </select>
          </div>

          {/* Patient Revocation Notice */}
          <div className="p-3 rounded-xl bg-slate-100 text-[11px] text-slate-600 flex items-center gap-2">
            <Lock size={14} className="text-slate-500 shrink-0" />
            <span>You retain full authority. You can revoke access at any second from your dashboard.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReject}
            disabled={loading}
            className="px-4 py-2.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            {loading && submittingAction === "reject" ? "Declining..." : "Decline Request"}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={loading || selectedRecordIds.length === 0}
              className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && submittingAction === "approve" ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Authorizing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Authorize & Unlock Records</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
