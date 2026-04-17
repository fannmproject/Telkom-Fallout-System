import React, { useState } from "react";
import { useNavigate } from "react-router";
import { TelkomLogo } from "../components/TelkomLogo";
import { supabase } from "../lib/supabase";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import telkomBuildingBg from "../../assets/telkom-building.png";

const GRADIENT = "linear-gradient(to right, #360000, #800000)";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError("Gagal mengirim email. Pastikan email terdaftar.");
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center relative px-4 py-12" style={{ backgroundColor: "#f5f5f5" }}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${telkomBuildingBg}')`, opacity: 0.2 }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(128, 0, 0, 0.08)" }} />

        <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-10 text-center max-w-sm w-full">
          <CheckCircle2 size={64} className="mx-auto mb-4" style={{ color: "#800000" }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#800000" }}>Email Terkirim!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Link reset password sudah dikirim ke <strong>{email}</strong>. 
            Silakan cek inbox atau folder spam kamu.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3 rounded-xl text-white font-bold transition-all hover:opacity-90"
            style={{ background: GRADIENT }}
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 py-12" style={{ backgroundColor: "#f5f5f5" }}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${telkomBuildingBg}')`, opacity: 0.2 }}
      />
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(128, 0, 0, 0.08)" }} />

      <button
        onClick={() => navigate("/login")}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
        style={{ color: "#800000" }}
      >
    
      </button>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-7 pb-6 text-center" style={{ background: GRADIENT }}>
            <TelkomLogo size={56} withBg className="mx-auto mb-3" />
            <h1 className="text-xl font-extrabold text-white">Telkom Fallout System</h1>
          </div>

          {/* Form Body */}
          <div className="px-8 py-6">
            <h2 className="text-2xl font-extrabold mb-1" style={{ color: "#800000" }}>
              Lupa Password?
            </h2>
            <p className="text-gray-400 text-sm mb-5">
              Masukkan email Anda untuk menerima link reset password.
            </p>

            {error && (
              <div
                className="mb-5 px-4 py-3 rounded-lg text-sm font-medium"
                style={{ backgroundColor: "#FFF0F0", color: "#800000", border: "1px solid #FFCCCC" }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail size={17} />
                  </span>
                  <input
                    type="email"
                    placeholder="Masukkan email terdaftar"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all"
                    style={{ borderColor: "#E0E0E0", backgroundColor: "#FAFAFA" }}
                    onFocus={(e) => { e.target.style.borderColor = "#800000"; e.target.style.boxShadow = "0 0 0 2px rgba(128,0,0,0.12)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#E0E0E0"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-bold text-base transition-all hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2"
                style={{ background: GRADIENT }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Mengirim...
                  </>
                ) : "Kirim Link Reset Password"}
              </button>
            </form>

            <div className="text-center mt-4">
              <button
                onClick={() => navigate("/login")}
                className="text-sm text-gray-400 hover:text-gray-600 hover:underline transition-all"
              >
                ← Kembali ke Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}