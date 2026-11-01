import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, ShieldCheck, ArrowRight } from "lucide-react";
import DashboardHeader from "./DashboardHeader";
import DashboardActions from "./DashboardActions";
import DashboardStats from "./DashboardStats";
import RecentReports from "./RecentReports";
import MedicalTimeline from "./MedicalTimeline";
import RecentActivity from "./RecentActivity";
import ApproveSharingModal from "../shareReports/ApproveSharingModal";
import { userApi } from "../../../api/userApi";
import { sharingApi } from "../../../api/sharingApi";

const Userdashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    stats: { totalReports: 0, reportsAccessed: 0, activeSharesCount: 0 },
    recentReports: [],
    timeline: [],
    activities: [],
  });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [modalRequest, setModalRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [dashRes, shareRes] = await Promise.allSettled([
        userApi.getUserDashboard(),
        sharingApi.getPatientSharingRequests(),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value?.data) {
        setDashboardData(dashRes.value.data);
      }

      if (shareRes.status === "fulfilled" && shareRes.value?.requests) {
        const pending = shareRes.value.requests.filter((r) => r.status === "pending");
        setPendingRequests(pending);
      }
    } catch (err) {
      console.warn("Dashboard sync notice:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const { stats, recentReports, timeline, activities } = dashboardData;

  const formattedReports = recentReports.map((r) => ({
    id: r._id,
    title: r.title,
    category: r.category,
    date: r.reportDate,
    lab: r.hospital || "Diagnostic Center",
    tags: r.aiSummary?.summary ? ["AI Summary"] : [],
  }));

  const formattedTimeline = timeline.map((r) => ({
    id: r._id,
    date: r.reportDate,
    title: r.title,
    category: r.category,
  }));

  const formattedActivities = activities.map((a) => ({
    id: a._id,
    action: a.action,
    description: a.description,
    date: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "Recent",
  }));

  return (
    <div className="space-y-7 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <DashboardHeader />
        <DashboardActions />
      </div>

      {/* URGENT PENDING DOCTOR ACCESS REQUEST NOTIFICATION */}
      {pendingRequests.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-white border-2 border-amber-300 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Stethoscope size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-800">
                  Doctor Records Access Authorization Request
                </h4>
                <span className="text-[10px] font-extrabold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                <strong>Dr. {pendingRequests[0].doctor?.name || "A physician"}</strong> ({pendingRequests[0].doctor?.specialization || "Medicine"}) scanned your sharing QR and requested permission to view your diagnostic files.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setModalRequest(pendingRequests[0])}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              Review & Authorize
            </button>
            <button
              onClick={() => navigate("/user/share?tab=requests")}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              View Requests ({pendingRequests.length})
            </button>
          </div>
        </div>
      )}

      <DashboardStats
        totalReports={stats.totalReports || 0}
        reportsAccessed={stats.reportsAccessed || 0}
      />

      <RecentReports reports={formattedReports} />

      <MedicalTimeline timeline={formattedTimeline} />

      <RecentActivity activities={formattedActivities} />

      {/* Authorize Modal */}
      <ApproveSharingModal
        isOpen={Boolean(modalRequest)}
        request={modalRequest}
        onClose={() => setModalRequest(null)}
        onSuccess={() => loadData()}
      />
    </div>
  );
};

export default Userdashboard;
