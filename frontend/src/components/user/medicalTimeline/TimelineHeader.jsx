
import React from "react";
import { Clock } from "lucide-react";

const TimelineHeader = () => {
  return (
    <div className="mb-6">
      <p className="text-[11px] text-slate-500 mb-2">
        Dashboard / Medical Timeline
      </p>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Clock size={21} className="text-blue-600" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Medical Timeline
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            Track your medical history and health records in chronological order.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimelineHeader;
