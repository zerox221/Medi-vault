import React, { useState, useEffect } from "react";
import {
  FileText,
  ShieldCheck,
  Upload,
  CheckCircle2,
  Clock,
  Eye,
  Plus,
  X,
  BadgeCheck,
  Loader2,
} from "lucide-react";
import { doctorApi } from "../../../api/doctorApi";

const VerificationDocuments = ({ initialDocuments }) => {
  const [documents, setDocuments] = useState(initialDocuments || []);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("Medical License");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    if (initialDocuments) {
      setDocuments(initialDocuments);
    }
  }, [initialDocuments]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    if (selectedFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("document", selectedFile);
        formData.append("title", newDocTitle.trim());
        formData.append("category", newDocCategory);

        const res = await doctorApi.uploadVerificationDocument(formData);
        if (res?.document) {
          const newDoc = {
            id: res.document._id,
            title: res.document.title,
            category: res.document.category,
            issueDate: new Date().toLocaleDateString(),
            verifiedDate: "Under Admin Review",
            status: "Under Review",
            fileSize: res.document.fileSize || "1.0 MB",
            format: res.document.format || "PDF",
            issuer: "State Medical Council",
            fileUrl: res.document.fileUrl,
          };
          setDocuments([newDoc, ...documents]);
        }
      } catch (err) {
        alert(err.message || "Failed to upload document.");
      } finally {
        setUploading(false);
        setShowUploadModal(false);
        setNewDocTitle("");
        setSelectedFile(null);
      }
    } else {
      const newDoc = {
        id: `DOC-${Math.floor(105 + Math.random() * 50)}`,
        title: newDocTitle.trim(),
        category: newDocCategory,
        issueDate: new Date().toLocaleDateString(),
        verifiedDate: "Pending Review",
        status: "Under Review",
        fileSize: "1.5 MB",
        format: "PDF",
        issuer: "State Council / Hospital Authority",
      };
      setDocuments([newDoc, ...documents]);
      setShowUploadModal(false);
      setNewDocTitle("");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">
              Uploaded Verification Documents
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck size={12} />
              NMC Audited
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official medical credentials, state council licenses, and institutional accreditations.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition self-start sm:self-auto"
        >
          <Plus size={15} />
          Upload New Document
        </button>
      </div>

      {/* Documents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.length === 0 ? (
          <div className="col-span-full p-8 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
            No verification documents uploaded yet. Click 'Upload New Document' to submit your medical license or certificates for review.
          </div>
        ) : (
          documents.map((doc) => {
            const isVerified = doc.status === "Verified" || doc.status === "Approved";

          return (
            <div
              key={doc.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition bg-slate-50/40 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 leading-snug">
                        {doc.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {doc.category} • {doc.issuer}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      isVerified
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {isVerified ? (
                      <>
                        <CheckCircle2 size={11} />
                        Verified
                      </>
                    ) : (
                      <>
                        <Clock size={11} />
                        Under Review
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 py-2 border-t border-slate-100 mt-2">
                  <span>Issued: {doc.issueDate}</span>
                  <span>{doc.format} • {doc.fileSize}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                >
                  <Eye size={13} />
                  Preview Document
                </button>
              </div>
            </div>
          );
        })
        )}
      </div>

      {/* Upload New Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                Upload Verification Document
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fellowship in Cardiology Certificate"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Category
                </label>
                <select
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                >
                  <option value="Academic Qualification">Academic Qualification (Degree/Diploma)</option>
                  <option value="Medical License">State Medical Council Registration</option>
                  <option value="Hospital Affiliation">Hospital Accreditation / Staff ID</option>
                  <option value="Board Certification">Board / Super-Specialty Certification</option>
                  <option value="Government ID">Government Identity Proof</option>
                </select>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center bg-slate-50 relative">
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload size={24} className="text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-700 font-medium">
                  {selectedFile ? selectedFile.name : "Click to select file or drag PDF/JPEG here"}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Maximum file size: 10 MB (PDF, PNG, JPG)
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Uploading to Vault...
                    </>
                  ) : (
                    "Submit for Verification"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {previewDoc.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {previewDoc.category} • {previewDoc.issuer}
                </p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 bg-slate-100 rounded-xl border border-slate-200 text-center space-y-3">
              <BadgeCheck size={48} className="text-blue-600 mx-auto" />
              <p className="text-sm font-bold text-slate-800">
                Official Credential Verification Record
              </p>
              <div className="text-xs text-slate-600 max-w-xs mx-auto space-y-1">
                <p>Status: <strong className="text-emerald-700">{previewDoc.status}</strong></p>
                <p>Verified Date: {previewDoc.verifiedDate}</p>
                <p>File: {previewDoc.format} ({previewDoc.fileSize})</p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationDocuments;
