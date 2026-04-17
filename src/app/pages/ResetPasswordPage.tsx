import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { TelkomLogo } from "../components/TelkomLogo";
import { supabase } from "../lib/supabase";
import { Lock, EyeOff, Eye, CheckCircle2, AlertCircle } from "lucide-react";
import telkomBuildingBg from "../../assets/telkom-building.png";

const GRADIENT = "linear-gradient(to right, #360000, #800000)";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const processToken = async () => {
      // Format baru Supabase — pakai "code" di URL query
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setIsExpired(true);
          } else {
            setIsReady(true);
          }
        } catch {
          setIsExpired(true);
        }
        return;
      }

      // Format lama — pakai access_token di hash
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");
      const errorCode = params.get("error_code");
      const errorDesc = params.get("error_description");

      if (errorCode || errorDesc) {
        setIsExpired(true);
        return;
      }

      if (accessToken && type === "recovery") {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });
          if (error) {
            setIsExpired(true);
          } else {
            setIsReady(true);
          }
        } catch {
          setIsExpired(true);
        }
        return;
      }

      // Cek session yang sudah ada
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsReady(true);
        return;
      }

      setIsExpired(true);
    };

    processToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Password dan Confirm Password tidak cocok.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: form.password });

    if (error) {
      setError("Gagal reset password. Link mungkin sudah kadaluarsa.");
    } else {
      setSuccess(true);
      await supabase.auth.signOut();
      setTimeout(() => navigate("/login"), 3000);
    }
    setLoading(false);
  };

  const inputStyle = { borderColor: "#E0E0E0", backgroundColor: "#FAFAFA" };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#800000";
    e.target.style.boxShadow = "0 0 0 2px rgba(128,0,0,0.12)";
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#E0E0E0";
    e.target.style.boxShadow = "none";
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center relative px-4 py-12" style={{ backgroundColor: "#f5f5f5" }}>
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${telkomBuildingBg}')`, opacity: 0.2 }} />
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(128, 0, 0, 0.08)" }} />
        <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-10 text-center max-w-sm w-full">
          <CheckCircle2 size={64} className="mx-auto mb-4" style={{ color: "#800000" }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#800000" }}>Password Berhasil Direset!</h2>
          <p className="text-gray-500 text-sm">Anda akan diarahkan ke halaman login...</p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center relative px-4 py-12" style={{ backgroundColor: "#f5f5f5" }}>
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${telkomBuildingBg}')`, opacity: 0.2 }} />
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(128, 0, 0, 0.08)" }} />
        <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-10 text-center max-w-sm w-full">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#800000" }}>Link Tidak Valid</h2>
          <p className="text-gray-500 text-sm mb-6">
            Link reset password sudah kadaluarsa atau tidak valid. Silakan minta link baru.
          </p>
          <button
            onClick={() => navigate("/forgot-password")}
            className="w-full py-3 rounded-xl text-white font-bold transition-all hover:opacity-90"
            style={{ background: GRADIENT }}
          >
            Minta Link Baru
          </button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f5f5f5" }}>
        <div className="text-center">
          <svg className="animate-spin w-10 h-10 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#800000" strokeWidth="4" />
            <path className="opacity-75" fill="#800000" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500 text-sm">Memverifikasi link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 py-12" style={{ backgroundColor: "#f5f5f5" }}>
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${telkomBuildingBg}')`, opacity: 0.2 }} />
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(128, 0, 0, 0.08)" }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-8 pt-7 pb-6 text-center" style={{ background: GRADIENT }}>
            <TelkomLogo size={56} withBg className="mx-auto mb-3" />
            <h1 className="text-xl font-extrabold text-white">Telkom Fallout System</h1>
          </div>

          <div className="px-8 py-6">
            <h2 className="text-2xl font-extrabold mb-1" style={{ color: "#800000" }}>Reset Password</h2>
            <p className="text-gray-400 text-sm mb-5">Masukkan password baru kamu di bawah ini.</p>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-lg text-sm font-medium"
                style={{ backgroundColor: "#FFF0F0", color: "#800000", border: "1px solid #FFCCCC" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Password Baru</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={17} /></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="w-full pl-10 pr-11 py-3 rounded-xl border text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={inputFocus}
                    onBlur={inputBlur}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Konfirmasi Password Baru</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray.400"><Lock size={17} /></span>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Ulangi password baru"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                    className="w-full pl-10 pr-11 py-3 rounded-xl border text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={inputFocus}
                    onBlur={inputBlur}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
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
                    Menyimpan...
                  </>
                ) : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}