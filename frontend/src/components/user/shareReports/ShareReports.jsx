import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ShareReportsHeader from "./ShareReportsHeader";
import ShareSteps from "./ShareSteps";
import ReportSelection from "./ReportSelection";
import ExpiryStep from "./ExpiryStep";
import QrCodeStep from "./QrCodeStep";
import PatientAccessRequests from "./PatientAccessRequests";
import { recordsApi } from "../../../api/recordsApi";
import { qrApi } from "../../../api/qrApi";
import { sharingApi } from "../../../api/sharingApi";
import { Loader2, AlertCircle, QrCode, ShieldCheck } from "lucide-react";

const ShareReports = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    return location.search.includes("tab=requests") || location.pathname.includes("shared-records")
      ? "requests"
      : "qr";
  });

  const [pendingCount, setPendingCount] = useState(0);
  const [reports, setReports] = useState([]);
  const [selectedReports, setSelectedReports] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [expiry, setExpiry] = useState("24 hours");
  const [shareToken, setShareToken] = useState("");
  const [shareOtp, setShareOtp] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Check pending requests on mount
  useEffect(() => {
    const checkPending = async () => {
      try {
        const data = await sharingApi.getPatientSharingRequests();
        const pending = (data?.requests || []).filter((r) => r.status === "pending").length;
        setPendingCount(pending);
        if (pending > 0 && !location.search.includes("tab=qr")) {
          // If there are pending requests and user didn't specifically ask for qr, surface tab
          setActiveTab("requests");
        }
      } catch (err) {
        console.warn("Could not check pending requests:", err.message);
      }
    };
    checkPending();
  }, [location]);

  useEffect(() => {
    const fetchUserReports = async () => {
      try {
        const res = await recordsApi.getPatientRecords();
        if (res?.records) {
          const formatted = res.records.map((r) => ({
            id: r._id,
            name: r.title,
            type: r.category,
            date: r.reportDate || "Recent",
          }));
          setReports(formatted);
          if (formatted.length > 0) {
            setSelectedReports([formatted[0].id]);
          }
        }
      } catch (err) {
        console.warn("Could not load reports for sharing:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserReports();
  }, []);

  // Select or deselect individual report
  const handleToggleReport = (id) => {
    setSelectedReports((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedReports(reports.map((report) => report.id));
  };

  const handleDeselectAll = () => {
    setSelectedReports([]);
  };

  const parseExpiryHours = (str) => {
    if (str.includes("1 hour")) return 1;
    if (str.includes("6 hours")) return 6;
    if (str.includes("12 hours")) return 12;
    if (str.includes("24 hours")) return 24;
    if (str.includes("48 hours")) return 48;
    if (str.includes("7 days")) return 168;
    if (str.includes("30 days")) return 720;
    return 24;
  };

  const handleContinue = async () => {
    setError("");

    if (currentStep === 1) {
      if (selectedReports.length === 0) {
        setError("Please select at least one medical report to share.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setSubmitting(true);
      try {
        const hours = parseExpiryHours(expiry);
        const res = await qrApi.createQRSession({
          recordIds: selectedReports,
          expiryHours: hours,
        });

        if (res?.shareToken) {
          setShareToken(res.shareToken);
          setShareOtp(res.shareOtp || "");
          setQrDataUrl(res.qrDataUrl || "");
          setCurrentStep(3);
        } else {
          setError("Failed to create QR sharing session.");
        }
      } catch (err) {
        setError(err.message || "Failed to generate QR sharing session.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    setCurrentStep((previous) => Math.max(1, previous - 1));
  };

  const handleReset = () => {
    setCurrentStep(1);
    setShareToken("");
    setShareOtp("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 sm:px-6 py-7 lg:px-10 pb-16">
      <div className="max-w-[850px] mx-auto space-y-6">
        {/* PAGE HEADER */}
        <ShareReportsHeader />

        {/* TABS SELECTOR */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab("qr")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === "qr"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <QrCode size={16} />
            <span>Generate Share QR & PIN</span>
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer relative ${
              activeTab === "requests"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <ShieldCheck size={16} />
            <span>Doctor Access Requests</span>
            {pendingCount > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "requests"
                    ? "bg-white text-blue-700"
                    : "bg-amber-500 text-white animate-pulse"
                }`}
              >
                {pendingCount} Pending
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: DOCTOR ACCESS REQUESTS */}
        {activeTab === "requests" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs animate-in fade-in duration-150">
            <PatientAccessRequests onCountChange={setPendingCount} />
          </div>
        )}

        {/* TAB 2: GENERATE SHARE QR / PIN */}
        {activeTab === "qr" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP INDICATOR */}
            <ShareSteps currentStep={currentStep} />

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                <Loader2 size={24} className="animate-spin text-blue-600" />
                <span>Retrieving your reports...</span>
              </div>
            ) : (
              <>
                {/* STEP 1 */}
                {currentStep === 1 && (
                  <ReportSelection
                    reports={reports}
                    selectedReports={selectedReports}
                    onToggleReport={handleToggleReport}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                    onContinue={handleContinue}
                  />
                )}

                {/* STEP 2 */}
                {currentStep === 2 && (
                  <ExpiryStep
                    expiry={expiry}
                    setExpiry={setExpiry}
                    onBack={handleBack}
                    onContinue={handleContinue}
                    submitting={submitting}
                  />
                )}

                {/* STEP 3 */}
                {currentStep === 3 && (
                  <QrCodeStep
                    reports={reports.filter((r) => selectedReports.includes(r.id))}
                    expiry={expiry}
                    shareToken={shareToken}
                    shareOtp={shareOtp}
                    qrDataUrl={qrDataUrl}
                    onBack={handleBack}
                    onReset={handleReset}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareReports;
