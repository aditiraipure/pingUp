import { Archive, Bell, ChevronRight, CircleHelp, Info, LockKeyhole, Moon, ShieldCheck, UserCog, WalletCards } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createElement } from "react";

const sections = [
  { label: "Profile Settings", description: "Update your profile, photo, bio, and personal details.", icon: UserCog, to: "/profile" },
  { label: "Account Settings", description: "Manage your account information and preferences.", icon: WalletCards },
  { label: "Privacy", description: "Control who can view and interact with your content.", icon: ShieldCheck },
  { label: "Notifications", description: "Choose which activity notifications you receive.", icon: Bell },
  { label: "Appearance", description: "Switch between Light and Dark mode.", icon: Moon, to: "/appearance" },
  { label: "Archive", description: "View, restore, or permanently delete archived posts.", icon: Archive, to: "/archive" },
  { label: "Security", description: "Review sign-in and account security options.", icon: LockKeyhole },
  { label: "Help & Support", description: "Find help and answers to common questions.", icon: CircleHelp },
  { label: "About", description: "Learn more about PingUp.", icon: Info },
];

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white p-6 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="mt-2 text-slate-600">Manage your PingUp experience and preferences.</p>
        </div>
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
          {sections.map(({ label, description, icon: Icon, to }, index) => (
            <button key={label} type="button" onClick={() => to && navigate(to)} className={`flex w-full items-center gap-4 p-4 text-left transition hover:bg-slate-50 sm:p-5 ${index < sections.length - 1 ? "border-b border-slate-100" : ""}`}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">{createElement(Icon, { className: "h-5 w-5" })}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-slate-800">{label}</span>
                <span className="mt-0.5 block text-sm text-slate-500">{description}</span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
