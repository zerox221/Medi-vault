import React, { useState, useEffect } from "react";
import { Users, Mail, Phone, Calendar, HeartPulse, Loader2, Search } from "lucide-react";
import { adminApi } from "../../api/adminApi";

const AdminPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await adminApi.getAllPatients();
        setPatients(res.patients || []);
      } catch (err) {
        console.warn("Could not fetch patients:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((p) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Registered Patients Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Overview of patients managing encrypted medical records on MediVault.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
          <Loader2 size={24} className="animate-spin text-blue-600" />
          <span>Loading patient accounts...</span>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500">
          No patient accounts found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <div
              key={patient._id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  {patient.name ? patient.name.charAt(0).toUpperCase() : "P"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-800 truncate">
                    {patient.name}
                  </h3>
                  <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                    <Mail size={12} />
                    {patient.email}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Blood Group</span>
                  <span className="font-semibold text-rose-600">{patient.bloodGroup || "Not recorded"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Gender</span>
                  <span className="font-semibold">{patient.gender || "Not set"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Phone</span>
                  <span className="truncate block font-medium">{patient.phone || "Not set"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Joined</span>
                  <span className="truncate block font-medium">
                    {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : "Recent"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPatients;
