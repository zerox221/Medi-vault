import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { userContext } from "../../../Context/UserContext.jsx";
import { doctorApi } from "../../../api/doctorApi";
import {
  Users,
  Clock,
  FileCheck2,
  QrCode,
  ArrowUpRight,
  ShieldCheck,
  Eye,
  Activity,
  FileText,
} from "lucide-react";
import RecordPreviewModal from "../records/RecordPreviewModal";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(userContext);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [liveStats, setLiveStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await doctorApi.getDoctorDashboard();
        if (res?.data) {
          setLiveStats(res.data);
        }
      } catch (err) {
        console.warn("Doctor metrics fetch notice:", err.message);
      }
    };
    fetchStats();
  }, []);

  // Derived metrics from real API data
  const totalPatients = liveStats?.stats?.totalPatients ?? 0;
  const pendingRequests = liveStats?.stats?.pendingRequests ?? 0;
  const approvedRecordsCount = liveStats?.stats?.approvedRecordsCount ?? 0;

  const rawRecords = liveStats?.recentlyAccessed || [];
  const recentlyAccessed = rawRecords.map((r) => ({
    id: r._id || r.id,
    title: r.title,
    category: r.category,
    date: r.reportDate || "Recent",
    patientName: r.patient?.name || "Patient",
    patientId: r.patient?._id ? `PAT-${r.patient._id.slice(-4)}` : "PAT-001",
    lab: r.hospital || "Diagnostic Facility",
    status: "Approved",
    accessExpires: "Active Consultation",
    fileSize: r.fileSize || "1.0 MB",
    summary: r.aiSummary?.summary || "Clinical analysis available.",
    keyValues: r.aiSummary?.keyBiomarkers || [],
    findings: r.aiSummary?.findings || [],
    abnormalValues: r.aiSummary?.abnormalValues || [],
    aiSummary: r.aiSummary,
    fileUrl: r.fileUrl,
  }));

  const rawActivities = liveStats?.activities || [];
  const activities = rawActivities.map((a) => ({
    id: a._id || a.id,
    type: a.action === "approve" ? "consent" : a.action === "request" ? "request" : "audit",
    description: a.description,
    time: a.createdAt
      ? new Date(a.createdAt).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Recent",
  }));

  const doctorName = user?.name
    ? user.name.startsWith("Dr.")
      ? user.name
      : `Dr. ${user.name}`
    : "Dr. Medical Practitioner";
  const doctorSpecialization = user?.specialization || "Clinical Department";
  const doctorHospital = user?.hospitalName || "MediVault Health Network";

  return (
    <div className="space-y-7 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Welcome back, {doctorName}
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {doctorSpecialization} • {doctorHospital}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/doctor/scanner")}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm shadow-xs transition"
          >
            <QrCode size={18} />
            <span>Scan Patient QR</span>
          </button>
        </div>
      </div>

      {/* Verification Status Banner if Pending */}
      {user?.verificationStatus === "PENDING" && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-amber-800">
            <Clock size={16} className="text-amber-600 shrink-0" />
            <span>
              <strong>Medical Credentials Under Review:</strong> Your medical registration number and license documents are currently being verified by the MediVault clinical credentialing board.
            </span>
          </div>
          <button
            onClick={() => navigate("/doctor/profile")}
            className="text-amber-900 font-semibold underline hover:no-underline ml-3 shrink-0"
          >
            View Status
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div
          onClick={() => navigate("/doctor/patients")}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Authorized Patients
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-800">
              {totalPatients}
            </span>
            <span className="text-xs text-blue-600 font-medium group-hover:underline flex items-center gap-0.5">
              View all <ArrowUpRight size={13} />
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Active patient records</p>
        </div>

        {/* Pending Access Requests */}
        <div
          onClick={() => navigate("/doctor/requests")}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Pending Requests
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:scale-105 transition">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-800">
              {pendingRequests}
            </span>
            <span className="text-xs text-blue-600 font-medium group-hover:underline flex items-center gap-0.5">
              Review <ArrowUpRight size={13} />
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Awaiting patient consent</p>
        </div>

        {/* Approved Records */}
        <div
          onClick={() => navigate("/doctor/records")}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Shared Records
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
              <FileCheck2 size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-800">
              {approvedRecordsCount}
            </span>
            <span className="text-xs text-emerald-600 font-medium group-hover:underline flex items-center gap-0.5">
              Inspect <ArrowUpRight size={13} />
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Verified patient files</p>
        </div>

        {/* Digital Verification Status */}
        <div
          onClick={() => navigate("/doctor/profile")}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              NMC Verification
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-800">
              {user?.verificationStatus === "VERIFIED" ? "Verified" : user?.verificationStatus || "Pending"}
            </span>
            <span className="text-xs text-indigo-600 font-medium group-hover:underline flex items-center gap-0.5">
              License <ArrowUpRight size={13} />
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {user?.medicalRegistrationNumber || "Registration active"}
          </p>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-3">
          Clinical Operations
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => navigate("/doctor/scanner")}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition group text-center"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <QrCode size={20} />
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700">
              Scan Patient QR
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Initiate access request
            </span>
          </button>

          <button
            onClick={() => navigate("/doctor/requests")}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition group text-center"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Clock size={20} />
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700">
              Access Requests
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              {pendingRequests} pending authorization
            </span>
          </button>

          <button
            onClick={() => navigate("/doctor/patients")}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition group text-center"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <Users size={20} />
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700">
              My Patients
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Directory & shared count
            </span>
          </button>

          <button
            onClick={() => navigate("/doctor/records")}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition group text-center"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
              <FileCheck2 size={20} />
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-700">
              Shared Records
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              View authorized reports
            </span>
          </button>
        </div>
      </div>

      {/* Main Grid: Recently Accessed Records & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recently Accessed Records (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Recently Accessed Records
              </h3>
              <p className="text-xs text-slate-500">
                Patient records authorized and recently reviewed by you
              </p>
            </div>
            <button
              onClick={() => navigate("/doctor/records")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all records &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {recentlyAccessed.length > 0 ? (
              recentlyAccessed.map((record) => (
                <div
                  key={record.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">
                        {record.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-slate-600">
                          {record.patientName}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-400">
                          {record.category}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-400">
                          {record.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      <ShieldCheck size={11} />
                      Approved
                    </span>
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
                    >
                      <Eye size={14} />
                      View
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
                No recently accessed medical records. Records approved by patients will appear here.
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">
              Recent Activity
            </h3>
            <span className="text-xs text-slate-400">Audit Trail</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs divide-y divide-slate-100">
            {activities.length > 0 ? (
              activities.map((act) => (
                <div key={act.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs ${
                        act.type === "consent"
                          ? "bg-emerald-100 text-emerald-700"
                          : act.type === "scan"
                          ? "bg-blue-100 text-blue-700"
                          : act.type === "request"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {act.type === "consent" ? (
                        <ShieldCheck size={14} />
                      ) : act.type === "scan" ? (
                        <QrCode size={14} />
                      ) : act.type === "request" ? (
                        <Clock size={14} />
                      ) : (
                        <FileText size={14} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {act.description}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {act.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">
                No recent audit activities recorded.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Record Preview Modal */}
      {selectedRecord && (
        <RecordPreviewModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};

export default DoctorDashboard;
