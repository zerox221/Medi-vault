
import React from "react";
import { FileText } from "lucide-react";

const EmptyTimeline = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">

      <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <FileText size={25} className="text-blue-500" />
      </div>

      <h3 className="text-sm font-semibold text-slate-800">
        No Medical Records Found
      </h3>

      <p className="text-xs text-slate-500 mt-2">
        Your medical reports will appear here once they are added.
      </p>

    </div>
  );
};

export default EmptyTimeline;
