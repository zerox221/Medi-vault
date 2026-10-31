
import React from "react";

import Sidebar from "./components/Sidebar";
import TopNavbar from "./components/TopNavbar";
import DashboardHeader from "./components/DashboardHeader";
import DashboardActions from "./components/DashboardActions";
import DashboardStats from "./components/DashboardStats";

function App() {
  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Dashboard */}
      <main className="flex-1 min-w-0">

        {/* Top Navbar */}
        <TopNavbar />

        {/* Dashboard Content */}
        <div className="max-w-[850px] mx-auto px-5 py-5">

          {/* Welcome Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">

            <DashboardHeader />

            <DashboardActions />

          </div>

          {/* Dashboard Statistics */}
          <DashboardStats />

        </div>

      </main>

    </div>
  );
}

export default App;
