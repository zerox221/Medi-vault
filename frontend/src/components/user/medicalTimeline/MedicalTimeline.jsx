import React, { useMemo, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

import TimelineHeader from "./TimelineHeader";
import TimelineStats from "./TimelineStats";
import TimelineFilters from "./TimelineFilters";
import TimelineList from "./TimelineList";
import ReportDetailModal from "../userReports/ReportDetailModal";
import { recordsApi } from "../../../api/recordsApi";

const MedicalTimeline = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  // FILTER STATES
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedType, setSelectedType] = useState("All");

  const fetchRecords = async () => {
    try {
      const res = await recordsApi.getPatientRecords();
      if (res?.records && res.records.length > 0) {
        const mapped = res.records.map((r) => ({
          ...r,
          id: r._id,
          name: r.title,
          type: r.category,
          date: r.reportDate || (r.createdAt ? String(r.createdAt).slice(0, 10) : "2026-01-01"),
          hospital: r.hospital || "Diagnostic Facility",
          status: "Completed",
          aiSummary: r.aiSummary,
          fileUrl: r.fileUrl,
        }));
        setReports(mapped);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.warn("Timeline fetch error:", err.message);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // GET AVAILABLE YEARS
  const years = useMemo(() => {
    return [
      ...new Set(
        reports
          .map((report) => (report.date ? String(report.date).slice(0, 4) : ""))
          .filter(Boolean)
      ),
    ].sort((a, b) => b - a);
  }, [reports]);

  // GET AVAILABLE REPORT TYPES
  const types = useMemo(() => {
    return [
      ...new Set(
        reports.map((report) => report.type || report.category).filter(Boolean)
      ),
    ].sort();
  }, [reports]);

  // FILTER REPORTS
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const reportName = report.name || report.title || "";
      const reportHospital = report.hospital || "";
      const reportType = report.type || report.category || "";
      const reportDate = String(report.date || "");

      const matchesSearch =
        !search ||
        reportName.toLowerCase().includes(search.toLowerCase()) ||
        reportHospital.toLowerCase().includes(search.toLowerCase());

      const matchesYear =
        selectedYear === "All" || reportDate.startsWith(selectedYear);

      const matchesType =
        selectedType === "All" || reportType.toLowerCase() === selectedType.toLowerCase();

      return matchesSearch && matchesYear && matchesType;
    });
  }, [reports, search, selectedYear, selectedType]);

  // GROUP REPORTS BY YEAR
  const groupedReports = useMemo(() => {
    const groups = {};

    filteredReports.forEach((report) => {
      const year = report.date ? String(report.date).slice(0, 4) : "2026";
      if (!groups[year]) groups[year] = [];
      groups[year].push(report);
    });

    Object.keys(groups).forEach((year) => {
      groups[year].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    });

    return groups;
  }, [filteredReports]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-3 lg:px-10 pb-16">
      <div className="max-w-[850px] mx-auto space-y-5">
        <TimelineHeader />

        <TimelineStats reports={reports} />

        <TimelineFilters
          search={search}
          setSearch={setSearch}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          years={years}
          types={types}
        />

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
            <Loader2 size={24} className="animate-spin text-blue-600" />
            <span>Constructing medical timeline...</span>
          </div>
        ) : (
          <TimelineList
            reports={filteredReports}
            groupedReports={groupedReports}
            onSelectReport={(r) => setSelectedReport(r)}
          />
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onRefresh={fetchRecords}
        />
      )}
    </div>
  );
};

export default MedicalTimeline;
