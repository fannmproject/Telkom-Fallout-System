import React from "react";
import { useNavigate } from "react-router";
import { TelkomLogo } from "../components/TelkomLogo";
import telkomLogoSrc from "../../assets/telkom-logo.png";
import { useAuth } from "../context/AuthContext";
import { FileText, FileSpreadsheet, Download, LayoutDashboard, LogIn, UserPlus, BarChart2 } from "lucide-react";
import telkomBuildingBg from "../../assets/telkom-building.png";
import { FALLOUT_DATA } from "../data/falloutData";

const GRADIENT = "linear-gradient(to right, #360000, #800000)";

// ─── Download helpers ─────────────────────────────────────────────────────────
function downloadCSV() {
  const headers = ["No/Order ID", "Deskripsi", "STO", "Tgl Fallout", "PIC", "RESOLVED/ESKALASI", "Status", "KET"];
  const rows = FALLOUT_DATA.map((r) => [r.id, r.deskripsi, r.sto, r.tanggal, r.pic, r.resolvedEskalasi, r.status, r.ket]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "rekap-fallout-10-maret-2026.csv"; a.click();
  URL.revokeObjectURL(url);
}

function downloadExcel() {
  const headers = ["No/Order ID", "Deskripsi", "STO", "Tgl Fallout", "PIC", "RESOLVED/ESKALASI", "Status", "KET"];
  const rows = FALLOUT_DATA.map((r) => [r.id, r.deskripsi, r.sto, r.tanggal, r.pic, r.resolvedEskalasi, r.status, r.ket]);
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head><meta charset="UTF-8"><title>Rekap Fallout</title></head><body>
    <table border="1"><thead><tr>${headers.map((h) => `<th style="background:#800000;color:white;font-weight:bold;">${h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "rekap-fallout-10-maret-2026.xls"; a.click();
  URL.revokeObjectURL(url);
}

function downloadPDF() {
  const headers = ["No/Order ID", "Deskripsi", "STO", "Tgl Fallout", "PIC", "RESOLVED/ESKALASI", "Status", "KET"];
  const rows = FALLOUT_DATA.map((r) => [r.id, r.deskripsi, r.sto, r.tanggal, r.pic, r.resolvedEskalasi, r.status, r.ket]);
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Rekap Fallout – 10 Maret 2026</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #222; font-size: 11px; }
      h2 { color: #800000; margin-bottom: 4px; }
      p { color: #666; font-size: 11px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 10px; }
      th { background: #800000; color: white; padding: 6px 8px; text-align: left; }
      td { padding: 5px 8px; border-bottom: 1px solid #eee; word-break: break-all; }
      tr:nth-child(even) td { background: #fff5f5; }
    </style></head><body>
    <h2>Rekap Data Fallout – 10 Maret 2026</h2>
    <p>Total ${FALLOUT_DATA.length} data · PIC: FACHRI · Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</p>
    <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 400); }
}

// ─── Component ────────────────────────────────────────────────────────────────
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

              <div className="flex flex-wrap items-center justify-center gap-5 mt-2">
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold border-2 hover:text-white transition-all duration-200 text-sm"
              style={{ borderColor: "#800000", color: "#800000", backgroundColor: "white" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = GRADIENT; (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
             onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "white"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#800000"; (e.currentTarget as HTMLButtonElement).style.color = "#800000"; }} 
             >
                      
              <FileText size={18} />
              Download CSV
            </button>

            <button
              onClick={downloadExcel}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold border-2 transition-all duration-200 text-sm"
              style={{ borderColor: "#800000", color: "#800000", backgroundColor: "white" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = GRADIENT; (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "white"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#800000"; (e.currentTarget as HTMLButtonElement).style.color = "#800000"; }}
            >
              <FileSpreadsheet size={18} />
              Download Excel
            </button>
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold border-2 transition-all duration-200 text-sm"
              style={{ borderColor: "#800000", color: "#800000", backgroundColor: "white" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = GRADIENT; (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "white"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#800000"; (e.currentTarget as HTMLButtonElement).style.color = "#800000"; }}
            >
              <Download size={18} />
              Download PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}