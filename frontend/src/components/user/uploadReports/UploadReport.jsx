
import React, { useState } from "react";

import Sidebar from "../myreports/Sidebar";
import TopNavbar from "../myreports/TopNavbar";

import UploadDropzone from "./UploadDropzone";
import UploadReportForm from "./UploadReportForm";

const UploadReport = () => {

    // Selected PDF file
    const [file, setFile] = useState(null);

    // Form data with screenshot values
    const [formData, setFormData] = useState({
        reportName: "Complete Blood Count",
        reportType: "Blood Test",
        reportDate: "2026-10-12",
        hospitalName: "City Diagnostic Lab",
    });

    // Upload form submission
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!file) {
            alert("Please choose a PDF file first.");
            return;
        }

        alert(
            `Report "${formData.reportName}" is ready for upload.`
        );

        console.log("Report details:", formData);
        console.log("Selected PDF:", file);
    };

    // Cancel form
    const handleCancel = () => {
        setFile(null);

        setFormData({
            reportName: "Complete Blood Count",
            reportType: "Blood Test",
            reportDate: "2026-10-12",
            hospitalName: "City Diagnostic Lab",
        });
    };

    return (
        <div className="flex min-h-screen bg-slate-50">

            {/* Sidebar */}
            <Sidebar />

            {/* Main content */}
            <main className="flex-1 min-w-0">

                {/* Top navbar */}
                <TopNavbar />

                <div className="max-w-[850px] mx-auto px-5 py-6">

                    {/* Breadcrumb */}
                    <p className="text-[10px] text-slate-500 mb-2">
                        Dashboard / Upload Report
                    </p>

                    {/* Page heading */}
                    <div className="mb-4">
                        <h1 className="text-xl font-bold text-slate-800">
                            Upload a Medical Report
                        </h1>

                        <p className="text-xs text-slate-500">
                            Add a medical document to your personal records.
                        </p>
                    </div>

                    {/* PDF upload area */}
                    <UploadDropzone
                        file={file}
                        setFile={setFile}
                    />

                    {/* Report details form */}
                    <UploadReportForm
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                    />

                </div>
            </main>
        </div>
    );
};

export default UploadReport;
