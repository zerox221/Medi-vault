import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserRound,
  Mail,
  LockKeyhole,
  Stethoscope,
  Building2,
  BadgeCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { userContext } from "../../../Context/UserContext.jsx";
import VerifyEmailModal from "../VerifyEmailModal.jsx";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

export default function DoctorRegister() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    specialization: "",
    qualification: "",
    medicalRegistrationNumber: "",
    registeredCouncil: "",
    hospitalName: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [devOtpNotice, setDevOtpNotice] = useState("");

  const { registerDoctor } = useContext(userContext);
  const navigate = useNavigate();

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await registerDoctor({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        specialization: form.specialization.trim(),
        qualification: form.qualification.trim(),
        medicalRegistrationNumber: form.medicalRegistrationNumber.trim(),
        registeredCouncil: form.registeredCouncil.trim(),
        hospitalName: form.hospitalName ? form.hospitalName.trim() : "",
      });

      if (res?.user) {
        setRegisteredEmail(res.user.email);
        if (res.devOtpNotice) {
          setDevOtpNotice(res.devOtpNotice);
        }
        setShowVerifyModal(true);
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please check your professional details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 animate-in fade-in">
          <AlertCircle size={17} className="shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Full name
          </label>
          <div className="relative">
            <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              required
              placeholder="Dr. Full Name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Professional email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="email"
              required
              placeholder="doctor@example.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Specialization
            </label>
            <div className="relative">
              <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                required
                placeholder="Cardiology"
                value={form.specialization}
                onChange={(e) => update("specialization", e.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Qualification
            </label>
            <input
              required
              placeholder="MBBS, MD"
              value={form.qualification}
              onChange={(e) => update("qualification", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Medical registration number
          </label>
          <div className="relative">
            <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              required
              placeholder="Enter registration number"
              value={form.medicalRegistrationNumber}
              onChange={(e) =>
                update("medicalRegistrationNumber", e.target.value)
              }
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Registered medical council
          </label>
          <input
            required
            placeholder="State Medical Council"
            value={form.registeredCouncil}
            onChange={(e) => update("registeredCouncil", e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Hospital / Clinic (optional)
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              placeholder="Hospital or clinic name"
              value={form.hospitalName}
              onChange={(e) => update("hospitalName", e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
          <p className="text-xs leading-5 text-blue-800">
            Your medical credentials will need to be submitted for verification.
            Registration alone does not verify your professional identity.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-700 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus:ring-4 focus:ring-blue-100 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Creating doctor account...
            </>
          ) : (
            "Create doctor account"
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-5 text-center">
        <p className="text-sm text-slate-500">
          Already registered?{" "}
          <Link
            to="/doctor/login"
            className="font-semibold text-blue-700 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>

      <VerifyEmailModal
        isOpen={showVerifyModal}
        email={registeredEmail}
        initialDevOtpNotice={devOtpNotice}
        onClose={() => navigate("/doctor/dashboard")}
        onVerified={() => navigate("/doctor/dashboard")}
      />
    </>
  );
}
