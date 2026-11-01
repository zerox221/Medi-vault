
import React from "react";
import { Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MedicalTimeline = ({ timeline = [] }) => {
  const navigate = useNavigate();

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Medical Timeline
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Your medical history, organized by date.
          </p>
        </div>

        <button
          onClick={() => navigate("/user/timeline")}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View Full Timeline
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        {timeline.length > 0 ? (
          <div className="space-y-4">
            {timeline.map((item) => (
              <div key={item.id} className="flex gap-3">
                <Clock
                  size={15}
                  className="text-blue-500 mt-1 shrink-0"
                />

                <div>
                  <p className="text-xs text-slate-400">
                    {item.date}
                  </p>

                  <p className="text-sm font-semibold text-slate-700 mt-0.5">
                    {item.title}
                    <span className="font-normal text-slate-500">
                      {" "}· {item.category}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-5">
            No medical history available.
          </p>
        )}
      </div>
    </section>
  );
};

export default MedicalTimeline;
