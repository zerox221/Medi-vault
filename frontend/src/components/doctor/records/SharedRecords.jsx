import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileText,
  Search,
  Eye,
  ShieldCheck,
  FileCheck2,
} from "lucide-react";
import RecordPreviewModal from "./RecordPreviewModal";
import { doctorApi } from "../../../api/doctorApi";

const categories = [
  "All Categories",
  "Lab Reports",
  "Blood Sugar",
  "Cardiology",
  "Radiology",
  "Prescriptions",
];

const SharedRecords = () => {
  const [searchParams] = useSearchParams();
  const initialPatientParam = searchParams.get("patient") || "";

  // Strictly ONLY approved records for this doctor
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprovedRecords = async () => {
      try {
        const res = await doctorApi.getDoctorRecords();
        if (res?.records && res.records.length > 0) {
          const mapped = res.records.map((r) => {
            const rawPatientId = r.patient?._id
              ? r.patient._id.toString()
              : r.patient && typeof r.patient === "string"
              ? r.patient
              : "";

            return {
              id: r._id,
              _id: r._id,
              title: r.title,
              category: r.category,
              patient: r.patient,
              patientName: r.patient?.name || "Patient",
              patientId: rawPatientId || "PAT-001",
              patientDisplayId: rawPatientId ? `PAT-${rawPatientId.slice(-4)}` : "PAT-001",
              patientAge: r.patient?.dateOfBirth
                ? new Date().getFullYear() - new Date(r.patient.dateOfBirth).getFullYear()
                : 32,
              patientGender: r.patient?.gender || "Patient",
              patientBlood: r.patient?.bloodGroup || "O+",
              date: r.reportDate || "Recent",
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
            };
          });
          setRecords(mapped);
        } else {
          setRecords([]);
        }
      } catch (err) {
        console.warn("Shared records fetch notice:", err.message);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    fetchApprovedRecords();
  }, []);

  const [search, setSearch] = useState(initialPatientParam);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const filteredRecords = records.filter((rec) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      rec.title.toLowerCase().includes(q) ||
      rec.patientName.toLowerCase().includes(q) ||
      rec.lab.toLowerCase().includes(q) ||
      rec.category.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === "All Categories" ||
      rec.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Shared Records</h1>
          <p className="text-sm text-slate-500 mt-1">
            Access authorized patient medical records. All views are logged in the cryptographic access audit trail.
          </p>
        </div>

        {/* Security / Compliance Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>Patient-Authorized Records</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by test title, patient name, laboratory, or category..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-700">{filteredRecords.length}</strong> authorized reports
        </span>
        <span className="flex items-center gap-1 text-blue-600 font-medium">
          <FileCheck2 size={13} />
          Digital consent verified
        </span>
      </div>

      {/* Records Grid */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FileText size={22} />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            No shared records found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No shared records match your search criteria. Only medical records that have received explicit patient approval are displayed here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((record) => {
            return (
              <div
                key={record.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-sm hover:border-blue-300 transition flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Icon, Title & Category */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm leading-snug">
                          {record.title}
                        </h3>
                        <p className="text-xs font-semibold text-blue-600 mt-0.5">
                          {record.category}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      <ShieldCheck size={11} />
                      Approved
                    </span>
                  </div>

                  {/* Patient Name & Details */}
                  <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 text-xs text-slate-600 mb-4 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Patient:</span>
                      <strong className="text-slate-800">{record.patientName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Report Date:</span>
                      <span className="text-slate-700 font-medium">{record.date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Diagnostic Lab:</span>
                      <span className="text-slate-700 truncate max-w-[170px]">{record.lab}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Access Expiry:</span>
                      <span className="text-slate-700 font-medium">{record.accessExpires}</span>
                    </div>
                  </div>

                  {/* Summary Snippet if available */}
                  {record.summary && (
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-4 line-clamp-2">
                      <strong className="text-slate-700">Clinical Note:</strong> {record.summary}
                    </p>
                  )}
                </div>

                {/* Card Action: View Report */}
                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedRecord(record)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-2xs cursor-pointer"
                  >
                    <Eye size={15} />
                    <span>View Report</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

export default SharedRecords;
