import React, { useState } from "react";

import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import MyReportsHeader from "./MyReportsHeader";
import ReportSearch from "./ReportSearch";
import ReportFilters from "./ReportFilters";
import MyReportsList from "./MyReportsList";

const reportData = [
  {
    id: 1,
    title: "Complete Blood Count",
    category: "Blood Test",
    type: "Lab Reports",
    date: "12 Oct 2026",
    lab: "City Diagnostic Lab",
    tags: ["AI Summary", "Currently shared"],
  },
  {
    id: 2,
    title: "Blood Sugar Report",
    category: "Blood Sugar",
    type: "Lab Reports",
    date: "08 Oct 2026",
    lab: "City Diagnostic Lab",
    tags: ["AI Summary", "Currently shared"],
  },
  {
    id: 3,
    title: "Prescription",
    category: "Prescription",
    type: "Prescriptions",
    date: "03 Oct 2026",
    lab: "Sunrise Clinic",
    tags: ["AI Summary"],
  },
  {
    id: 4,
    title: "General Health Checkup",
    category: "General Checkup",
    type: "Other",
    date: "15 Feb 2024",
    lab: "Sunrise Clinic",
    tags: ["AI Summary"],
  },
  {
    id: 5,
    title: "Complete Blood Count",
    category: "Blood Test",
    type: "Lab Reports",
    date: "21 Aug 2022",
    lab: "MedLine Labs",
    tags: ["AI Summary"],
  },
  {
    id: 6,
    title: "Blood Sugar Report",
    category: "Blood Sugar",
    type: "Lab Reports",
    date: "04 Mar 2021",
    lab: "MedLine Labs",
    tags: [],
  },
];

const MyReports = () => {

  // Search state
  const [search, setSearch] = useState("");

  // Filter state
  const [activeFilter, setActiveFilter] = useState("All Reports");

  // Search and filter logic
  const filteredReports = reportData.filter((report) => {

    const matchesSearch =
      report.title.toLowerCase().includes(search.toLowerCase()) ||
      report.category.toLowerCase().includes(search.toLowerCase()) ||
      report.lab.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      activeFilter === "All Reports" ||
      report.type === activeFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 min-w-0">

        <TopNavbar />

        <div className="max-w-[850px] mx-auto px-5 py-6">

          {/* Page heading and buttons */}
          <MyReportsHeader />

          {/* Search bar */}
          <ReportSearch
            search={search}
            setSearch={setSearch}
          />

          {/* Filter buttons */}
          <ReportFilters
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />

          {/* Reports list */}
          <MyReportsList reports={filteredReports} />

        </div>
      </main>
    </div>
  );
};

export default MyReports;
