import React, { useState, useEffect } from "react";
import { Activity, ShieldCheck, Filter, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi";

const AdminActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await adminApi.getAdminActivity();
        setActivities(res.activities || []);
      } catch (err) {
        console.warn("Could not load activity logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  const filtered = activities.filter((act) => {
    if (filter === "ALL") return true;
    if (filter === "VERIFY") return act.action.includes("verify") || act.action.includes("reject");
    if (filter === "UPLOADS") return act.action.includes("upload");
    if (filter === "ACCESS") return act.action.includes("view") || act.action.includes("download") || act.action.includes("share");
    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            System-Wide Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail across all patient and doctor interactions, uploads, and consents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {["ALL", "VERIFY", "UPLOADS", "ACCESS"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filter === f
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 size={24} className="animate-spin text-blue-600" />
            <span>Loading system audit logs...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No audit records match the current filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((act) => (
              <div
                key={act._id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span
                    className={`w-2.5 h-2.5 rounded-full mt-1 sm:mt-0 shrink-0 ${
                      act.action.includes("verify")
                        ? "bg-emerald-500"
                        : act.action.includes("reject")
                        ? "bg-red-500"
                        : act.action.includes("upload")
                        ? "bg-blue-500"
                        : "bg-indigo-500"
                    }`}
                  />
                  <div>
                    <span className="font-semibold text-slate-800">{act.description}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block sm:inline sm:ml-2">
                      Role: {act.userRole} • Action: {act.action}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400 font-medium shrink-0 self-end sm:self-auto">
                  {act.createdAt
                    ? new Date(act.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    : "Recent"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminActivity;
