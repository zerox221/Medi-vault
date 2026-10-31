import React from "react";

const StatCard = ({
  icon: Icon,
  title,
  number,
  description,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 min-h-[82px] shadow-sm hover:shadow-md transition">

      <div className="text-blue-600 mb-1">
        <Icon size={18} />
      </div>

      <p className="text-[8px] text-slate-500 mb-0.5">
        {title}
      </p>

      <h2 className="text-lg font-bold text-slate-800">
        {number}
      </h2>

      <p className="text-[7px] text-slate-500">
        {description}
      </p>

    </div>
  );
};

export default StatCard;