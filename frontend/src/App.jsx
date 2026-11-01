import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Context
import { userContext } from "./Context/UserContext.jsx";

// Protected Routes
import UserProtectedRoute from "./routes/UserProtectedRoute";
import DoctorProtectedRoute from "./routes/DoctorProtectedRoute";
import AdminProtectedRoute from "./routes/AdminProtectedRoute";

// User Components & Layout
import UserLayout from "./Layouts/UserLayout.jsx";
import UserDashboard from "./components/user/Userdashboard/Userdashboard.jsx";
import MyReports from "./components/user/userReports/MyReport.jsx";
import UploadReport from "./components/user/uploadReports/UploadReport.jsx";
import MedicalTimeline from "./components/user/medicalTimeline/MedicalTimeline.jsx";
import ShareReports from "./components/user/shareReports/ShareReports.jsx";
import Activity from "./components/user/userActivity/Activity.jsx";
import Profile from "./components/user/userProfile/Profile.jsx";
import PatientAiAssistant from "./components/user/aiAssistant/PatientAiAssistant.jsx";

// Doctor Components & Layout
import DoctorLayout from "./Layouts/DoctorLayout.jsx";
import DoctorDashboard from "./components/doctor/dashboard/DoctorDashboard.jsx";
import MyPatients from "./components/doctor/patients/MyPatients.jsx";
import AccessRequests from "./components/doctor/requests/AccessRequests.jsx";
import SharedRecords from "./components/doctor/records/SharedRecords.jsx";
import DoctorMedicalSearch from "./components/doctor/search/DoctorMedicalSearch.jsx";
import DoctorQRScanner from "./components/doctor/scanner/DoctorQRScanner.jsx";
import DoctorProfile from "./components/doctor/profile/DoctorProfile.jsx";

// Admin Components & Layout
import AdminLayout from "./Layouts/AdminLayout.jsx";
import AdminDashboard from "./components/admin/AdminDashboard.jsx";
import AdminDoctors from "./components/admin/AdminDoctors.jsx";
import AdminPatients from "./components/admin/AdminPatients.jsx";
import AdminActivity from "./components/admin/AdminActivity.jsx";

// Auth Components
import SelectRole from "./components/auth/SelectRole.jsx";
import PatientLogin from "./components/auth/patient/PatientLogin.jsx";
import PatientRegister from "./components/auth/patient/PatientRegister.jsx";
import DoctorLogin from "./components/auth/doctor/DoctorLogin.jsx";
import DoctorRegister from "./components/auth/doctor/DoctorRegister.jsx";
import AuthLayout from "./Layouts/AuthLayout.jsx";

// 404
import NotFound from "./components/not found/Notfound.jsx";

const App = () => {
  const { user } = useContext(userContext);

  return (
    <Routes>
      {/* Root entry point */}
      <Route
        path="/"
        element={
          user?.role === "user" ? (
            <Navigate to="/user" replace />
          ) : user?.role === "doctor" ? (
            <Navigate to="/doctor/dashboard" replace />
          ) : user?.role === "admin" ? (
            <Navigate to="/admin/dashboard" replace />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />

      {/* USER PROTECTED ROUTES */}
      <Route element={<UserProtectedRoute user={user} />}>
        <Route path="/user" element={<UserLayout />}>
          <Route index element={<UserDashboard />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="ai-assistant" element={<PatientAiAssistant />} />
          <Route path="reports" element={<MyReports />} />
          <Route path="my-reports" element={<MyReports />} />
          <Route path="upload" element={<UploadReport />} />
          <Route path="upload-report" element={<UploadReport />} />
          <Route path="timeline" element={<MedicalTimeline />} />
          <Route path="my-timeline" element={<MedicalTimeline />} />
          <Route path="share" element={<ShareReports />} />
          <Route path="shared-records" element={<ShareReports />} />
          <Route path="activity" element={<Activity />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      {/* DOCTOR PROTECTED ROUTES */}
      <Route element={<DoctorProtectedRoute user={user} />}>
        <Route path="/doctor" element={<DoctorLayout />}>
          <Route index element={<DoctorDashboard />} />
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="search" element={<DoctorMedicalSearch />} />
          <Route path="patients" element={<MyPatients />} />
          <Route path="requests" element={<AccessRequests />} />
          <Route path="records" element={<SharedRecords />} />
          <Route path="scan-qr" element={<DoctorQRScanner />} />
          <Route path="profile" element={<DoctorProfile />} />
        </Route>
      </Route>

      {/* ADMIN PROTECTED ROUTES */}
      <Route element={<AdminProtectedRoute user={user} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="doctors" element={<AdminDoctors />} />
          <Route path="patients" element={<AdminPatients />} />
          <Route path="activity" element={<AdminActivity />} />
        </Route>
      </Route>

      {/* PUBLIC AUTH ROUTES */}
      <Route element={<AuthLayout />}>
        <Route path="/auth" element={<SelectRole />} />
        <Route path="/patient/login" element={<PatientLogin />} />
        <Route path="/patient/register" element={<PatientRegister />} />
        <Route path="/doctor/login" element={<DoctorLogin />} />
        <Route path="/doctor/register" element={<DoctorRegister />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
