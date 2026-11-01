import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  User,
  Stethoscope,
  Building2,
  Trash2,
  Loader2,
  RefreshCw,
  Lock,
  Unlock,
} from "lucide-react";
import { sharingApi } from "../../../api/sharingApi";
import ApproveSharingModal from "./ApproveSharingModal";

export default function PatientAccessRequests({ onCountChange }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeModalRequest, setActiveModalRequest] = useState(null);
  const [revokingId, setRevokingId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await sharingApi.getPatientSharingRequests();
      const list = data.requests || [];
      setRequests(list);

      const pendingCount = list.filter((r) => r.status === "pending").length;
      if (onCountChange) onCountChange(pendingCount);
    } catch (err) {
      console.warn("Could not load sharing requests:", err.message);
      setError(err.message || "Failed to load access requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRevoke = async (id, doctorName) => {
    const confirmRevoke = window.confirm(
      `Are you sure you want to revoke medical records access for Dr. ${doctorName}? The doctor will immediately lose access.`
    );
    if (!confirmRevoke) return;

    setRevokingId(id);
    try {
      await sharingApi.revokeSharingAccess(id);
      fetchRequests();
    } catch (err) {
      alert(err.message || "Failed to revoke access.");
    } finally {
      setRevokingId(null);
    }
  };

  const handleModalSuccess = () => {
    fetchRequests();
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const historyRequests = requests.filter(
    (r) => r.status === "rejected" || r.status === "revoked" || r.status === "expired"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">
            Doctor Access Authorization Requests
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Under MediVault Zero-Trust, you hold absolute authority to grant or revoke medical records access.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          disabled={loading}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          title="Refresh requests"
        >
          <RefreshCw size={16} className={loading ? "animate-spin text-blue-600" : ""} />
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && requests.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
          <Loader2 size={24} className="animate-spin text-blue-600" />
          <span>Loading authorization requests...</span>
        </div>
      ) : (
        <>
          {/* 1. PENDING REQUESTS (ACTION REQUIRED) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Clock size={14} className="text-amber-600" />
                Pending Requests Awaiting Your Approval ({pendingRequests.length})
              </span>
            </div>

            {pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req._id}
                    className="p-5 rounded-2xl bg-white border-2 border-amber-300 shadow-sm space-y-4 animate-in fade-in"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                          <Stethoscope size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-800">
                              Dr. {req.doctor?.name || "Practicing Physician"}
                            </h4>
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Action Required
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {req.doctor?.specialization || "General Medicine"} • {req.doctor?.hospitalName || "Clinical Consultation"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => setActiveModalRequest(req)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                        >
                          <ShieldCheck size={14} />
                          Authorize Access
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">PURPOSE / CLINICAL REASON</span>
                        <p className="text-slate-700 font-medium italic mt-0.5">
                          "{req.purpose || "Clinical evaluation and medical records review"}"
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">REQUESTED ON</span>
                        <p className="text-slate-600 mt-0.5">
                          {new Date(req.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                ✅ No pending doctor access requests. All incoming authorization requests will appear here.
              </div>
            )}
          </div>

          {/* 2. ACTIVE AUTHORIZED PERMISSIONS */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              Active Doctor Access Grants ({approvedRequests.length})
            </span>

            {approvedRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {approvedRequests.map((req) => (
                  <div
                    key={req._id}
                    className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                          <Unlock size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">
                            Dr. {req.doctor?.name || "Doctor"}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {req.doctor?.specialization || "Physician"}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Unlocked
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex justify-between">
                        <span>Authorized Records:</span>
                        <span className="font-semibold text-slate-700">{req.records?.length || 0} files</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expires At:</span>
                        <span className="font-semibold text-slate-700">
                          {req.expiresAt ? new Date(req.expiresAt).toLocaleDateString() : "Active"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleRevoke(req._id, req.doctor?.name)}
                        disabled={revokingId === req._id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                      >
                        {revokingId === req._id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                        <span>Revoke Access</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                No active doctor permissions currently granted.
              </div>
            )}
          </div>

          {/* 3. HISTORY LOG */}
          {historyRequests.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Past Access Decisions History ({historyRequests.length})
              </span>

              <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-2xl overflow-hidden text-xs">
                {historyRequests.slice(0, 5).map((req) => (
                  <div key={req._id} className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">
                        Dr. {req.doctor?.name || "Doctor"}
                      </span>
                      <span className="text-slate-400 block text-[11px]">
                        {req.purpose || "Consultation"} • {new Date(req.updatedAt || req.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        req.status === "rejected"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Authorize Modal */}
      <ApproveSharingModal
        isOpen={Boolean(activeModalRequest)}
        request={activeModalRequest}
        onClose={() => setActiveModalRequest(null)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
