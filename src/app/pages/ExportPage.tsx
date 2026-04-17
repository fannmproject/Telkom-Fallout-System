import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Download, Filter, Calendar, FileSpreadsheet, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface FalloutRow {
  id: string;
  deskripsi: string;
  sto: string;
  tanggal: string;
  pic: string;
  resolved_eskalasi: string;
  status: string;
  ket: string;
}

type PresetType = "harian" | "mingguan" | "bulanan" | "tahunan" | "custom";

const GRADIENT = "linear-gradient(to right, #360000, #800000)";

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const parseIndonesianDate = (tanggal: string): string | null => {
  const months: Record<string, string> = {
    "Januari": "01", "Februari": "02", "Maret": "03", "April": "04",
    "Mei": "05", "Juni": "06", "Juli": "07", "Agustus": "08",
    "September": "09", "Oktober": "10", "November": "11", "Desember": "12"
  };
  const parts = tanggal?.split(" ");
  if (parts?.length === 3) {
    const day = parts[0].padStart(2, "0");
    const month = months[parts[1]];
    const year = parts[2];
    if (month) return `${year}-${month}-${day}`;
  }
  return null;
};

const toYMD = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function ExportPage() {
  const [data, setData] = useState<FalloutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [tahunList, setTahunList] = useState<number[]>([]);

  const [preset, setPreset] = useState<PresetType>("bulanan");
  const [hariTanggal, setHariTanggal] = useState(toYMD(new Date()));
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [customDari, setCustomDari] = useState(toYMD(new Date()));
  const [customSampai, setCustomSampai] = useState(toYMD(new Date()));

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from("fallout_data").select("*").order("uploaded_at", { ascending: true });
    if (!error && rows) {
      setData(rows);
      const tahuns = [...new Set(rows.map(r => {
        const ymd = parseIndonesianDate(r.tanggal);
        return ymd ? parseInt(ymd.split("-")[0]) : null;
      }).filter(Boolean))] as number[];
      if (!tahuns.includes(new Date().getFullYear())) tahuns.push(new Date().getFullYear());
      setTahunList(tahuns.sort((a, b) => b - a));
    }
    setLoading(false);
  };

  const getDateRange = () => {
    if (preset === "harian") {
      return { dari: hariTanggal, sampai: hariTanggal, label: hariTanggal, filename: `harian-${hariTanggal}` };
    }
    if (preset === "mingguan") {
      const startDay = (selectedWeek - 1) * 7 + 1;
      const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      let endDay = selectedWeek * 7;
      if (selectedWeek === 5 || endDay > lastDayOfMonth) endDay = lastDayOfMonth;
      const dari = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`;
      const sampai = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
      return { dari, sampai, label: `Minggu ${selectedWeek} (${MONTHS_ID[selectedMonth]} ${selectedYear})`, filename: `mingguan-W${selectedWeek}-${MONTHS_ID[selectedMonth]}-${selectedYear}` };
    }
    if (preset === "bulanan") {
      const dari = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`;
      const sampai = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${new Date(selectedYear, selectedMonth + 1, 0).getDate()}`;
      return { dari, sampai, label: `${MONTHS_ID[selectedMonth]} ${selectedYear}`, filename: `bulanan-${MONTHS_ID[selectedMonth]}-${selectedYear}` };
    }
    if (preset === "tahunan") {
      return { dari: `${selectedYear}-01-01`, sampai: `${selectedYear}-12-31`, label: `Tahun ${selectedYear}`, filename: `tahunan-${selectedYear}` };
    }
    return { dari: customDari, sampai: customSampai, label: `${customDari} sd ${customSampai}`, filename: `custom` };
  };

  const { dari, sampai, label: periodLabel, filename: periodFilename } = getDateRange();
  
  const filtered = data.filter(r => {
    const d = parseIndonesianDate(r.tanggal);
    return d && d >= dari && d <= sampai;
  });

  const generateCSV = () => {
    const headers = ["No/Order ID", "Deskripsi", "STO", "Tgl Fallout", "PIC", "RESOLVED/ESKALASI", "Status", "KET"];
    const rows = filtered.map(r => [r.id, r.deskripsi, r.sto, r.tanggal, r.pic, r.resolved_eskalasi, r.status, r.ket]);
    return "\uFEFF" + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  };

  const generateExcel = () => {
    const headers = [["No", "No/Order ID", "Deskripsi", "STO", "Tgl Fallout", "PIC", "RESOLVED/ESKALASI", "Status", "KET"]];
    const rows = filtered.map((r, i) => [i + 1, r.id, r.deskripsi, r.sto, r.tanggal, r.pic, r.resolved_eskalasi, r.status, r.ket]);
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap");
    return XLSX.write(wb, { bookType: "xlsx", type: "array" });
  };

  const generatePDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const now = new Date();
    const exportTimestamp = now.toLocaleDateString("id-ID", { 
      day: "2-digit", 
      month: "long", 
      year: "numeric" 
    });

    // Header Merah Telkom
    doc.setFillColor(54, 0, 0);
    doc.rect(0, 0, 297, 40, "F");
    doc.setTextColor(255, 255, 255);
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("PT Telekomunikasi Indonesia", 148, 12, { align: "center" });
    
    doc.setFontSize(12);
    doc.text("REKAP DATA FALLOUT SISTEM", 148, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.text("Wilayah STO Jakarta Selatan", 148, 27, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Periode Data: ${periodLabel}  |  Total: ${filtered.length} baris`, 14, 35);
    doc.text(`Dicetak pada: ${exportTimestamp}`, 283, 35, { align: "right" });

    autoTable(doc, {
      startY: 45,
      head: [["No", "No/Order ID", "Deskripsi", "STO", "Tgl Fallout", "PIC", "Status Eskalasi", "Status", "KET"]],
      body: filtered.map((r, i) => [i + 1, r.id, r.deskripsi, r.sto, r.tanggal, r.pic, r.resolved_eskalasi, r.status, r.ket]),
      styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [128, 0, 0], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 35 },
        2: { cellWidth: 70 },
        3: { cellWidth: 15 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 },
        7: { cellWidth: 25 },
      }
    });
    return doc.output("blob");
  };

  const handleDownload = async () => {
    if (filtered.length === 0) return;
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: `rekap-fallout-${periodFilename}.xlsx`,
        types: [
          { description: "Excel Spreadsheet", accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] } },
          { description: "CSV (Comma Separated Values)", accept: { "text/csv": [".csv"] } },
          { description: "PDF Document", accept: { "application/pdf": [".pdf"] } },
        ],
      });

      setDownloading(true);
      const writable = await handle.createWritable();
      const ext = handle.name.split('.').pop().toLowerCase();

      let content;
      if (ext === "xlsx") content = generateExcel();
      else if (ext === "csv") content = generateCSV();
      else if (ext === "pdf") content = generatePDF();

      await writable.write(content);
      await writable.close();
      setDownloading(false);
    } catch (err) { 
      console.error(err); 
      setDownloading(false); 
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: "#800000" }}>Export Data</h1>
        <p className="text-gray-500 text-sm">Gunakan filter untuk menentukan cakupan data yang akan di-download.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        {/* Tab Pilihan Periode */}
        <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
          {["harian", "mingguan", "bulanan", "tahunan", "custom"].map((p) => (
            <button key={p} onClick={() => setPreset(p as PresetType)} className="px-5 py-2 rounded-xl text-sm font-bold transition-all"
              style={preset === p ? { background: GRADIENT, color: "white" } : { backgroundColor: "#F5F5F5", color: "#666" }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Input Filter Dinamis */}
        <div className="bg-gray-50 p-5 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-3 gap-6 border border-gray-100">
          {preset === "harian" && (
            <div className="flex flex-col">
              <label className="text-xs font-bold mb-1 text-gray-500">Pilih Tanggal</label>
              <input type="date" value={hariTanggal} onChange={(e) => setHariTanggal(e.target.value)} className="p-2.5 rounded-lg border w-full outline-none focus:ring-2 focus:ring-red-100" />
            </div>
          )}
          
          {preset === "mingguan" && (
            <>
              <div className="flex flex-col">
                <label className="text-xs font-bold mb-1 text-gray-500">Minggu Ke</label>
                <select value={selectedWeek} onChange={(e) => setSelectedWeek(Number(e.target.value))} className="p-2.5 rounded-lg border outline-none">
                  {[1, 2, 3, 4, 5].map(w => <option key={w} value={w}>Minggu ke-{w}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold mb-1 text-gray-500">Bulan</label>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="p-2.5 rounded-lg border outline-none">
                  {MONTHS_ID.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold mb-1 text-gray-500">Tahun</label>
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="p-2.5 rounded-lg border outline-none">
                  {tahunList.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </>
          )}

          {preset === "bulanan" && (
            <>
              <div className="flex flex-col">
                <label className="text-xs font-bold mb-1 text-gray-500">Bulan</label>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="p-2.5 rounded-lg border outline-none">
                  {MONTHS_ID.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold mb-1 text-gray-500">Tahun</label>
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="p-2.5 rounded-lg border outline-none">
                  {tahunList.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </>
          )}

          {preset === "tahunan" && (
            <div className="flex flex-col">
              <label className="text-xs font-bold mb-1 text-gray-500">Tahun</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="p-2.5 rounded-lg border outline-none w-full">
                {tahunList.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          {preset === "custom" && (
            <>
              <div className="flex flex-col">
                <label className="text-xs font-bold mb-1 text-gray-500">Dari Tanggal</label>
                <input type="date" value={customDari} onChange={(e) => setCustomDari(e.target.value)} className="p-2.5 rounded-lg border w-full outline-none" />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold mb-1 text-gray-500">Sampai Tanggal</label>
                <input type="date" value={customSampai} onChange={(e) => setCustomSampai(e.target.value)} className="p-2.5 rounded-lg border w-full outline-none" />
              </div>
            </>
          )}
        </div>

        {/* Info Box */}
        <div className="mb-6 flex items-center justify-between px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: "#FFF5F5", border: "1px solid #FFCCCC" }}>
          <div className="flex items-center gap-2">
            <Calendar size={16} style={{ color: "#800000" }} />
            <span className="font-semibold" style={{ color: "#800000" }}>Siap Export:</span>
            <span className="text-gray-700 font-medium">{periodLabel}</span>
          </div>
          <span className="font-bold text-gray-600">{filtered.length} baris data ditemukan</span>
        </div>

        {/* Tombol Download Tunggal */}
        <button 
          onClick={handleDownload} 
          disabled={downloading || filtered.length === 0} 
          className="w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-all disabled:opacity-50" 
          style={{ background: GRADIENT }}
        >
          {downloading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <><Download size={18} /> Download Data</>
          )}
        </button>
      </div>

      {/* Tabel Preview Data (Max 10) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">Preview Data (Max 10 Baris)</p>
          <span className="text-xs text-gray-500 font-medium">Data yang akan diexport: {filtered.length}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#800000" strokeWidth="4" />
              <path className="opacity-75" fill="#800000" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="font-medium">Tidak ada data untuk periode ini</p>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10">
                <tr style={{ backgroundColor: "#800000" }}>
                  <th className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap">No</th>
                  <th className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap">No/Order ID</th>
                  <th className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap">Deskripsi</th>
                  <th className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap">STO</th>
                  <th className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap">Tgl Fallout</th>
                  <th className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap">PIC</th>
                  <th className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap">RESOLVED/ESKALASI</th>
                  <th className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap">Status</th>
                  <th className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap">KET</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 10).map((row, i) => (
                  <tr key={row.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#FFF5F5" }}>
                    <td className="px-3 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-2.5 text-gray-700 font-medium whitespace-nowrap" style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis" }}>{row.id}</td>
                    <td className="px-3 py-2.5 text-gray-600" style={{ maxWidth: "250px" }}>
                      <div className="truncate" title={row.deskripsi}>{row.deskripsi}</div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{row.sto}</td>
                    <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{row.tanggal}</td>
                    <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{row.pic}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: row.resolved_eskalasi === "RESOLVED" ? "#F0FFF4" : "#FFF0F0",
                          color: row.resolved_eskalasi === "RESOLVED" ? "#166534" : "#800000",
                        }}>
                        {row.resolved_eskalasi}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: row.status === "COMPLETED" ? "#F0FFF4" : "#FFF9E6",
                          color: row.status === "COMPLETED" ? "#166534" : "#92400E",
                        }}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{row.ket}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 10 && (
              <div className="px-4 py-3 text-center text-xs text-gray-400 border-t border-gray-50">
                ...dan {filtered.length - 10} data lainnya akan ikut ter-download
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}