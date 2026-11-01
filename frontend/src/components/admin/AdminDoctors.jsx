import React, { useState, useEffect } from "react";
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  Loader2,
  AlertCircle,
  Filter,
} from "lucide-react";
import { adminApi } from "../../api/adminApi";

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorDocuments, setDoctorDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAllDoctors({
        status: statusFilter,
        search,
      });
      setDoctors(res.doctors || []);
    } catch (err) {
      console.warn("Could not load doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  const handleSelectDoctor = async (doc) => {
    setSelectedDoctor(doc);
    setLoadingDocs(true);
    try {
      const res = await adminApi.getDoctorDetails(doc._id);
      setDoctorDocuments(res.documents || []);
    } catch (err) {
      console.warn("Could not load doctor documents:", err);
      setDoctorDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleVerify = async (id) => {
    setActionLoading(true);
    try {
      await adminApi.verifyDoctor(id);
      await fetchDoctors();
      if (selectedDoctor && selectedDoctor._id === id) {
        setSelectedDoctor((prev) => ({ ...prev, verificationStatus: "VERIFIED" }));
      }
    } catch (err) {
      alert(err.message || "Failed to verify doctor.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Reason for verification rejection:");
    if (reason === null) return;

    setActionLoading(true);
    try {
      await adminApi.rejectDoctor(id, reason);
      await fetchDoctors();
      if (selectedDoctor && selectedDoctor._id === id) {
        setSelectedDoctor((prev) => ({ ...prev, verificationStatus: "REJECTED" }));
      }
    } catch (err) {
      alert(err.message || "Failed to reject doctor.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Doctor Credential Verification
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review state medical council registration numbers and authenticate medical licenses.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by doctor name, email, registration # or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </form>

        <div className="flex items-center gap-2">
          {["ALL", "PENDING", "VERIFIED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === st
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Doctor List + Detail Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctors Directory List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <span>Loading doctors registry...</span>
            </div>
          ) : doctors.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-500">
              No doctors found matching the search criteria.
            </div>
          ) : (
            doctors.map((doc) => {
              const isSelected = selectedDoctor?._id === doc._id;
              const isVerified = doc.verificationStatus === "VERIFIED";
              const isPending = doc.verificationStatus === "PENDING";

              return (
                <div
                  key={doc._id}
                  onClick={() => handleSelectDoctor(doc)}
                  className={`bg-white border rounded-2xl p-5 cursor-pointer transition ${
                    isSelected
                      ? "border-blue-500 ring-2 ring-blue-50 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {doc.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">
                          Dr. {doc.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {doc.specialization} • {doc.qualification}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isVerified
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : isPending
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {isVerified ? <CheckCircle2 size={11} /> : isPending ? <ShieldAlert size={11} /> : <XCircle size={11} />}
                      {doc.verificationStatus}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Registration #</span>
                      <span className="font-semibold">{doc.medicalRegistrationNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Medical Council</span>
                      <span className="truncate block">{doc.registeredCouncil}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Hospital</span>
                      <span className="truncate block">{doc.hospitalName || "Independent"}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Doctor Details & Verification Documents Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-fit space-y-5">
          {selectedDoctor ? (
            <>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Doctor Profile Verification
                </span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">
                  Dr. {selectedDoctor.name}
                </h3>
                <p className="text-xs text-slate-500">{selectedDoctor.email}</p>
              </div>

              {/* Status Banner */}
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                  selectedDoctor.verificationStatus === "VERIFIED"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : selectedDoctor.verificationStatus === "PENDING"
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <div>
                  <span className="font-bold block">Status: {selectedDoctor.verificationStatus}</span>
                  {selectedDoctor.verificationRejectionReason && (
                    <span className="text-[11px] block mt-0.5">
                      Reason: {selectedDoctor.verificationRejectionReason}
                    </span>
                  )}
                </div>
              </div>

              {/* Uploaded Documents */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Submitted Verification Documents
                </h4>

                {loadingDocs ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    <Loader2 size={18} className="animate-spin mx-auto text-blue-600 mb-1" />
                    Fetching documents...
                  </div>
                ) : doctorDocuments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No documents uploaded by this practitioner yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {doctorDocuments.map((d) => (
                      <div
                        key={d._id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText size={16} className="text-blue-600" />
                          <div>
                            <p className="font-semibold text-slate-800">{d.title}</p>
                            <p className="text-[10px] text-slate-500">{d.category} • {d.format}</p>
                          </div>
                        </div>

                        {d.fileUrl && (
                          <a
                            href={d.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-blue-600 hover:bg-blue-100/60 rounded-lg transition"
                            title="Inspect document"
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => handleReject(selectedDoctor._id)}
                  disabled={actionLoading}
                  className="flex-1 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleVerify(selectedDoctor._id)}
                  disabled={actionLoading}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition shadow-xs disabled:opacity-50"
                >
                  Verify & Approve
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select a doctor from the registry list to review documents and update verification status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDoctors;
