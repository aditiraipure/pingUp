import { Clock3, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../context/themeContext";

const Appearance = () => {
  const { theme, setTheme } = useTheme();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white p-6 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Appearance</h1>
          <p className="mt-2 text-slate-600">Personalize how PingUp looks on this device.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
            <h2 className="font-semibold text-slate-800">Theme</h2>
            <p className="mt-1 text-sm text-slate-500">Choose the experience that feels right for you.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setTheme("light")} aria-pressed={theme === "light"} className={`rounded-xl border p-4 text-left transition duration-200 ${theme === "light" ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-300"}`}>
                <span className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-amber-100 text-amber-600"><Sun className="h-5 w-5" /></span>
                <span className="block font-medium text-slate-800">Light Mode</span>
                <span className="mt-1 block text-xs text-slate-500">Bright and familiar</span>
              </button>
              <button type="button" onClick={() => setTheme("dark")} aria-pressed={theme === "dark"} className={`rounded-xl border p-4 text-left transition duration-200 ${theme === "dark" ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-300"}`}>
                <span className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-indigo-100 text-indigo-600"><Moon className="h-5 w-5" /></span>
                <span className="block font-medium text-slate-800">Dark Mode</span>
                <span className="mt-1 block text-xs text-slate-500">Comfortable in low light</span>
              </button>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-sm">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
            <div className="relative">
              <div className="flex items-center gap-2 text-indigo-100"><Clock3 className="h-5 w-5" /><span className="text-sm font-medium">Current local time</span></div>
              <p className="mt-8 text-4xl font-semibold tabular-nums">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
              <p className="mt-2 text-sm text-indigo-100">{now.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              <p className="mt-8 text-xs text-indigo-200">{Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Appearance;
