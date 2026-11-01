import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Droplet,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { doctorApi } from "../../../api/doctorApi";

const PatientDetailsModal = ({ patient, onClose, onSelectRecord }) => {
  const navigate = useNavigate();
  const [patientRecords, setPatientRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientRecords = async () => {
      if (!patient) return;
      try {
        const res = await doctorApi.getDoctorRecords();
        const records = res?.records || [];
        const filtered = records
          .filter(
            (r) =>
              r.patient?._id === patient.id ||
              r.patient?.email === patient.email ||
              r.patient?.name === patient.name
          )
          .map((r) => ({
            id: r._id,
            title: r.title,
            category: r.category,
            date: r.reportDate || "Recent",
            patientName: r.patient?.name || patient.name,
            patientId: patient.id,
            patientAge: patient.age || 30,
            patientGender: patient.gender || "Patient",
            patientBlood: patient.bloodGroup || "O+",
            lab: r.hospital || "Diagnostic Facility",
            accessExpires: "Active Consultation",
            status: "Approved",
            summary: r.aiSummary?.summary,
            keyValues: r.aiSummary?.keyBiomarkers || [],
            findings: r.aiSummary?.findings || [],
            abnormalValues: r.aiSummary?.abnormalValues || [],
            fileUrl: r.fileUrl,
          }));
        setPatientRecords(filtered);
      } catch (err) {
        console.warn("Could not fetch patient records:", err.message);
        setPatientRecords([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientRecords();
  }, [patient]);

  if (!patient) return null;

  const handleAskAI = () => {
    onClose();
    navigate(`/doctor/search?patientId=${patient.id || patient._id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
              {patient.name
                ? patient.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                : "P"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">
                  {patient.name}
                </h3>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    patient.status === "Active"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {patient.status || "Active"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Patient ID: {patient.id} • Last consultation: {patient.lastVisit || "Recent"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAskAI}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition"
              title="Query all records for this patient with AI"
            >
              <Sparkles size={13} />
              <span>Ask AI (All Reports)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700">
          {/* Quick Demographics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Age / Gender</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {patient.age || "N/A"} Yrs • {patient.gender || "Patient"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                <Droplet size={11} className="text-rose-500" /> Blood Group
              </span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {patient.bloodGroup || "Recorded in file"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Active Authorization</span>
              <span className="font-semibold text-emerald-700 mt-0.5 block">
                Patient Consent Granted
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Approved Records</span>
              <span className="font-semibold text-blue-600 mt-0.5 block">
                {patientRecords.length} records available
              </span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Contact & Location
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl">
                <Mail size={15} className="text-slate-400" />
                <span className="text-slate-700">{patient.email}</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl">
                <Phone size={15} className="text-slate-400" />
                <span className="text-slate-700">{patient.phone}</span>
              </div>
              <div className="sm:col-span-2 flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl">
                <MapPin size={15} className="text-slate-400" />
                <span className="text-slate-700">{patient.address || "Contact patient for address details"}</span>
              </div>
            </div>
          </div>

          {/* Shared Records List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Authorized Records Shared With You ({patientRecords.length})
              </h4>
              <button
                onClick={handleAskAI}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Sparkles size={12} />
                <span>Ask AI to search all</span>
              </button>
            </div>

            {loading ? (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 size={16} className="animate-spin text-blue-600" />
                <span>Loading approved patient records...</span>
              </div>
            ) : patientRecords.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                No active records currently approved for this patient.
              </div>
            ) : (
              <div className="space-y-2">
                {patientRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {rec.title}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{rec.category}</span>
                        <span>•</span>
                        <span>{rec.date}</span>
                        <span>•</span>
                        <span>Expires {rec.accessExpires}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        if (onSelectRecord) onSelectRecord(rec);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition shrink-0"
                    >
                      View Report
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              navigate("/doctor/requests");
            }}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Request More Records &rarr;
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailsModal;
