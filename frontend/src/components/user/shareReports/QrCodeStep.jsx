import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Download,
  CheckCircle,
  FileText,
  Copy,
  Check,
  KeyRound,
} from "lucide-react";

const QrCodeStep = ({
  reports,
  expiry,
  shareToken,
  shareOtp,
  onBack,
  onReset,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  const displayPin = shareOtp || (shareToken ? shareToken.slice(0, 6).toUpperCase() : "------");
  const shareUrl = `${window.location.origin}/shared-reports/${encodeURIComponent(shareToken)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(displayPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleDownload = () => {
    const svg = document.querySelector("#share-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `MediVault-Share-QR-${displayPin}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
          <CheckCircle size={26} className="text-emerald-600" />
        </div>

        <h2 className="text-lg font-bold text-slate-800">
          Your Secure Share QR Code & Access PIN
        </h2>

        <p className="text-xs text-slate-500 mt-1">
          Doctors can scan this QR code or enter the 6-digit access PIN below.
        </p>

        {/* QR CODE */}
        <div className="inline-flex p-4 border border-slate-200 rounded-2xl mt-5 mb-4 bg-white shadow-2xs">
          <QRCodeSVG
            id="share-qr-code"
            value={shareUrl}
            size={180}
            level="H"
            includeMargin
          />
        </div>

        {/* 6-DIGIT OTP / PIN SHARING BADGE */}
        <div className="max-w-xs mx-auto mb-5 p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-center shadow-2xs">
          <div className="flex items-center justify-center gap-1.5 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <KeyRound size={14} />
            <span>6-Digit Sharing PIN</span>
          </div>
          <div className="text-2xl font-mono font-extrabold tracking-widest text-blue-900 my-1">
            {displayPin}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <button
              onClick={handleCopyPin}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-white border border-blue-200 px-2.5 py-1 rounded-md transition shadow-2xs cursor-pointer"
            >
              {copiedPin ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copiedPin ? "PIN Copied!" : "Copy PIN"}</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-md transition shadow-2xs cursor-pointer"
            >
              {copiedLink ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copiedLink ? "Link Copied!" : "Copy URL"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* REPORT DETAILS */}
      <div className="bg-slate-50 rounded-xl p-4 mt-3 border border-slate-100">
        <div className="flex justify-between mb-2">
          <span className="text-xs text-slate-500">Reports shared</span>
          <span className="text-xs font-bold text-slate-800">{reports.length} files</span>
        </div>

        <div className="flex justify-between mb-3">
          <span className="text-xs text-slate-500">Access duration</span>
          <span className="text-xs font-semibold text-blue-700">{expiry}</span>
        </div>

        <div className="border-t border-slate-200/80 pt-3 space-y-2">
          {reports.map((report) => (
            <div key={report.id} className="flex items-center gap-2">
              <FileText size={14} className="text-blue-600 shrink-0" />
              <span className="text-xs text-slate-700 truncate font-medium">{report.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition"
        >
          <ArrowLeft size={13} className="inline mr-1" />
          Back
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition inline-flex items-center gap-1"
          >
            <Download size={13} />
            <span>Download QR SVG</span>
          </button>

          <button
            onClick={onReset}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 cursor-pointer transition shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default QrCodeStep;
