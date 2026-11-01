import React, { useState, useEffect } from "react";
import ActivityFilters from "./ActivityFilters";
import ActivityList from "./ActivityList";
import { userApi } from "../../../api/userApi";

const Activity = () => {
  const [activities, setActivities] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All Activity");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await userApi.getUserActivity();
        if (res?.activities && res.activities.length > 0) {
          const mapped = res.activities.map((a) => {
            let type = "Uploads";
            if (a.action === "view" || a.action === "download") type = "Doctor Access";
            else if (a.action === "share" || a.action === "approve" || a.action === "reject" || a.action === "revoke") type = "Sharing";

            return {
              id: a._id,
              type,
              action: a.action,
              description: a.description,
              date: a.createdAt ? new Date(a.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent",
            };
          });
          setActivities(mapped);
        } else {
          setActivities([]);
        }
      } catch (err) {
        console.warn("Could not fetch activity log:", err.message);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const filteredActivities =
    activeFilter === "All Activity"
      ? activities
      : activities.filter((activity) => activity.type === activeFilter);

  return (
    <div className="min-h-screen space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Activity & Audit Trail
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Complete, tamper-evident log of uploads, doctor access, consents, and revocations.
        </p>
      </div>

      {/* Activity Filters */}
      <ActivityFilters
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
      />

      {/* Activity List */}
      <ActivityList activities={filteredActivities} />

      <p className="text-xs text-slate-400">
        MediVault records all access in compliance with healthcare data protection principles.
      </p>
    </div>
  );
};

export default Activity;
