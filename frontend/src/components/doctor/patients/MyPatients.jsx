import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  FileCheck2,
  Mail,
  Phone,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PatientDetailsModal from "./PatientDetailsModal";
import RecordPreviewModal from "../records/RecordPreviewModal";
import { doctorApi } from "../../../api/doctorApi";

const MyPatients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await doctorApi.getDoctorPatients();
        setPatients(res?.patients || []);
      } catch (err) {
        console.warn("Doctor patients fetch notice:", err.message);
        setPatients([]);
      }
    };
    fetchPatients();
  }, []);

  // Filter & Search
  const filteredPatients = patients
    .filter((pat) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        pat.name.toLowerCase().includes(q) ||
        pat.email.toLowerCase().includes(q) ||
        pat.phone.includes(q) ||
        (pat.condition && pat.condition.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "All" || pat.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "records") return b.sharedRecordCount - a.sharedRecordCount;
      if (sortBy === "recent") return b.id.localeCompare(a.id);
      return 0;
    });

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            My Patients
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your patient registry and track authorized shared medical records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/doctor/scan-qr")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition"
          >
            <UserPlus size={16} />
            Connect via QR Scan
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search patients by name, email, or diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
          />
        </div>

        {/* Filter Badges & Sort */}
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {["All", "Active", "Follow-up", "Inactive"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  statusFilter === status
                    ? "bg-white text-blue-600 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-600 outline-none focus:border-blue-500"
          >
            <option value="name">Sort: Name (A-Z)</option>
            <option value="records">Sort: Shared Records Count</option>
            <option value="recent">Sort: Most Recent</option>
          </select>
        </div>
      </div>

      {/* Patient List Results Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-700">{filteredPatients.length}</strong> patients
        </span>
        <span className="flex items-center gap-1 text-emerald-700 font-medium">
          <ShieldCheck size={14} />
          Consent-based zero-trust security
        </span>
      </div>

      {/* Patients Grid */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Users size={24} />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            No patients found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or status filter, or scan a patient QR code to initiate a new connection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-sm hover:border-blue-300 transition flex flex-col justify-between"
            >
              <div>
                {/* Card Top: Initials Avatar + Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {patient.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <h3
                        className="font-bold text-slate-800 text-sm hover:text-blue-600 transition cursor-pointer"
                        onClick={() => setSelectedPatient(patient)}
                      >
                        {patient.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {patient.age} Y • {patient.gender} • Blood:{" "}
                        <span className="text-rose-600 font-semibold">{patient.bloodGroup}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      patient.status === "Active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : patient.status === "Follow-up"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {patient.status}
                  </span>
                </div>

                {/* Patient Details & Condition */}
                <div className="space-y-2 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-lg border border-slate-100 mb-4">
                  <div className="flex items-center gap-2 truncate">
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    <span>{patient.phone}</span>
                  </div>
                  {patient.condition && (
                    <div className="text-[11px] font-medium text-blue-800 bg-blue-50/70 px-2 py-1 rounded-md border border-blue-100">
                      Focus: {patient.condition}
                    </div>
                  )}
                </div>
              </div>

              {/* Shared Record Count Badge & Action Buttons */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-500 font-medium">
                    Shared Records:
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                    <FileCheck2 size={13} />
                    {patient.sharedRecordCount} {patient.sharedRecordCount === 1 ? "Record" : "Records"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedPatient(patient)}
                    className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                  >
                    Patient Profile
                  </button>

                  <button
                    onClick={() => navigate(`/doctor/records?patient=${encodeURIComponent(patient.name)}`)}
                    className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition text-center"
                  >
                    View Records
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Patient Details Modal */}
      {selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onSelectRecord={(rec) => setSelectedRecord(rec)}
        />
      )}

      {/* Record Preview Modal if opened from patient profile */}
      {selectedRecord && (
        <RecordPreviewModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};

export default MyPatients;
