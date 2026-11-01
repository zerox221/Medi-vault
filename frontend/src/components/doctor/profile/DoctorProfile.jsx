import React, { useState, useEffect, useContext } from "react";
import {
  ShieldCheck,
  Building2,
  BadgeCheck,
  Award,
} from "lucide-react";
import DoctorProfileDetails from "./DoctorProfileDetails";
import VerificationDocuments from "./VerificationDocuments";
import { userContext } from "../../../Context/UserContext.jsx";
import { doctorApi } from "../../../api/doctorApi";

const DoctorProfile = () => {
  const { user } = useContext(userContext);
  const [profile, setProfile] = useState(user || {});
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchDocProfile = async () => {
      try {
        const res = await doctorApi.getDoctorProfile();
        if (res?.doctor) {
          setProfile(res.doctor);
          if (res.doctor.documents) {
            setDocuments(res.doctor.documents);
          }
        }
      } catch (err) {
        console.warn("Doctor profile sync notice:", err.message);
      }
    };
    fetchDocProfile();
  }, []);

  const handleUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
  };

  const initials = profile.name
    ? profile.name
        .replace(/^Dr\.\s*/i, "")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "DR";

  const isVerified = profile.verificationStatus === "VERIFIED";

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Doctor Profile & Credentials
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your verified professional identity, registration numbers, and compliance documentation.
        </p>
      </div>

      {/* Main Profile Overview Hero Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with Doctor Initials */}
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-md ring-4 ring-blue-50">
              {initials}
            </div>
            {isVerified && (
              <div
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white shadow-xs"
                title="Verified Medical Practitioner"
              >
                <ShieldCheck size={18} />
              </div>
            )}
          </div>

          {/* Core Info */}
          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                {profile.name || "Medical Doctor"}
              </h2>

              {/* Verification Status Badge */}
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border self-center sm:self-auto ${
                  isVerified
                    ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                    : "text-amber-800 bg-amber-50 border-amber-200"
                }`}
              >
                <ShieldCheck
                  size={14}
                  className={isVerified ? "text-emerald-600" : "text-amber-600"}
                />
                {isVerified ? "Verified Practitioner" : "Verification Pending"}
              </span>
            </div>

            <p className="text-sm font-semibold text-blue-600 mt-1">
              {profile.specialization || "General Medicine"}
              {profile.qualification ? ` • ${profile.qualification}` : ""}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-4 text-xs text-slate-500 mt-3">
              {profile.hospitalName && (
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} className="text-slate-400" />
                  {profile.hospitalName}
                </span>
              )}
              {profile.medicalRegistrationNumber && (
                <span className="flex items-center gap-1.5">
                  <BadgeCheck size={14} className="text-slate-400" />
                  Reg No: <strong className="text-slate-700">{profile.medicalRegistrationNumber}</strong>
                </span>
              )}
              {profile.experience && (
                <span className="flex items-center gap-1.5">
                  <Award size={14} className="text-slate-400" />
                  {profile.experience} Experience
                </span>
              )}
            </div>

            {profile.bio && (
              <p className="text-xs text-slate-600 mt-3.5 leading-relaxed max-w-2xl bg-slate-50 p-3 rounded-xl border border-slate-100">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Verification Audit Summary Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center sm:text-right shrink-0 text-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              REGISTRATION COUNCIL
            </span>
            <p className="font-semibold text-slate-800">
              {profile.registeredCouncil || "Medical Council"}
            </p>
            <div className="pt-2 border-t border-slate-200/70 text-[11px] text-slate-600 font-medium">
              Status: <span className={isVerified ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>{profile.verificationStatus || "PENDING"}</span>
            </div>
            <p className="text-[10px] text-slate-400">
              MediVault Clinical Network
            </p>
          </div>
        </div>
      </div>

      {/* Editable Professional Information Section */}
      <DoctorProfileDetails doctor={profile} onUpdate={handleUpdate} />

      {/* Uploaded Verification Documents Section */}
      <VerificationDocuments initialDocuments={documents} />
    </div>
  );
};

export default DoctorProfile;
