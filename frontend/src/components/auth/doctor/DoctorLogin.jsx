import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, LockKeyhole, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { userContext } from "../../../Context/UserContext.jsx";

export default function DoctorLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const { login } = useContext(userContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login({
        email: form.email,
        password: form.password,
        role: "doctor",
      });

      if (res?.user?.role === "doctor") {
        navigate("/doctor/dashboard");
      } else if (res?.user?.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/user");
      }
    } catch (err) {
      setError(err.message || "Invalid doctor credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 animate-in fade-in">
          <AlertCircle size={17} className="shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Professional email
          </label>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="doctor@example.com"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex justify-between">
            <label className="text-sm font-medium text-slate-700">
              Password
            </label>
            <span className="text-xs font-medium text-slate-400">
              Min 8 characters
            </span>
          </div>

          <div className="relative">
            <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-11 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-700 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus:ring-4 focus:ring-blue-100 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Signing in...
            </>
          ) : (
            "Doctor sign in"
          )}
        </button>
      </form>

      <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800">
        Doctor credential verification is validated by administrators before accessing protected patient records.
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5 text-center">
        <p className="text-sm text-slate-500">
          New doctor?{" "}
          <Link
            to="/doctor/register"
            className="font-semibold text-blue-700 hover:underline"
          >
            Register here
          </Link>
        </p>
      </div>

      <p className="mt-4 text-center text-sm text-slate-500">
        Are you a patient?{" "}
        <Link to="/patient/login" className="font-medium text-blue-700 hover:underline">
          Patient sign in
        </Link>
      </p>
    </>
  );
}
