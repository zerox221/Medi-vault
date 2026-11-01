import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Search,
  FileText,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Lock,
  Unlock,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import NewRequestModal from "./NewRequestModal";
import { doctorApi } from "../../../api/doctorApi";

const AccessRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [lockedAlert, setLockedAlert] = useState(null);

  const fetchRequests = async () => {
    try {
      const res = await doctorApi.getDoctorRequests();
      if (res?.requests) {
        const mapped = res.requests.map((r) => ({
          id: r._id,
          patientName: r.patient?.name || "Patient",
          patientEmail: r.patient?.email || "patient@example.com",
          patientPhone: r.patient?.phone || "+91 XXXXX XXXXX",
          patientAge: r.patient?.dateOfBirth
            ? new Date().getFullYear() - new Date(r.patient.dateOfBirth).getFullYear()
            : 30,
          patientGender: r.patient?.gender || "Patient",
          requestedRecords:
            Array.isArray(r.records) && r.records.length > 0
              ? r.records.map((rec) => rec.title || "Medical Record")
              : ["All Patient Medical Records"],
          requestDate: r.requestDate
            ? new Date(r.requestDate).toLocaleDateString()
            : r.createdAt
            ? new Date(r.createdAt).toLocaleDateString()
            : "Recent",
          approvedDate: r.approvedDate
            ? new Date(r.approvedDate).toLocaleDateString()
            : null,
          status: r.status,
          expiryDate: r.expiryDate
            ? new Date(r.expiryDate).toLocaleDateString()
            : null,
          notes: r.notes || r.purpose || "Clinical consultation and records review",
        }));
        setRequests(mapped);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.warn("Could not fetch doctor access requests:", err.message);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Counts
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  // Filtered
  const filteredRequests = requests.filter((req) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      req.patientName.toLowerCase().includes(q) ||
      req.patientEmail.toLowerCase().includes(q) ||
      req.id.toLowerCase().includes(q) ||
      req.requestedRecords.some((r) => r.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === "all" || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleAddNewRequest = (newReq) => {
    setRequests([newReq, ...requests]);
    fetchRequests();
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Access Requests
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track authorization requests sent to patients for accessing their encrypted health records.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>New Access Request</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setStatusFilter("pending")}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            statusFilter === "pending"
              ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20"
              : "bg-white border-slate-200 hover:border-amber-200"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Pending Patient Approval</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">
            {pendingCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Awaiting digital consent from patient
          </p>
        </div>

        <div
          onClick={() => setStatusFilter("approved")}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            statusFilter === "approved"
              ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20"
              : "bg-white border-slate-200 hover:border-emerald-200"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Approved & Active</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">
            {approvedCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Records currently accessible
          </p>
        </div>

        <div
          onClick={() => setStatusFilter("rejected")}
          className={`p-4 rounded-xl border transition cursor-pointer ${
            statusFilter === "rejected"
              ? "bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/20"
              : "bg-white border-slate-200 hover:border-rose-200"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Declined / Expired</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">
            {rejectedCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Access denied or timed out
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name, email, request ID, or test type..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto pb-1 sm:pb-0">
          {["all", "pending", "approved", "rejected"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition shrink-0 ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
          <Loader2 size={24} className="animate-spin text-blue-600" />
          <span>Loading authorization requests...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FileText size={22} />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            No access requests found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You have not created any record authorization requests yet. Click 'New Access Request' to send a request to a patient.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const isApproved = req.status === "approved";
            const isPending = req.status === "pending";
            const isRejected = req.status === "rejected" || req.status === "revoked";

            return (
              <div
                key={req.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition space-y-4"
              >
                {/* Top Row: Patient Info + Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {req.patientName
                        ? req.patientName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                        : "P"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800">
                          {req.patientName}
                        </h4>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">
                          {req.patientAge} Yrs • {req.patientGender}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {req.patientEmail} • {req.patientPhone}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        isApproved
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isPending
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {isApproved ? (
                        <>
                          <CheckCircle size={13} /> Approved
                        </>
                      ) : isPending ? (
                        <>
                          <Clock size={13} /> Pending Patient Approval
                        </>
                      ) : (
                        <>
                          <XCircle size={13} /> Access Declined
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Middle: Requested Record Types Tags */}
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block mb-1.5 uppercase">
                    Requested Documents & Diagnostic Scope:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {req.requestedRecords.map((r, i) => (
                      <span
                        key={i}
                        className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Row: Metadata & Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>
                      Requested: <strong className="text-slate-700">{req.requestDate}</strong>
                    </span>
                    {req.approvedDate && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>
                          Approved: <strong className="text-slate-700">{req.approvedDate}</strong>
                        </span>
                      </>
                    )}
                    {req.expiryDate && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>
                          Valid until: <strong className="text-slate-700">{req.expiryDate}</strong>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Context Actions */}
                  <div className="flex items-center gap-2">
                    {isApproved ? (
                      <button
                        onClick={() => navigate(`/doctor/records?patient=${encodeURIComponent(req.patientName)}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
                      >
                        <Unlock size={13} />
                        <span>View Shared Records</span>
                        <ArrowUpRight size={13} />
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          setLockedAlert(
                            `Patient '${req.patientName}' has not yet approved this access request. Once approved, the encrypted medical documents will appear in your 'Shared Records' console automatically.`
                          )
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 transition"
                      >
                        <Lock size={13} />
                        <span>Awaiting Consent</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Purpose Note if available */}
                {req.notes && (
                  <div className="p-2.5 rounded-lg bg-slate-50 text-[11px] text-slate-600 border border-slate-100">
                    <strong>Purpose:</strong> {req.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Locked Alert Modal / Popup */}
      {lockedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-amber-200 w-full max-w-md p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Lock size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Access Restricted — Patient Approval Required
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {lockedAlert}
            </p>
            <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500">
              MediVault ensures patients maintain full ownership of their health data. You can notify the patient to review the request in their portal.
            </div>
            <button
              onClick={() => setLockedAlert(null)}
              className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showNewModal && (
        <NewRequestModal
          onClose={() => setShowNewModal(false)}
          onSubmitRequest={handleAddNewRequest}
        />
      )}
    </div>
  );
};

export default AccessRequests;
