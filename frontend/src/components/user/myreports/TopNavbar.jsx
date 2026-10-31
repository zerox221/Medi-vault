
import React from "react";
import { Search } from "lucide-react";

const TopNavbar = () => {
    return (
        <header className="h-[54px] bg-white border-b border-slate-200 flex items-center justify-between px-5">

            {/* Demo mode */}
            <div className="flex-1 flex justify-center">
                <span className="text-[9px] text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    Demo mode · synthetic data
                </span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">

                {/* Search icon */}
                <button
                    aria-label="Search"
                    className="text-slate-700 hover:text-blue-600 transition"
                >
                    <Search size={16} />
                </button>

                {/* Profile avatar */}
                <button
                    aria-label="Profile"
                    className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center"
                >
                    P
                </button>

            </div>

        </header>
    );
};

export default TopNavbar;
