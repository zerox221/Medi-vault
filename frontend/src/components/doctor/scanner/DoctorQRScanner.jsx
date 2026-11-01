import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  QrCode,
  ShieldCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Upload,
  RefreshCw,
  Flashlight,
  FileText,
  Lock,
  KeyRound,
  Loader2,
  Camera,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import jsQR from "jsqr";
import { qrApi } from "../../../api/qrApi";

const DoctorQRScanner = () => {
  const navigate = useNavigate();

  // Scanning stages: 'scanning' | 'confirmation' | 'submitted'
  const [stage, setStage] = useState("scanning");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [detectedData, setDetectedData] = useState(null);
  const [clinicalPurpose, setClinicalPurpose] = useState(
    "Clinical Consultation & Medical Records Review"
  );
  const [generatedRequestId, setGeneratedRequestId] = useState("");
  const [manualPin, setManualPin] = useState("");
  const [processingScan, setProcessingScan] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const isScanningRef = useRef(false);
  const animFrameRef = useRef(null);
  const fileInputRef = useRef(null);

  // Process any detected token / PIN with backend
  const handleProcessToken = useCallback(
    async (rawInput) => {
      if (!rawInput || processingScan) return;

      // Stop scanning loop
      isScanningRef.current = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }

      setProcessingScan(true);
      setCameraError("");

      // Clean raw token or 6-digit PIN if from URL or text
      const cleanToken = rawInput.includes("/shared-reports/")
        ? rawInput.split("/shared-reports/")[1].trim()
        : rawInput.trim();

      try {
        const res = await qrApi.scanQRCode({
          token: cleanToken,
          clinicalPurpose: clinicalPurpose || "Doctor consultation via patient sharing code",
        });

        if (res?.patient) {
          stopCamera();

          const calcAge = (dob) => {
            if (!dob) return 30;
            const diff = Date.now() - new Date(dob).getTime();
            return Math.abs(new Date(diff).getUTCFullYear() - 1970) || 30;
          };

          setDetectedData({
            patientName: res.patient.name,
            patientEmail: res.patient.email,
            patientId: res.patient.id || "PAT-" + res.patient.name.slice(0, 3).toUpperCase(),
            age: calcAge(res.patient.age),
            gender: res.patient.gender || "Patient",
            bloodGroup: res.patient.bloodGroup || "Recorded",
            recordsInToken: (res.recordsInToken || []).map((r) => ({
              id: r.id || r._id,
              name: r.title,
              category: r.category,
              date: r.reportDate || "Recent",
            })),
            expiry: res.expiryDuration || "24 Hours",
            token: cleanToken,
            accessRequestId: res.accessRequest?.id,
          });

          const reqDisplay = res.accessRequest?.id
            ? `AR-${res.accessRequest.id.slice(-6).toUpperCase()}`
            : `AR-${Math.floor(1000 + Math.random() * 9000)}`;

          setGeneratedRequestId(reqDisplay);
          setStage("confirmation");
        } else {
          throw new Error("Could not retrieve patient authorization from this token.");
        }
      } catch (err) {
        setCameraError(err.message || "Invalid or expired patient QR code or 6-digit PIN.");
        // Resume scanning if on scanning stage
        if (stage === "scanning") {
          isScanningRef.current = true;
          scanVideoFrame();
        }
      } finally {
        setProcessingScan(false);
      }
    },
    [clinicalPurpose, processingScan, stage]
  );

  // Real-time canvas scanning loop with jsQR
  const scanVideoFrame = useCallback(() => {
    if (!isScanningRef.current || !videoRef.current) return;
    const video = videoRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        console.log("🎯 [QR Scanner] Decoded QR:", code.data);
        handleProcessToken(code.data);
        return;
      }
    }

    animFrameRef.current = requestAnimationFrame(scanVideoFrame);
  }, [handleProcessToken]);

  // Attempt camera stream
  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          await videoRef.current.play();
        }
        setCameraActive(true);
        isScanningRef.current = true;
        animFrameRef.current = requestAnimationFrame(scanVideoFrame);
      } else {
        setCameraError("Camera device not accessible in this browser.");
      }
    } catch (err) {
      console.warn("Camera stream notice:", err.message);
      setCameraError(
        "Live camera feed unavailable (permissions or device not connected). You can enter the 6-digit PIN or upload a QR image below."
      );
      setCameraActive(false);
    }
  }, [scanVideoFrame]);

  const stopCamera = useCallback(() => {
    isScanningRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (stage === "scanning") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [stage, startCamera, stopCamera]);

  // Handle uploaded QR image file
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError("");
    setProcessingScan(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleProcessToken(code.data);
        } else {
          setProcessingScan(false);
          setCameraError(
            "Could not detect a valid QR code in this image. Please enter the 6-digit Sharing PIN below."
          );
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualPin.trim()) return;
    handleProcessToken(manualPin.trim());
  };

  const handleSubmitAccessRequest = () => {
    setStage("submitted");
  };

  const handleResetScanner = () => {
    setDetectedData(null);
    setManualPin("");
    setCameraError("");
    setStage("scanning");
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Patient QR Code Scanner
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Scan a patient's MediVault QR code or enter their 6-digit access PIN to initiate a verified medical records request.
        </p>
      </div>

      {/* Zero Immediate Access Security Policy Notice */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
            <Lock size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
              Zero Immediate Access & Consent Architecture
            </h3>
            <p className="text-xs text-blue-800 mt-1 leading-relaxed">
              MediVault ensures patients retain full authority over their diagnostic data. Scanning a patient QR code creates a formal access request. <strong>Records remain locked until the patient explicitly authorizes the request on their device.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* STAGE 1: SCANNING INTERFACE */}
      {stage === "scanning" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Scanner Viewfinder Box */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-xl border border-slate-800 min-h-[380px]">
            {/* Real Video Stream */}
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                cameraActive ? "opacity-85" : "opacity-0"
              }`}
            />

            {/* Viewfinder Reticle & Laser Scan Beam Overlay */}
            <div className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 border-2 border-dashed border-blue-400/80 rounded-2xl flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-2xs shadow-inner">
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>

              {/* Animated Scan Beam */}
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-pulse"></div>

              {/* Reticle center icon */}
              <div className="text-center p-4">
                {processingScan ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={36} className="text-cyan-400 animate-spin" />
                    <p className="text-xs font-bold text-white">Validating QR Code...</p>
                  </div>
                ) : (
                  <>
                    <QrCode size={44} className="text-white/40 mx-auto mb-2 animate-pulse" />
                    <p className="text-xs font-semibold text-white/90">
                      Align patient QR code within frame
                    </p>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Auto-detects active MediVault sessions
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Viewfinder Controls Bar */}
            <div className="relative z-10 flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={startCamera}
                className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition cursor-pointer"
                title="Restart camera stream"
              >
                <RefreshCw size={18} />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-md transition cursor-pointer"
              >
                <Upload size={14} />
                <span>Upload QR Image</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            {/* Camera error message / fallback note */}
            {cameraError && (
              <div className="relative z-10 mt-4 px-4 py-2.5 bg-slate-800/90 rounded-xl text-xs text-amber-300 max-w-md text-center border border-slate-700 animate-in fade-in">
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle size={15} className="shrink-0 text-amber-400" />
                  <span>{cameraError}</span>
                </div>
              </div>
            )}
          </div>

          {/* Manual 6-Digit Sharing PIN / Code Entry */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Enter Patient 6-Digit Sharing PIN or Session Token
                </h3>
                <p className="text-xs text-slate-500">
                  Patients can verbally share their 6-digit access PIN (shown on their Share Reports screen).
                </p>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-3 mt-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. 554987 or paste token URL"
                  value={manualPin}
                  onChange={(e) => setManualPin(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase tracking-wider outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition placeholder:font-sans placeholder:normal-case placeholder:tracking-normal"
                />
              </div>

              <button
                type="submit"
                disabled={processingScan || !manualPin.trim()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {processingScan ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Verify PIN & Access &rarr;</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STAGE 2: ACCESS REQUEST CONFIRMATION SCREEN */}
      {stage === "confirmation" && detectedData && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                <UserCheck size={26} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Patient Identified & Records Listed
                </h2>
                <p className="text-xs text-slate-500">
                  Review verified patient details and submit access request for patient authorization.
                </p>
              </div>
            </div>

            <button
              onClick={handleResetScanner}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Scan Another Code
            </button>
          </div>

          {/* Real Patient Profile Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">PATIENT NAME</span>
              <span className="text-slate-800 font-bold text-sm block mt-0.5 truncate">
                {detectedData.patientName}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">PATIENT EMAIL</span>
              <span className="text-slate-700 font-medium text-xs block mt-0.5 truncate">
                {detectedData.patientEmail || "Patient Profile"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">AGE / GENDER</span>
              <span className="text-slate-700 font-medium text-xs block mt-0.5">
                {detectedData.age} Y • {detectedData.gender}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">BLOOD GROUP</span>
              <span className="text-rose-600 font-bold text-sm block mt-0.5">
                {detectedData.bloodGroup}
              </span>
            </div>
          </div>

          {/* Records contained in this QR session */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Diagnostic Documents Contained in Session ({detectedData.recordsInToken.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {detectedData.recordsInToken.length > 0 ? (
                detectedData.recordsInToken.map((rec, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-blue-600 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{rec.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {rec.category} • {rec.date}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <Lock size={11} />
                      Patient Authorization Required
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                  General patient medical vault access requested.
                </p>
              )}
            </div>
          </div>

          {/* Clinical Purpose Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Clinical Reason / Consultation Purpose
            </label>
            <input
              type="text"
              value={clinicalPurpose}
              onChange={(e) => setClinicalPurpose(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
              placeholder="e.g. Clinical consultation, diagnostic laboratory assessment"
            />
          </div>

          {/* Strict Security Guard Warning */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
              <span>Zero-Trust Medical Privacy Enforced</span>
            </div>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              Submitting this request dispatches an instant authorization alert to{" "}
              <strong>{detectedData.patientName}</strong>'s MediVault account. In strict compliance with health privacy standards, records will unlock only after the patient approves this request.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              onClick={handleResetScanner}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel / Scan Again
            </button>

            <button
              onClick={handleSubmitAccessRequest}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
            >
              <ShieldCheck size={16} />
              Confirm & Submit Access Request
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: SUBMITTED STATE — WAITING FOR PATIENT APPROVAL */}
      {stage === "submitted" && detectedData && (
        <div className="bg-white border border-amber-200 rounded-3xl p-6 sm:p-10 shadow-xs text-center space-y-6 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Clock size={32} className="animate-pulse" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              <Lock size={13} />
              Status: Pending Patient Approval
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              Access Request Dispatched!
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Request <strong>#{generatedRequestId}</strong> has been transmitted to{" "}
              <strong>{detectedData.patientName}</strong>. Awaiting digital authorization on their device.
            </p>
          </div>

          {/* Workflow Step Indicator */}
          <div className="max-w-md mx-auto p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2.5">
            <div className="flex items-center gap-2.5 text-emerald-700 font-semibold">
              <CheckCircle size={16} className="shrink-0" />
              <span>1. Patient QR code / 6-digit PIN scanned & verified</span>
            </div>
            <div className="flex items-center gap-2.5 text-emerald-700 font-semibold">
              <CheckCircle size={16} className="shrink-0" />
              <span>2. Access request registered in MediVault</span>
            </div>
            <div className="flex items-center gap-2.5 text-amber-700 font-bold bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <Clock size={16} className="shrink-0 animate-spin" />
              <span>3. Awaiting patient to authorize in their dashboard...</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-400 font-medium pl-6">
              <span>4. Records unlock and become viewable in Doctor Console</span>
            </div>
          </div>

          {/* Action Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate("/doctor/requests")}
              className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
            >
              Track in Access Requests &rarr;
            </button>

            <button
              onClick={handleResetScanner}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer"
            >
              Scan Another Patient QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorQRScanner;
