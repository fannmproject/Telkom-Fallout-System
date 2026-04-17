import React, { useState } from "react";
import { useNavigate } from "react-router";
import { TelkomLogo } from "../components/TelkomLogo";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Lock, User, Mail, IdCard, ArrowLeft, CheckCircle2 } from "lucide-react";
import telkomBuildingBg from "../../assets/telkom-building.png";

const GRADIENT = "linear-gradient(to right, #360000, #800000)";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    email: "",
    namaLengkap: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
    const result = await register(form.email, form.namaLengkap, form.username, form.password);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f5f5f5" }}>
        <div className="bg-white rounded-3xl shadow-2xl p-10 text-center max-w-sm w-full">
          <CheckCircle2 size={64} className="mx-auto mb-4" style={{ color: "#800000" }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#800000" }}>Registrasi Berhasil!</h2>
          <p className="text-gray-500 text-sm">Anda akan diarahkan ke halaman login...</p>
        </div>
      </div>
    );
  }

  const inputStyle = { borderColor: "#E0E0E0", backgroundColor: "#FAFAFA" };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#800000";
    e.target.style.boxShadow = "0 0 0 2px rgba(128,0,0,0.12)";
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#E0E0E0";
    e.target.style.boxShadow = "none";
  };

  return (
    <div className="min-h-screen flex relative py-8" style={{ backgroundColor: "#f5f5f5" }}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${telkomBuildingBg}')`, opacity: 0.2 }}
      />
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(128, 0, 0, 0.08)" }} />

      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
        style={{ color: "#800000" }}
      >
      </button>

      <div className="relative z-10 m-auto w-full max-w-md px-4">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-7 text-center" style={{ background: GRADIENT }}>
            <TelkomLogo size={56} withBg className="mx-auto mb-3" />
            <h1 className="text-xl font-extrabold text-white">Telkom Fallout System</h1>
            <p className="text-red-200 text-xs mt-1">Daftar Akun Baru</p>
          </div>

          {/* Form */}
          <div className="px-8 py-7">
            <h2 className="text-2xl font-extrabold mb-1" style={{ color: "#800000" }}>Buat Akun</h2>
            <p className="text-gray-400 text-sm mb-6">Isi data berikut untuk mendaftar</p>

            {error && (
              <div
                className="mb-5 px-4 py-3 rounded-lg text-sm font-medium"
                style={{ backgroundColor: "#FFF0F0", color: "#800000", border: "1px solid #FFCCCC" }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Email</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Mail size={17} /></span>
                  <input
                    type="email"
                    placeholder="Masukkan email Anda"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={inputFocus}
                    onBlur={inputBlur}
                  />
                </div>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Nama Lengkap</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><IdCard size={17} /></span>
                  <input
                    type="text"
                    placeholder="Nama lengkap"
                    value={form.namaLengkap}
                    onChange={(e) => setForm({ ...form, namaLengkap: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={inputFocus}
                    onBlur={inputBlur}
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Username</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><User size={17} /></span>
                  <input
                    type="text"
                    placeholder="Masukkan Username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={inputFocus}
                    onBlur={inputBlur}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Password</label>
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
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Confirm Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={17} /></span>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Ulangi password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                    className="w-full pl-10 pr-11 py-3 rounded-xl border text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={inputFocus}
                    onBlur={inputBlur}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-bold text-base transition-all hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
                style={{ background: GRADIENT }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Mendaftarkan...
                  </>
                ) : "Sign Up"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-5">
              Sudah punya akun?{" "}
              <button onClick={() => navigate("/login")} className="font-bold hover:underline" style={{ color: "#800000" }}>
                Login di sini
              </button>
            </p>
            <div className="text-center mt-2">
              <button onClick={() => navigate("/")} className="text-sm text-gray-400 hover:text-gray-600 hover:underline">
                ← Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}