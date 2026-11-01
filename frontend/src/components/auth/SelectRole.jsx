import { Link } from "react-router-dom";
import { UserRound, Stethoscope, ArrowRight } from "lucide-react";

const roles = [
  {
    title: "Patient",
    description:
      "Store medical reports, manage your health history and control who accesses your records.",
    icon: UserRound,
    login: "/patient/login",
    register: "/patient/register",
  },
  {
    title: "Doctor",
    description:
      "Manage your professional account and access records shared with your approval by patients.",
    icon: Stethoscope,
    login: "/doctor/login",
    register: "/doctor/register",
  },
];

export default function SelectRole() {
  return (
    <div className="space-y-4">
      {roles.map((role) => {
        const Icon = role.icon;

        return (
          <div
            key={role.title}
            className="rounded-xl border border-slate-200 p-5 transition hover:border-blue-300 hover:shadow-xs bg-white"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Icon size={23} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-slate-900">
                  Continue as {role.title}
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {role.description}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <Link
                    to={role.login}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800"
                  >
                    Sign in <ArrowRight size={15} />
                  </Link>

                  <Link
                    to={role.register}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Create account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <p className="pt-2 text-center text-xs leading-5 text-slate-400">
        Your medical records are shared only with the people you authorize.
      </p>
    </div>
  );
}
