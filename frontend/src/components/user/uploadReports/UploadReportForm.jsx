
import React from "react";

const UploadReportForm = ({
    formData,
    setFormData,
    onSubmit,
    onCancel,
}) => {
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    return (
        <form
            onSubmit={onSubmit}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mt-3"
        >
            {/* Report Name */}
            <div className="mb-3">
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Report Name *
                </label>

                <input
                    type="text"
                    name="reportName"
                    value={formData.reportName}
                    onChange={handleChange}
                    required
                    placeholder="Enter report name"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-500"
                />
            </div>

            {/* Report Type */}
            <div className="mb-3">
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Report Type *
                </label>

                <select
                    name="reportType"
                    value={formData.reportType}
                    onChange={handleChange}
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 bg-white outline-none focus:border-blue-500"
                >
                    <option value="Blood Test">Blood Test</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Scans & Imaging">Scans & Imaging</option>
                    <option value="Blood Sugar">Blood Sugar</option>
                    <option value="General Checkup">General Checkup</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            {/* Report Date */}
            <div className="mb-3">
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Report Date
                </label>

                <input
                    type="date"
                    name="reportDate"
                    value={formData.reportDate}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-500"
                />
            </div>

            {/* Hospital / Lab Name */}
            <div className="mb-3">
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Hospital / Lab Name
                </label>

                <input
                    type="text"
                    name="hospitalName"
                    value={formData.hospitalName}
                    onChange={handleChange}
                    placeholder="Enter hospital or lab name"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-500"
                />
            </div>

            {/* Form buttons */}
            <div className="flex justify-end gap-2 mt-4">

                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                    Upload Report
                </button>

            </div>
        </form>
    );
};

export default UploadReportForm;
