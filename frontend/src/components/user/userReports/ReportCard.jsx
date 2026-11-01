
import React from "react";
import {
  FileText,
  Download,
  Eye,
  CalendarDays,
  UserRound,
  MoreVertical,
} from "lucide-react";

const ReportCard = ({ report }) => {

  const statusStyles = {
    Completed: "bg-green-100 text-green-700",
    Processing: "bg-orange-100 text-orange-700",
    Pending: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition">

      {/* Report Header */}
      <div className="flex items-start justify-between">

        <div className="flex items-center gap-3">

          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <FileText size={23} className="text-blue-600" />
          </div>

          <div>
            <h3 className="font-semibold text-slate-800 text-sm">
              {report.name}
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              {report.category}
            </p>
          </div>

        </div>

        <button className="text-slate-400 hover:text-slate-700">
          <MoreVertical size={20} />
        </button>

      </div>

      {/* Report Details */}
      <div className="mt-5 space-y-3">

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <UserRound size={16} />
          <span>{report.doctor}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <CalendarDays size={16} />
          <span>{report.date}</span>
        </div>

        <div className="flex items-center justify-between">

          <span className="text-xs text-slate-500">
            {report.type} • {report.size}
          </span>

          <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusStyles[report.status]}`}>
            {report.status}
          </span>

        </div>

      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100">

        <button className="flex-1 flex items-center justify-center gap-2 border border-slate-200 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50">
          <Eye size={16} />
          View
        </button>

        <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">
          <Download size={16} />
          Download
        </button>

      </div>

    </div>
  );
};

export default ReportCard;
