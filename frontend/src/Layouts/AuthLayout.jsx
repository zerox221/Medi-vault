
import { Link, Outlet, useLocation } from "react-router-dom";
import { HeartPulse, ShieldCheck } from "lucide-react";

const pageDetails = {
  "/auth": {
    title: "Welcome to MediVault",
    subtitle: "Choose how you want to continue.",
  },
  "/patient/login": {
    title: "Welcome back",
    subtitle: "Sign in to access your medical records.",
  },
  "/patient/register": {
    title: "Create your account",
    subtitle: "Start managing your medical records securely.",
  },
  "/doctor/login": {
    title: "Doctor sign in",
    subtitle: "Access your professional MediVault account.",
  },
  "/doctor/register": {
    title: "Doctor registration",
    subtitle: "Create your professional account.",
  },
};

export default function AuthLayout() {
  const { pathname } = useLocation();
  const page = pageDetails[pathname] || pageDetails["/auth"];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to="/auth" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-white">
              <HeartPulse size={21} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Medi<span className="text-blue-700">Vault</span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
            <ShieldCheck size={17} className="text-blue-700" />
            Secure healthcare records
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-[460px]">
          <div className="mb-7 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {page.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {page.subtitle}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <Outlet />
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} MediVault. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
