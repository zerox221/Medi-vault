
import React from "react";
import { FileText, Eye } from "lucide-react";
import StatCard from "./StatCard";

const StatSection = ({
  totalReports = 0,
  reportsAccessed = 0,
}) => {
  const stats = [
    {
      id: 1,
      title: "Total Reports",
      value: totalReports,
      description: "Reports in your library.",
      Icon: FileText,
    },
    {
      id: 2,
      title: "Reports Accessed",
      value: reportsAccessed,
      description: "Different reports opened by doctors, last 30 days.",
      Icon: Eye,
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {stats.map((stat) => (
        <StatCard
          key={stat.id}
          title={stat.title}
          value={stat.value}
          description={stat.description}
          Icon={stat.Icon}
        />
      ))}
    </section>
  );
};

export default StatSection;
