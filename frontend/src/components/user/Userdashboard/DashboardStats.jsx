import React from "react";
import { FileText, Eye } from "lucide-react";
import StatCard from "./StatCard";

const DashboardStats = () => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <StatCard
        icon={FileText}
        title="Total Reports"
        number="6"
        description="Reports in your library."
      />

      <StatCard
        icon={Eye}
        title="Reports Accessed"
        number="1"
        description="Different reports opened by doctors, last 30 days."
      />
    </section>
  );
};

export default DashboardStats;