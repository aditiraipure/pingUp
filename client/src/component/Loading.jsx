import { assets } from "../assets/assets";

const Loading = ({ height = "100vh" }) => {
  return (
    <div
      style={{ height }}
      className="relative isolate flex justify-center items-center w-full overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-white"
    >
      <div className="absolute -top-28 -left-24 w-80 h-80 rounded-full bg-indigo-200/40 blur-3xl animate-pulse" />
      <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-purple-200/50 blur-3xl animate-pulse [animation-delay:600ms]" />
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,white_0,transparent_65%)]" />

      <div className="relative flex flex-col items-center px-6 text-center animate-[pingup-loader-enter_500ms_ease-out_both]">
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-3xl bg-purple-400/20 blur-2xl animate-pulse" />
          <div className="relative rounded-3xl border border-white/80 bg-white/75 px-8 py-6 shadow-xl shadow-purple-200/40 backdrop-blur">
            <img src={assets.logo} alt="PingUp" className="h-10 sm:h-12 w-auto animate-[pingup-logo-breathe_2.4s_ease-in-out_infinite]" />
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-semibold text-indigo-950">Loading your world...</h1>
        <p className="mt-2 text-sm text-slate-500">Getting things ready for you</p>

        <div className="mt-7 flex items-center gap-2" aria-label="Loading">
          {[0, 150, 300].map((delay) => (
            <span key={delay} className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
};
export default Loading;
