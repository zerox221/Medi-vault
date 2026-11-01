import React, { useRef, useState } from "react";
import { FileText, Upload, X, AlertCircle } from "lucide-react";

const UploadDropzone = ({ file, setFile }) => {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (selectedFile) => {
    setError("");

    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported for clinical analysis.");
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setError("File size exceeds 15 MB limit.");
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const openPicker = (e) => {
    if (e) e.stopPropagation();
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openPicker}
        className={`min-h-[190px] w-full cursor-pointer rounded-2xl border-2 border-dashed p-6
        flex flex-col items-center justify-center text-center transition duration-200 ${
          isDragging
            ? "border-blue-500 bg-blue-100/80 scale-[1.01]"
            : file
            ? "border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/70"
            : "border-blue-200 bg-blue-50/50 hover:bg-blue-100/60"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        {file ? (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
              <FileText size={26} />
            </div>

            <p className="text-sm font-bold text-slate-800 max-w-sm truncate">
              {file.name}
            </p>

            <p className="text-xs text-slate-500 mt-0.5">
              {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI extraction
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={openPicker}
                className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Change File
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="flex items-center gap-1 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                <X size={13} /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
              <Upload size={24} />
            </div>

            <p className="text-sm font-bold text-slate-800">
              Drag & Drop your medical PDF report here
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Supports diagnostic lab tests, prescriptions, and clinical scans
            </p>

            <button
              type="button"
              onClick={openPicker}
              className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs cursor-pointer"
            >
              <Upload size={14} />
              <span>Choose PDF from Computer</span>
            </button>

            <p className="mt-2.5 text-[11px] text-slate-400">
              PDF documents up to 15 MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 animate-in fade-in">
          <AlertCircle size={15} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default UploadDropzone;
