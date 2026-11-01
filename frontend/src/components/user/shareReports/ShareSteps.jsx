
import React from "react";

const ShareSteps = ({ currentStep }) => {

  const steps = [
    { id: 1, label: "Select" },
    { id: 2, label: "Expiry" },
    { id: 3, label: "QR Code" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 mb-5">

      {steps.map((step) => (

        <div
          key={step.id}
          className={`rounded-full py-1.5 text-center text-[11px] font-medium border transition-all
            ${
              currentStep === step.id
                ? "bg-blue-600 text-white border-blue-600"
                : currentStep > step.id
                ? "bg-blue-50 text-blue-600 border-blue-200"
                : "bg-white text-slate-400 border-slate-200"
            }`}
        >
          {step.id}. {step.label}
        </div>

      ))}

    </div>
  );
};

export default ShareSteps;
