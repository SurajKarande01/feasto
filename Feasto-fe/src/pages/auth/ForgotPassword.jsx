import { useState } from "react";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    // Simulate password reset (no backend endpoint yet)
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
          <div className="text-center mb-8">
            <span className="text-rose-500 font-black tracking-widest text-lg uppercase block mb-6">Feasto</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Reset Password</h1>
            <p className="text-slate-400 text-xs mt-2.5 leading-relaxed max-w-xs mx-auto">
              Enter your email address and we'll transmit a secure reset link to your inbox.
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
                <span className="text-2xl">📧</span>
              </div>
              <h2 className="text-sm font-black text-emerald-800 uppercase tracking-wider mb-2">Check your email</h2>
              <p className="text-xs text-slate-500 leading-relaxed mb-6 max-w-xs mx-auto">
                If an account matches <strong>{email}</strong>, you will receive a recovery token shortly.
              </p>
              <Link 
                to="/welcome" 
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 px-0.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-500 hover:bg-rose-600 active:scale-98 text-white font-bold text-xs py-3 rounded-xl transition-all duration-200 shadow-md shadow-rose-500/20 cursor-pointer uppercase tracking-wider disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              <div className="text-center pt-2">
                <Link to="/welcome" className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer">
                  ← Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
