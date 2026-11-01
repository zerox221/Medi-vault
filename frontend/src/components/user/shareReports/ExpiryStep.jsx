
import React from "react";
import { Clock, ArrowLeft, ArrowRight } from "lucide-react";

const ExpiryStep = ({
  expiry,
  setExpiry,
  onBack,
  onContinue,
  selectedCount,
}) => {

  const expiryOptions = [
    "1 hour",
    "24 hours",
    "7 days",
    "30 days",
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">

      <div className="mb-5">

        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
          <Clock size={20} className="text-blue-600" />
        </div>

        <h2 className="text-sm font-semibold text-slate-800">
          Set Access Expiry
        </h2>

        <p className="text-xs text-slate-500 mt-1">
          Choose how long your doctor can access the selected reports.
        </p>

      </div>

      <p className="text-xs font-medium text-slate-700 mb-3">
        Access Duration
      </p>

      <div className="grid grid-cols-2 gap-3">

        {expiryOptions.map((option) => (

          <button
            key={option}
            onClick={() => setExpiry(option)}
            className={`p-3 rounded-lg border text-xs font-medium transition
              ${
                expiry === option
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600 hover:border-blue-300"
              }`}
          >
            {option}
          </button>

        ))}

      </div>

      <div className="mt-5 p-3 bg-slate-50 rounded-lg">

        <p className="text-xs text-slate-600">
          <span className="font-semibold">{selectedCount}</span> reports
          will be shared.
        </p>

        <p className="text-[11px] text-slate-500 mt-1">
          Access will expire after {expiry}.
        </p>

      </div>

      <div className="flex justify-between mt-6">

        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={13} className="inline mr-1" />
          Back
        </button>

        <button
          onClick={onContinue}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
        >
          Generate QR Code
          <ArrowRight size={13} className="inline ml-1" />
        </button>

      </div>

    </div>
  );
};

export default ExpiryStep;
