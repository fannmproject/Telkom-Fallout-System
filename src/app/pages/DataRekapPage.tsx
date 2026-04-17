import React, { useState } from "react";
import { Search, Filter, Download, FileText, FileSpreadsheet, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { FALLOUT_DATA, FalloutRecord } from "../data/falloutData";

const GRADIENT = "linear-gradient(to right, #360000, #800000)";
const PAGE_SIZE = 10;

// ─── Download Helpers ──────────────────────────────────────────────────────────
function downloadCSV(data: FalloutRecord[]) {
  const headers = ["No/Order ID", "Deskripsi", "STO", "Tgl Fallout", "PIC", "RESOLVED/ESKALASI", "Status", "KET"];
  const rows = data.map((r) => [r.id, r.deskripsi, r.sto, r.tanggal, r.pic, r.resolvedEskalasi, r.status, r.ket]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "rekap-fallout-10-maret-2026.csv"; a.click();
  URL.revokeObjectURL(url);
}

function downloadExcel(data: FalloutRecord[]) {
  const headers = ["No/Order ID", "Deskripsi", "STO", "Tgl Fallout", "PIC", "RESOLVED/ESKALASI", "Status", "KET"];
  const rows = data.map((r) => [r.id, r.deskripsi, r.sto, r.tanggal, r.pic, r.resolvedEskalasi, r.status, r.ket]);
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head><meta charset="UTF-8"><title>Rekap Fallout</title></head><body>
    <table border="1"><thead><tr>${headers.map((h) => `<th style="background:#800000;color:white;font-weight:bold;">${h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "rekap-fallout-10-maret-2026.xls"; a.click();
  URL.revokeObjectURL(url);
}

function downloadPDF(data: FalloutRecord[]) {
  const headers = ["No/Order ID", "Deskripsi", "STO", "Tgl Fallout", "PIC", "RESOLVED/ESKALASI", "Status", "KET"];
  const rows = data.map((r) => [r.id, r.deskripsi, r.sto, r.tanggal, r.pic, r.resolvedEskalasi, r.status, r.ket]);
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Rekap Fallout – 10 Maret 2026</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #222; font-size: 11px; }
      h2 { color: #800000; } p { color: #666; margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #800000; color: white; padding: 7px 8px; text-align: left; font-size: 10px; }
      td { padding: 6px 8px; border-bottom: 1px solid #eee; word-break: break-all; max-width: 200px; }
      tr:nth-child(even) td { background: #fff5f5; }
    </style></head><body>
    <h2>Rekap Data Fallout – 10 Maret 2026</h2>
    <p>Total ${data.length} data · PIC: FACHRI · Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</p>
    <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 400); }
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function DataRekapPage() {
  const [search, setSearch] = useState("");
  const [stoFilter, setStoFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [page, setPage] = useState(1);
  const [selectedDetail, setSelectedDetail] = useState<FalloutRecord | null>(null);

  const stoList = ["Semua", ...Array.from(new Set(FALLOUT_DATA.map((r) => r.sto)))];

  const filtered = FALLOUT_DATA.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch =
      d.id.toLowerCase().includes(q) ||
      d.sto.toLowerCase().includes(q) ||
      d.pic.toLowerCase().includes(q) ||
      d.deskripsi.toLowerCase().includes(q) ||
      d.ket.toLowerCase().includes(q);
    const matchSto = stoFilter === "Semua" || d.sto === stoFilter;
    const matchStatus = statusFilter === "Semua" || d.resolvedEskalasi === statusFilter;
    return matchSearch && matchSto && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: "#800000" }}>Data Rekap Fallout</h1>
        <p className="text-gray-500 text-sm">Data lengkap rekap fallout — 10 Maret 2026</p>
      </div>

      {/* Download Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => downloadCSV(filtered)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
          style={{ background: GRADIENT }}
        >
          <FileText size={16} />
          Download CSV
        </button>
        <button
          onClick={() => downloadExcel(filtered)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
          style={{ background: GRADIENT }}
        >
          <FileSpreadsheet size={16} />
          Download Excel
        </button>
        <button
          onClick={() => downloadPDF(filtered)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
          style={{ background: GRADIENT }}
        >
          <Download size={16} />
          Download PDF
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari ID, STO, PIC, deskripsi..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
              style={{ borderColor: "#E0E0E0" }}
              onFocus={(e) => { e.target.style.borderColor = "#800000"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E0E0E0"; }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400 flex-shrink-0" />
            <select
              value={stoFilter}
              onChange={(e) => { setStoFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: "#E0E0E0" }}
            >
              {stoList.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: "#E0E0E0" }}
            >
              <option>Semua</option>
              <option>RESOLVED</option>
              <option>ESKALASI</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">{filtered.length} data ditemukan</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: GRADIENT }}>
                {["No/Order ID", "Deskripsi", "STO", "Tgl Fallout", "PIC", "Resolved/Eskalasi", "Status", "Detail"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-left text-white text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((row, i) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-50 hover:bg-red-50 transition-colors"
                  style={{ backgroundColor: i % 2 === 0 ? "white" : "#FFFAFA" }}
                >
                  <td className="px-4 py-3 font-bold text-xs max-w-[160px] break-all" style={{ color: "#800000" }}>{row.id}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[240px]">
                    <span className="line-clamp-2 text-xs leading-relaxed">{row.deskripsi}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-md text-xs font-bold bg-red-50" style={{ color: "#800000" }}>{row.sto}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{row.tanggal}</td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap text-xs font-semibold">{row.pic}</td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={
                        row.resolvedEskalasi === "RESOLVED"
                          ? { backgroundColor: "#F0FFF4", color: "#166534" }
                          : { backgroundColor: "#FFF7ED", color: "#9A3412" }
                      }
                    >
                      {row.resolvedEskalasi}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs max-w-[160px]">
                    <span className="line-clamp-2">{row.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedDetail(row)}
                      className="p-1.5 rounded-lg hover:bg-red-100 transition-all"
                      style={{ color: "#800000" }}
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Menampilkan {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} data
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg disabled:opacity-30 hover:bg-gray-100 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-8 h-8 rounded-lg text-sm font-semibold transition-all"
                  style={page === p ? { background: GRADIENT, color: "white" } : { color: "#666" }}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg disabled:opacity-30 hover:bg-gray-100 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div
              className="px-6 py-4 flex items-center justify-between rounded-t-2xl sticky top-0"
              style={{ background: GRADIENT }}
            >
              <h3 className="font-bold text-white text-sm">Detail Fallout</h3>
              <button onClick={() => setSelectedDetail(null)} className="text-white/70 hover:text-white text-xl leading-none">✕</button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {[
                ["No/Order ID", selectedDetail.id],
                ["STO", selectedDetail.sto],
                ["Tanggal Fallout", selectedDetail.tanggal],
                ["PIC", selectedDetail.pic],
                ["RESOLVED/ESKALASI", selectedDetail.resolvedEskalasi],
                ["Status", selectedDetail.status],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-4 border-b border-gray-50 pb-2">
                  <span className="text-sm text-gray-400 w-44 flex-shrink-0">{k}</span>
                  <span className="text-sm font-semibold text-gray-800 text-right">{v}</span>
                </div>
              ))}
              <div className="pt-1">
                <p className="text-xs text-gray-400 mb-1">Deskripsi</p>
                <p className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed break-all">{selectedDetail.deskripsi}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Keterangan (KET)</p>
                <p className="text-xs text-gray-700 bg-red-50 rounded-lg p-3 leading-relaxed break-all" style={{ color: "#800000" }}>{selectedDetail.ket}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-5 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90"
                style={{ background: GRADIENT }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
