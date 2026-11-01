import React, { useState, useEffect, useContext } from "react";
import { UserCircle, ShieldCheck, Mail, Calendar, Loader2 } from "lucide-react";
import ProfileDetails from "./ProfileDetails";
import { userContext } from "../../../Context/UserContext.jsx";
import { userApi } from "../../../api/userApi";

const Profile = () => {
  const { user: authUser, updateUser } = useContext(userContext);
  const [profileData, setProfileData] = useState(authUser || {});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await userApi.getUserProfile();
        if (res?.user) {
          setProfileData(res.user);
          updateUser(res.user);
        }
      } catch (err) {
        console.warn("Using context user profile:", err.message);
        if (authUser) setProfileData(authUser);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleUpdateSuccess = (updated) => {
    setProfileData(updated);
    updateUser(updated);
  };

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
        <Loader2 size={26} className="animate-spin text-blue-600" />
        <span>Loading your profile details...</span>
      </div>
    );
  }

  const initial = profileData.name ? profileData.name.charAt(0).toUpperCase() : "P";

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          My Medical Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal information, emergency contacts, and physiological indicators.
        </p>
      </div>

      {/* Profile Overview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-md ring-4 ring-blue-50">
            {initial}
          </div>

          <div className="text-center sm:text-left flex-1">
            <h2 className="text-xl font-bold text-slate-800">
              {profileData.name || "Patient Account"}
            </h2>

            <p className="text-xs text-slate-500 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail size={13} />
              {profileData.email}
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Verified Patient Vault
              </span>
            </div>
          </div>

          <div className="text-center sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              Account Status
            </p>
            <p className="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1.5 justify-center sm:justify-end">
              <Calendar size={13} className="text-slate-400" />
              Active Member
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <ProfileDetails
        user={profileData}
        onUpdateSuccess={handleUpdateSuccess}
      />
    </div>
  );
};

export default Profile;
