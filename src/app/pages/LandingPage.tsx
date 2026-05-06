import React from "react";
import { useNavigate } from "react-router";
import { TelkomLogo } from "../components/TelkomLogo";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, LogIn, UserPlus, BarChart2 } from "lucide-react";
import telkomBuildingBg from "../../assets/telkom-building.png";

const GRADIENT = "linear-gradient(to right, #360000, #800000)";

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: "#fff" }}>
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-3.5 shadow-lg"
        style={{ background: GRADIENT }}
      >
        <div className="flex items-center gap-3">
          <TelkomLogo size={42} withBg />
          <div>
            <span className="text-white font-extrabold text-lg tracking-wide leading-tight block">
              Telkom Fallout System
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all hover"
              style={{ backgroundColor: "white", color: "#800000" }}
            >
              <LayoutDashboard size={15} />
              Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white border border-white/40 hover:bg-white/15 transition-all text-sm font-semibold"
              >
                <LogIn size={15} />
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all hover"
                style={{ backgroundColor: "white", color: "#800000" }}
              >
                <UserPlus size={15} />
                Register
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <div
       className="relative flex flex-col items-center justify-center h-screen pt-16 pb-24"
        style={{ backgroundColor: "#fff" }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${telkomBuildingBg}')`, opacity: 0.2 }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(128,0,0,0.04)" }} />

        <div className="relative z-10 flex flex-col items-center text-center px-6 py-16 max-w-3xl mx-auto">
         <TelkomLogo size={100} className="mb-4 drop-shadow-lg" />

          <h1
            className="text-5xl md:text-6xl font-extrabold mb-2 leading-tight"
            style={{ color: "#800000" }}
          >
            Rekap Data Fallout –
          </h1>

          <h2
            className="text-2xl md:text-3xl font-semibold mb-6 tracking-wide"
            style={{ color: "#4a0000" }}
           >
              Jakarta Selatan
         </h2>

          <button
            onClick={() => navigate("/rekap-fallout")}
            className="flex items-center gap-3 px-10 py-4 rounded-xl text-white text-lg font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 mt-4 mb-8"
            style={{ background: GRADIENT }}
            >
            <BarChart2 size={22} />
            Lihat Data Rekap Fallout
          </button>
        </div>
      </div>
    </div>
  );
}
