
import React from "react";
import {
  Upload,
  Eye,
  Share2,
  Clock,
  Ban,
  FileText,
} from "lucide-react";

const ActivityList = ({ activities = [] }) => {
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

      case "expire":
        return {
          Icon: Clock,
          style: "bg-orange-50 text-orange-600",
        };

      case "revoke":
        return {
          Icon: Ban,
          style: "bg-red-50 text-red-600",
        };

      default:
        return {
          Icon: FileText,
          style: "bg-slate-100 text-slate-600",
        };
    }
  };

  if (activities.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
        <FileText size={36} className="mx-auto text-slate-300 mb-3" />
        <h3 className="text-base font-semibold text-slate-700">
          No activity found
        </h3>
        <p className="text-sm text-slate-400 mt-1">
          No activities available for this filter.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
      {activities.map((activity) => {
        const { Icon, style } = getActivityIcon(activity.action);

        return (
          <div
            key={activity.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition"
          >
            {/* Activity Icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${style}`}>
              <Icon size={18} />
            </div>

            {/* Activity Description */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700">
                {activity.description}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {activity.date}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityList;
