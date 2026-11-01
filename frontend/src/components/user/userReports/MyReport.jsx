import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Upload, Loader2, AlertCircle } from "lucide-react";

import ReportHeaders from "./ReportHeaders";
import ReportFilter from "./ReportFilter";
import ReportSearch from "./ReportSearch";
import ReportList from "./ReportList";
import ReportDetailModal from "./ReportDetailModal";
import { recordsApi } from "../../../api/recordsApi";

function MyReport() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Reports");
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await recordsApi.getPatientRecords();
      setReports(data.records || []);
    } catch (err) {
      console.warn("Could not fetch reports:", err.message);
      setError(err.message || "Failed to load medical reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (report) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete '${report.title}'? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await recordsApi.deleteRecord(report._id || report.id);
      setReports((prev) => prev.filter((r) => (r._id || r.id) !== (report._id || report.id)));
    } catch (err) {
      alert(err.message || "Failed to delete record.");
    }
  };

  const filteredReports = reports.filter((report) => {
    const searchTerm = search.trim().toLowerCase();

    const matchesSearch = [
      report.title,
      report.category,
      report.hospital,
      report.doctorName,
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(searchTerm));

    const matchesFilter =
      activeFilter === "All Reports" ||
      report.category === activeFilter ||
      (activeFilter === "Prescriptions" && report.category === "Prescription") ||
      (activeFilter === "Lab Reports" && (report.category === "Lab Reports" || report.category === "Blood Test" || report.category === "Blood Sugar"));

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full min-h-full pb-16">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <ReportHeaders />

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <ReportSearch search={search} setSearch={setSearch} />

        <ReportFilter
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
            <Loader2 size={28} className="animate-spin text-blue-600" />
            <span>Loading your encrypted medical records...</span>
          </div>
        ) : filteredReports.length > 0 ? (
          <ReportList
            reports={filteredReports}
            onViewReport={(r) => setSelectedReport(r)}
            onDeleteReport={handleDelete}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <h3 className="text-base font-bold text-slate-800">
              No medical reports match your filter
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try modifying your search term or upload a new report to store in your private MediVault vault.
            </p>
            <div className="pt-2">
              <Link
                to="/user/upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
              >
                <Upload size={14} />
                Upload Report Now
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Report Details & AI Summary Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onRefresh={fetchRecords}
        />
      )}
    </div>
  );
}

export default MyReport;
