
import React from "react";

const StatCard = ({
  title,
  value,
  description,
  Icon,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-2 mb-3">
        {Icon && (
          <Icon size={19} className="text-blue-600" />
        )}

        <p className="text-sm text-slate-500">
          {title}
        </p>
      </div>

      <h2 className="text-3xl font-bold text-slate-800">
        {value}
      </h2>

      <p className="text-xs text-slate-400 mt-2">
        {description}
      </p>
    </div>
  );
};

export default StatCard;
