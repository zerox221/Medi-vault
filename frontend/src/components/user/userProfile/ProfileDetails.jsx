import React, { useState, useEffect } from "react";
import { Pencil, Save, X, Loader2, CheckCircle2 } from "lucide-react";
import { userApi } from "../../../api/userApi";

const ProfileDetails = ({ user, onUpdateSuccess }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(user);

  useEffect(() => {
    setProfile(user);
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await userApi.updateUserProfile(profile);
      if (res?.user && onUpdateSuccess) {
        onUpdateSuccess(res.user);
      }
      setIsEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile(user);
    setIsEditing(false);
    setError("");
  };

  const fields = [
    { label: "Full Name", name: "name", type: "text" },
    { label: "Email Address", name: "email", type: "email", disabled: true },
    { label: "Phone Number", name: "phone", type: "tel" },
    { label: "Date of Birth", name: "dateOfBirth", type: "text" },
    { label: "Gender", name: "gender", type: "text" },
    { label: "Blood Group", name: "bloodGroup", type: "text" },
    { label: "Address", name: "address", type: "text" },
    { label: "Emergency Contact", name: "emergencyContact", type: "text" },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-800">
            Personal & Health Identification
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Personal contact details and biological markers recorded for clinical care.
          </p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
          >
            <Pencil size={14} />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <X size={14} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Grid of fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.name} className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">
              {field.label}
            </label>
            {isEditing && !field.disabled ? (
              <input
                type={field.type}
                name={field.name}
                value={profile[field.name] || ""}
                onChange={handleChange}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                className="w-full h-[38px] px-3.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            ) : (
              <div className="h-[38px] px-3.5 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-800 flex items-center">
                {profile[field.name] || <span className="text-slate-400 italic">Not set</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileDetails;
