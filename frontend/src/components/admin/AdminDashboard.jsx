import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  FileText,
  Share2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Building2,
  Clock,
} from "lucide-react";
import { adminApi } from "../../api/adminApi";

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const res = await adminApi.getAdminDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load admin metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleVerifyDoctor = async (doctorId) => {
    setProcessingId(doctorId);
    try {
      await adminApi.verifyDoctor(doctorId);
      await fetchDashboardData();
    } catch (err) {
      alert(err.message || "Failed to verify doctor.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectDoctor = async (doctorId) => {
    const reason = window.prompt(
      "Please enter the reason for rejection (optional):",
      "Submitted credentials did not match state medical council registration records."
    );
    if (reason === null) return;

    setProcessingId(doctorId);
    try {
      await adminApi.rejectDoctor(doctorId, reason);
      await fetchDashboardData();
    } catch (err) {
      alert(err.message || "Failed to reject doctor.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
        <Loader2 size={28} className="animate-spin text-blue-600" />
        <span>Aggregating platform audit metrics...</span>
      </div>
    );
  }

  const stats = data?.stats || {
    totalPatients: 0,
    totalDoctors: 0,
    pendingDoctors: 0,
    verifiedDoctors: 0,
    totalRecords: 0,
    activeShares: 0,
  };

  const pendingDoctors = data?.pendingDoctorsList || [];
  const recentActivities = data?.recentActivities || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Platform Administration Dashboard
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor platform metrics, process doctor compliance verifications, and audit access permissions.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Registered Patients</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-3">{stats.totalPatients}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Encrypted patient vaults</span>
        </div>

        {/* Pending Verifications */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Pending Doctor Reviews</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <ShieldAlert size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-3">{stats.pendingDoctors}</p>
          <span className="text-[11px] text-amber-700 font-medium">Awaiting council credential check</span>
        </div>

        {/* Verified Doctors */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Verified Practitioners</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-3">{stats.verifiedDoctors}</p>
          <span className="text-[11px] text-slate-400">Out of {stats.totalDoctors} total registered</span>
        </div>

        {/* Medical Records */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Medical Reports Uploaded</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-3">{stats.totalRecords}</p>
          <span className="text-[11px] text-indigo-600 font-medium">Stored in Cloudinary Vault</span>
        </div>
      </div>

      {/* Pending Doctor Verification Queue */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Doctor Verification Queue
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Doctors awaiting administrator review before they can scan patient QR codes or access medical records.
            </p>
          </div>
          <Link
            to="/admin/doctors"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View All Doctors <ArrowRight size={13} />
          </Link>
        </div>

        {pendingDoctors.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
            <p className="text-xs font-semibold text-slate-700">Verification Queue Clear</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              All submitted doctor licenses and credentials have been reviewed.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingDoctors.map((doc) => (
              <div
                key={doc._id}
                className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {doc.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-800">
                        Dr. {doc.name}
                      </h4>
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        PENDING
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {doc.specialization} • {doc.qualification}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span>Reg: <strong className="text-slate-600">{doc.medicalRegistrationNumber}</strong></span>
                      <span>Council: {doc.registeredCouncil}</span>
                      {doc.hospitalName && <span>Hospital: {doc.hospitalName}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleRejectDoctor(doc._id)}
                    disabled={processingId === doc._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition disabled:opacity-50"
                  >
                    <XCircle size={14} />
                    Reject
                  </button>
                  <button
                    onClick={() => handleVerifyDoctor(doc._id)}
                    disabled={processingId === doc._id}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition shadow-xs disabled:opacity-50"
                  >
                    {processingId === doc._id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    Verify & Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Platform Recent Audit Logs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              System Audit Trail
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live cryptographic log of uploads, sharing requests, doctor scans, and admin decisions.
            </p>
          </div>
          <Link
            to="/admin/activity"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            All Logs <ArrowRight size={13} />
          </Link>
        </div>

        {recentActivities.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">No system activities recorded yet.</p>
        ) : (
          <div className="space-y-2.5">
            {recentActivities.slice(0, 6).map((act) => (
              <div
                key={act._id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${
                    act.action.includes("verify") ? "bg-emerald-500" :
                    act.action.includes("upload") ? "bg-blue-500" :
                    act.action.includes("reject") ? "bg-red-500" : "bg-slate-400"
                  }`} />
                  <span className="font-medium text-slate-700">{act.description}</span>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {act.createdAt ? new Date(act.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
