
import React from "react";
import { Upload, Eye, Share2, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RecentActivity = ({ activities = [] }) => {
  const navigate = useNavigate();

  const getActivityIcon = (action) => {
    switch (action) {
      case "upload":
        return {
          Icon: Upload,
          style: "bg-blue-50 text-blue-600",
        };

      case "view":
        return {
          Icon: Eye,
          style: "bg-green-50 text-green-600",
        };

      case "share":
        return {
          Icon: Share2,
          style: "bg-blue-50 text-blue-600",
        };

      default:
        return {
          Icon: Activity,
          style: "bg-slate-100 text-slate-600",
        };
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Recent Activity
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            See what happened to your reports.
          </p>
        </div>

        <button
          onClick={() => navigate("/user/activity")}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All Activity
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
        {activities.length > 0 ? (
          activities.map((item) => {
            const { Icon, style } = getActivityIcon(item.action);

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${style}`}
                >
                  <Icon size={17} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">
                    {item.description}
                  </p>

                  <p className="text-xs text-slate-400 mt-0.5">
                    {item.date}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500 text-center p-6">
            No recent activity.
          </p>
        )}
      </div>
    </section>
  );
};

export default RecentActivity;
