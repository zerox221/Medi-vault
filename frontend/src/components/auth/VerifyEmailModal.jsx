import React, { useState, useEffect, useRef } from "react";
import { Mail, CheckCircle2, AlertCircle, Loader2, X, RefreshCw, Sparkles, ShieldCheck } from "lucide-react";
import { authApi } from "../../api/authApi";

export default function VerifyEmailModal({
  isOpen,
  email,
  initialDevOtpNotice = "",
  onClose,
  onVerified,
}) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [devOtpNotice, setDevOtpNotice] = useState(initialDevOtpNotice);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (initialDevOtpNotice) {
      setDevOtpNotice(initialDevOtpNotice);
    }
  }, [initialDevOtpNotice]);

  useEffect(() => {
    let timer;
    if (cooldown > 0 && isOpen) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setOtp(["", "", "", "", "", ""]);
      setError("");
      setSuccess(false);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const autofillDevOtp = () => {
    const match = devOtpNotice.match(/\d{6}/);
    if (match) {
      const digits = match[0].split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await authApi.verifyEmail(email, fullOtp);
      setSuccess(true);
      setTimeout(() => {
        if (onVerified) onVerified(res);
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || "Invalid or expired verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError("");

    try {
      const res = await authApi.resendOTP(email);
      setCooldown(60);
      if (res?.devOtpNotice) {
        setDevOtpNotice(res.devOtpNotice);
      }
    } catch (err) {
      setError(err.message || "Could not resend code. Please try again later.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          title="Skip or Close"
        >
          <X size={20} />
        </button>

        {success ? (
          <div className="text-center py-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Email Verified!</h3>
            <p className="text-sm text-slate-600">
              Your MediVault account has been verified successfully.
            </p>
          </div>
        ) : (
          <div>
            {/* Header Icon */}
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={30} />
            </div>

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 mb-1">
                Verify Your Account
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Enter the 6-digit code sent to{" "}
                <span className="font-semibold text-slate-700">{email}</span>
              </p>
            </div>

            {/* Dev OTP Helper Banner if present */}
            {devOtpNotice && (
              <div
                onClick={autofillDevOtp}
                className="mb-5 p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center justify-between text-xs text-blue-700 cursor-pointer hover:bg-blue-100/80 transition"
                title="Click to autofill code"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-500 shrink-0" />
                  <span className="font-medium">{devOtpNotice}</span>
                </div>
                <span className="font-semibold text-blue-600 underline text-[11px]">
                  Autofill
                </span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join("").length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Verify Account</span>
                )}
              </button>
            </form>

            {/* Resend and Footer */}
            <div className="mt-6 text-center text-xs text-slate-500 space-y-3">
              <div className="flex items-center justify-center gap-1.5">
                <span>Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || resending}
                  className="font-semibold text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1"
                >
                  {resending && <RefreshCw size={12} className="animate-spin" />}
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                </button>
              </div>

              <div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 transition underline"
                >
                  I'll verify my email later
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
