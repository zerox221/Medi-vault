import React, { useState, useEffect } from "react";
import { Pencil, Save, X, Check, Loader2 } from "lucide-react";
import { doctorApi } from "../../../api/doctorApi";

const DoctorProfileDetails = ({ doctor, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(doctor);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setForm(doctor);
  }, [doctor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await doctorApi.updateDoctorProfile(form);
      setIsEditing(false);
      if (onUpdate && res?.doctor) onUpdate(res.doctor);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(doctor);
    setIsEditing(false);
  };

  const fields = [
    { label: "Full Name", name: "name", type: "text" },
    { label: "Professional Email", name: "email", type: "email" },
    { label: "Contact Phone", name: "phone", type: "tel" },
    { label: "Specialization", name: "specialization", type: "text" },
    { label: "Medical Qualification", name: "qualification", type: "text" },
    { label: "Medical Registration Number", name: "medicalRegistrationNumber", type: "text" },
    { label: "Registered Medical Council", name: "registeredCouncil", type: "text" },
    { label: "Hospital / Healthcare Facility", name: "hospitalName", type: "text" },
    { label: "Department / Wing", name: "department", type: "text" },
    { label: "Clinical Experience", name: "experience", type: "text" },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Professional & Credential Details
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified credentials submitted to national healthcare registries and patients.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-in fade-in">
              <Check size={14} />
              Profile Updated
            </span>
          )}

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
            >
              <Pencil size={14} />
              Edit Details
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                <X size={14} />
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-2xs transition"
              >
                <Save size={14} />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              {field.label}
            </label>
            <input
              type={field.type}
              name={field.name}
              value={form[field.name] || ""}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border outline-none transition ${
                isEditing
                  ? "bg-white border-blue-400 focus:ring-4 focus:ring-blue-50 text-slate-800"
                  : "bg-slate-50 border-slate-200 text-slate-700 font-medium"
              }`}
            />
          </div>
        ))}

        {/* Bio spanning 2 columns */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Professional Summary & Clinical Focus
          </label>
          <textarea
            name="bio"
            rows={3}
            value={form.bio || ""}
            onChange={handleChange}
            disabled={!isEditing}
            className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border outline-none transition ${
              isEditing
                ? "bg-white border-blue-400 focus:ring-4 focus:ring-blue-50 text-slate-800"
                : "bg-slate-50 border-slate-200 text-slate-700 font-medium"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default DoctorProfileDetails;
