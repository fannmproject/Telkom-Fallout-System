import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { TelkomLogo } from "../components/TelkomLogo";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import telkomBuildingBg from "../../assets/telkom-building.png";

const GRADIENT = "linear-gradient(to right, #360000, #800000)";
const REMEMBER_KEY = "telkom_remembered_email";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load email yang tersimpan saat komponen pertama kali muncul
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_KEY);
    if (savedEmail) {
      setForm((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simpan atau hapus email berdasarkan checkbox
    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, form.email);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    const result = await login(form.email, form.password);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 py-12" style={{ backgroundColor: "#f5f5f5" }}>
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${telkomBuildingBg}')`, opacity: 0.2 }}
      />
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(128, 0, 0, 0.08)" }} />

      {/* Form Card */}
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
              Welcome!
            </h2>
            <p className="text-gray-400 text-sm mb-5">Silakan login untuk melanjutkan</p>

            {error && (
              <div
                className="mb-5 px-4 py-3 rounded-lg text-sm font-medium"
                style={{ backgroundColor: "#FFF0F0", color: "#800000", border: "1px solid #FFCCCC" }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Email</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail size={17} />
                  </span>
                  <input
                    type="email"
                    placeholder="Masukkan email Anda"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all"
                    style={{ borderColor: "#E0E0E0", backgroundColor: "#FAFAFA" }}
                    onFocus={(e) => { e.target.style.borderColor = "#800000"; e.target.style.boxShadow = "0 0 0 2px rgba(128,0,0,0.12)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#E0E0E0"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock size={17} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="w-full pl-10 pr-11 py-3 rounded-xl border text-sm outline-none transition-all"
                    style={{ borderColor: "#E0E0E0", backgroundColor: "#FAFAFA" }}
                    onFocus={(e) => { e.target.style.borderColor = "#800000"; e.target.style.boxShadow = "0 0 0 2px rgba(128,0,0,0.12)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#E0E0E0"; e.target.style.boxShadow = "none"; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Remember Me + Forgot Password */}
              <div className="flex items-center justify-between">
                {/* Remember Me Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
                      style={{
                        borderColor: rememberMe ? "#800000" : "#D1D5DB",
                        backgroundColor: rememberMe ? "#800000" : "white",
                      }}
                    >
                      {rememberMe && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">Remember Me</span>
                </label>

                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm font-semibold hover:underline"
                  style={{ color: "#800000" }}
                >
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
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
                    Memproses...
                  </>
                ) : "Login"}
              </button>
            </form>

            {/* Register Link */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Belum punya akun?{" "}
              <Link to="/register" className="font-bold hover:underline" style={{ color: "#800000" }}>
                Register
              </Link>
            </p>

            <div className="text-center mt-3">
              <button
                onClick={() => navigate("/")}
                className="text-sm text-gray-400 hover:text-gray-600 hover:underline transition-all"
              >
                ← Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}