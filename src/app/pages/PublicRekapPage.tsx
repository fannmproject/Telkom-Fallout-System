import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { TelkomLogo } from "../components/TelkomLogo";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  Eye, FileText, Download, X,
  ChevronLeft, ChevronRight, BarChart2, LayoutDashboard, LogIn, Filter, Calendar
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

interface FalloutRecord {
  id: string;
  deskripsi: string;
  sto: string;
  tanggal: string;
  pic: string;
  resolved_eskalasi: string;
  status: string;
  ket: string;
  uploaded_at?: string;
}

const PAGE_SIZE = 25;
const GRADIENT = "linear-gradient(to right, #360000, #800000)";

const MONTHS_ID = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

const parseIndonesianDate = (tanggal: string): string | null => {
  const months: Record<string,string> = {
    Januari:"01",Februari:"02",Maret:"03",April:"04",
    Mei:"05",Juni:"06",Juli:"07",Agustus:"08",
    September:"09",Oktober:"10",November:"11",Desember:"12",
  };
  const parts = tanggal?.split(" ");
  if (parts?.length === 3) {
    const day = parts[0].padStart(2,"0");
    const month = months[parts[1]];
    const year = parts[2];
    if (month) return `${year}-${month}-${day}`;
  }
  return null;
};

const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

export default function PublicRekapPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Data State
  const [allData, setAllData] = useState<FalloutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Page Filter State
  const [stoFilter, setStoFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [page, setPage] = useState(1);
  const [latestTanggalYMD, setLatestTanggalYMD] = useState("");
  
  // Tab & Modal State
  const [activeTab, setActiveTab] = useState<"tabel" | "grafik">("tabel");
  const [selectedDetail, setSelectedDetail] = useState<FalloutRecord | null>(null);
  const [fullId, setFullId] = useState<string | null>(null);
  const [tahunList, setTahunList] = useState<number[]>([]);

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState<"bulan" | "tahun">("bulan");
  const [exportMonth, setExportMonth] = useState<number>(new Date().getMonth());
  const [exportYear, setExportYear] = useState<number>(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fallout_data")
      .select("*")
      .order("uploaded_at", { ascending: false });
    if (!error && data) {
      setAllData(data);

      const ymdList = data.map((r) => parseIndonesianDate(r.tanggal)).filter(Boolean) as string[];
      if (ymdList.length > 0) {
        const latest = ymdList.reduce((a, b) => (a > b ? a : b));
        setLatestTanggalYMD(latest);
        setFilterTanggal(latest);
      }

      const tahuns = [...new Set(data.map((r) => {
        const ymd = parseIndonesianDate(r.tanggal);
        return ymd ? parseInt(ymd.split("-")[0]) : null;
      }).filter(Boolean))] as number[];
      if (!tahuns.includes(new Date().getFullYear())) tahuns.push(new Date().getFullYear());
      setTahunList(tahuns.sort((a,b) => b - a));
    }
    setLoading(false);
  };

  // ── FILTER HALAMAN ─────────────────────────────────────────────
  const filtered = allData.filter((d) => {
    const matchTanggal = !filterTanggal || parseIndonesianDate(d.tanggal) === filterTanggal;
    const matchSto = stoFilter === "Semua" || d.sto === stoFilter;
    const matchStatus = statusFilter === "Semua" || d.resolved_eskalasi === statusFilter;
    return matchTanggal && matchSto && matchStatus;
  });

  const tanggalRekap = filtered[0]?.tanggal || allData[0]?.tanggal || "-";
  const picList = [...new Set(filtered.map((r) => r.pic?.trim()).filter(Boolean))].join(", ") || "-";
  const resolved = filtered.filter((r) => r.resolved_eskalasi === "RESOLVED").length;
  const eskalasi = filtered.filter((r) => r.resolved_eskalasi === "ESKALASI").length;
  const completed = filtered.filter((r) => r.status === "COMPLETED").length;
  const processOSS = filtered.filter((r) => r.status !== "COMPLETED").length;

  const stoMap: Record<string,number> = {};
  filtered.forEach((r) => { if (r.sto) stoMap[r.sto] = (stoMap[r.sto]||0)+1; });
  const stoStats = Object.entries(stoMap).map(([sto,fallout]) => ({sto,fallout})).sort((a,b) => b.fallout-a.fallout);
  const stoList = ["Semua",...Object.keys(stoMap).sort()];

  const pieData = [
    {name:"RESOLVED",value:resolved,color:"#800000"},
    {name:"ESKALASI",value:eskalasi,color:"#cc3333"},
  ];
  const statusPieData = [
    {name:"Process OSS",value:processOSS,color:"#800000"},
    {name:"COMPLETED",value:completed,color:"#2d6a4f"},
  ];

  const totalPages = Math.max(1, Math.ceil(filtered.length/PAGE_SIZE));
  const paged = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const isNewData = (row: FalloutRecord) => {
    if (!row.uploaded_at) return false;
    return toYMD(new Date(row.uploaded_at)) === toYMD(new Date());
  };

  // ── LOGIKA EXPORT (MODAL) ──────────────────────────────────────
  const exportData = allData.filter((d) => {
    const dateStr = parseIndonesianDate(d.tanggal);
    if (!dateStr) return false;
    const [y, m] = dateStr.split("-");
    
    if (exportMode === "bulan") {
      return parseInt(y) === exportYear && parseInt(m) === exportMonth + 1;
    } else {
      return parseInt(y) === exportYear;
    }
  });

  const exportPeriodLabel = exportMode === "bulan" ? `${MONTHS_ID[exportMonth]} ${exportYear}` : `Tahun ${exportYear}`;
  const exportFilename = exportMode === "bulan" ? `rekap-fallout-${MONTHS_ID[exportMonth]}-${exportYear}` : `rekap-fallout-tahun-${exportYear}`;

  const generateCSV = (dataToExport: FalloutRecord[]) => {
    const headers = ["No/Order ID","Deskripsi","STO","Tgl Fallout","PIC","RESOLVED/ESKALASI","Status","KET"];
    const rows = dataToExport.map((r) => [r.id, r.deskripsi, r.sto, r.tanggal, r.pic, r.resolved_eskalasi, r.status, r.ket]);
    return "\uFEFF" + [headers, ...rows].map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  };

  const generateExcel = (dataToExport: FalloutRecord[]) => {
    const headers = [["No", "No/Order ID", "Deskripsi", "STO", "Tgl Fallout", "PIC", "RESOLVED/ESKALASI", "Status", "KET"]];
    const rows = dataToExport.map((r, i) => [i + 1, r.id, r.deskripsi, r.sto, r.tanggal, r.pic, r.resolved_eskalasi, r.status, r.ket]);
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap");
    return XLSX.write(wb, { bookType: "xlsx", type: "array" });
  };

  const generatePDF = (dataToExport: FalloutRecord[], periodLabel: string) => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const now = new Date();
    const exportTimestamp = now.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

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
    doc.text(`Periode Data: ${periodLabel}  |  Total: ${dataToExport.length} baris`, 14, 35);
    doc.text(`Dicetak pada: ${exportTimestamp}`, 283, 35, { align: "right" });

    autoTable(doc, {
      startY: 45,
      head: [["No", "No/Order ID", "Deskripsi", "STO", "Tgl Fallout", "PIC", "Status Eskalasi", "Status", "KET"]],
      body: dataToExport.map((r, i) => [i + 1, r.id, r.deskripsi, r.sto, r.tanggal, r.pic, r.resolved_eskalasi, r.status, r.ket]),
      styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [128, 0, 0], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        0: { cellWidth: 8 }, 1: { cellWidth: 35 }, 2: { cellWidth: 70 },
        3: { cellWidth: 15 }, 4: { cellWidth: 25 }, 5: { cellWidth: 25 },
        6: { cellWidth: 25 }, 7: { cellWidth: 25 },
      }
    });
    return doc.output("blob");
  };

  const handleExportDownload = async () => {
    if (exportData.length === 0) return;
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: `${exportFilename}.xlsx`,
        types: [
          { description: "Excel Spreadsheet", accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] } },
          { description: "CSV (Comma Separated Values)", accept: { "text/csv": [".csv"] } },
          { description: "PDF Document", accept: { "application/pdf": [".pdf"] } },
        ],
      });

      setIsExporting(true);
      const writable = await handle.createWritable();
      const ext = handle.name.split('.').pop().toLowerCase();

      let content;
      if (ext === "xlsx") content = generateExcel(exportData);
      else if (ext === "csv") content = generateCSV(exportData);
      else if (ext === "pdf") content = generatePDF(exportData, exportPeriodLabel);

      await writable.write(content);
      await writable.close();
      setIsExporting(false);
      setShowExportModal(false);
    } catch (err) {
      console.error(err);
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:"#f5f5f5"}}>
        <div className="text-center">
          <svg className="animate-spin w-10 h-10 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#800000" strokeWidth="4"/>
            <path className="opacity-75" fill="#800000" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="text-gray-500 text-sm">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-3.5 shadow-lg" style={{background:GRADIENT}}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <TelkomLogo size={38} withBg/>
          <p className="text-white font-extrabold text-sm leading-tight">Telkom Fallout System</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/")}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg text-white border border-white/30 hover:bg-white/10 transition-all text-sm font-medium">
            <LayoutDashboard size={15}/> Beranda
          </button>
          {isAuthenticated ? (
            <button onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all"
              style={{backgroundColor:"white",color:"#800000"}}>
              <LayoutDashboard size={15}/> Dashboard
            </button>
          ) : (
            <button onClick={() => navigate("/login")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all"
              style={{backgroundColor:"white",color:"#800000"}}>
              <LogIn size={15}/> Login
            </button>
          )}
        </div>
      </nav>

      {/* Page Header */}
      <div className="pt-20 pb-6 px-6 md:px-10" style={{background:"linear-gradient(to bottom, rgba(0,0,0,0.04), transparent)"}}>
        <div className="max-w-7xl mx-auto mt-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold" style={{color:"#800000"}}>Data Rekap Fallout</h1>
              <p className="text-gray-500 text-sm mt-1">
                {tanggalRekap} · PIC: {picList} · Data tersedia untuk umum (view &amp; download)
              </p>
            </div>
            
            {/* Tombol Download Tunggal */}
            <div>
              <button 
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                style={{background:GRADIENT}}>
                <Download size={18}/> 
                Download Data
              </button>
            </div>
          </div>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-3 mt-5">
            {[
              {label:"Total Fallout",value:String(filtered.length),color:"#800000"},
              {label:"RESOLVED",value:String(resolved),color:"#166534"},
              {label:"ESKALASI",value:String(eskalasi),color:"#9a3412"},
              {label:"STO Aktif",value:String(Object.keys(stoMap).length),color:"#1e40af"},
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl px-5 py-3 shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="w-2 h-8 rounded-full" style={{backgroundColor:s.color}}/>
                <div>
                  <p className="text-xs text-gray-400">{s.label}</p>
                  <p className="font-extrabold text-lg leading-tight" style={{color:s.color}}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 md:px-10 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Tab switcher */}
          <div className="flex gap-2 mb-5">
            {[
              {key:"tabel",label:"Tabel Data",icon:<FileText size={15}/>},
              {key:"grafik",label:"Grafik",icon:<BarChart2 size={15}/>},
            ].map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key as "tabel"|"grafik")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={activeTab===t.key
                  ? {background:GRADIENT,color:"white",boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}
                  : {backgroundColor:"white",color:"#666",border:"1px solid #E0E0E0"}}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Tabel Tab */}
          {activeTab === "tabel" && (
            <>
              {/* Filter Bar Baru */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-50 p-5 mb-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#800000" }} />
                    <Filter size={18} className="text-gray-700" />
                    <h3 className="font-extrabold text-gray-800 text-base tracking-wide">Filter Tabel</h3>
                  </div>
                  {filterTanggal !== latestTanggalYMD && latestTanggalYMD && (
                    <button onClick={() => {setFilterTanggal(latestTanggalYMD); setPage(1);}}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                      style={{backgroundColor:"#FFF0F0",color:"#800000"}}>
                      Kembali ke data terbaru
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <input 
                      type="date" 
                      value={filterTanggal}
                      onChange={(e) => { setFilterTanggal(e.target.value); setPage(1); }}
                      className="pl-4 pr-3 py-2.5 rounded-2xl border text-sm font-semibold outline-none transition-all"
                      style={{ backgroundColor: "#F9FAFB", borderColor: "#F3F4F6", color: "#4B5563" }}
                      onFocus={(e) => { e.target.style.borderColor = "#800000"; e.target.style.boxShadow = "0 0 0 3px rgba(128,0,0,0.1)"; e.target.style.backgroundColor = "#fff"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#F3F4F6"; e.target.style.boxShadow = "none"; e.target.style.backgroundColor = "#F9FAFB"; }}
                    />
                    <select 
                      value={stoFilter} 
                      onChange={(e) => { setStoFilter(e.target.value); setPage(1); }}
                      className="px-4 py-2.5 rounded-2xl border text-sm font-semibold outline-none appearance-none pr-10 cursor-pointer transition-all"
                      style={{ 
                        backgroundColor: "#F9FAFB", borderColor: "#F3F4F6", color: "#4B5563",
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundPosition: `right 0.8rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.2em 1.2em`
                      }}
                      onFocus={(e) => { e.target.style.borderColor = "#800000"; e.target.style.boxShadow = "0 0 0 3px rgba(128,0,0,0.1)"; e.target.style.backgroundColor = "#fff"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#F3F4F6"; e.target.style.boxShadow = "none"; e.target.style.backgroundColor = "#F9FAFB"; }}
                    >
                      <option value="Semua">Semua STO</option>
                      {stoList.filter(s => s !== "Semua").map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-sm font-bold text-gray-400">Status:</span>
                    <div className="flex flex-wrap gap-2">
                      {["Semua", "RESOLVED", "ESKALASI"].map((s) => (
                        <button
                          key={s}
                          onClick={() => { setStatusFilter(s); setPage(1); }}
                          className="px-5 py-2 rounded-full text-xs font-bold transition-all"
                          style={statusFilter === s ? { background: GRADIENT, color: "white", boxShadow: "0 4px 12px rgba(128,0,0,0.25)" } : { backgroundColor: "#F3F4F6", color: "#6B7280" }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                   <p className="text-xs font-medium text-gray-400">
                     Menampilkan <strong style={{ color: "#800000" }}>{filtered.length}</strong> data sesuai filter
                   </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{background:GRADIENT}}>
                        {["No","No/Order ID","Deskripsi","STO","Tgl Fallout","PIC","Resolved/Eskalasi","Status","Detail"].map((h) => (
                          <th key={h} className="px-4 py-3.5 text-left text-white text-xs font-bold uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((row, i) => {
                        const isNew = isNewData(row);
                        return (
                          <tr key={row.id}
                            className="border-b border-gray-50 hover:bg-red-50 transition-colors"
                            style={{
                              backgroundColor: isNew ? "#FFF0F0" : i%2===0 ? "white" : "#FFFAFA",
                              borderLeft: isNew ? "3px solid #800000" : "3px solid transparent",
                            }}>
                            <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                {(page-1)*PAGE_SIZE+i+1}
                                {isNew && (
                                  <span className="px-1.5 py-0.5 rounded-full text-white font-bold"
                                    style={{fontSize:"9px",backgroundColor:"#800000"}}>BARU</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs">
                              <div className="flex items-center gap-1">
                                <span className="font-bold font-mono"
                                  style={{color:"#800000",maxWidth:"130px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"inline-block"}}>
                                  {row.id}
                                </span>
                                {row.id?.length > 20 && (
                                  <button onClick={() => setFullId(row.id)}
                                    className="flex-shrink-0 p-1 rounded hover:bg-red-100 transition-all"
                                    style={{color:"#800000"}} title="Lihat ID lengkap">
                                    <Eye size={12}/>
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 max-w-[240px]">
                              <span className="text-gray-600 text-xs leading-relaxed line-clamp-2">{row.deskripsi}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 rounded-md text-xs font-bold bg-red-50" style={{color:"#800000"}}>{row.sto}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{row.tanggal}</td>
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap text-xs font-semibold">{row.pic}</td>
                            <td className="px-4 py-3">
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                                style={row.resolved_eskalasi==="RESOLVED" ? {backgroundColor:"#F0FFF4",color:"#166534"} : {backgroundColor:"#FFF7ED",color:"#9A3412"}}>
                                {row.resolved_eskalasi}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-xs max-w-[150px]">
                              <span className="line-clamp-2">{row.status}</span>
                            </td>
                            <td className="px-4 py-3">
                              <button onClick={() => setSelectedDetail(row)}
                                className="p-1.5 rounded-lg hover:bg-red-100 transition-all"
                                style={{color:"#800000"}}>
                                <Eye size={15}/>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    Menampilkan {filtered.length===0?0:(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)} dari {filtered.length} data
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage((p) => Math.max(1,p-1))} disabled={page===1}
                      className="p-2 rounded-lg disabled:opacity-30 hover:bg-gray-100 transition-all">
                      <ChevronLeft size={16}/>
                    </button>
                    {Array.from({length:Math.min(5,totalPages)},(_,i) => {
                      const p = Math.max(1,Math.min(page-2,totalPages-4))+i;
                      return (
                        <button key={p} onClick={() => setPage(p)}
                          className="w-8 h-8 rounded-lg text-sm font-semibold transition-all"
                          style={page===p?{background:GRADIENT,color:"white"}:{color:"#666"}}>
                          {p}
                        </button>
                      );
                    })}
                    <button onClick={() => setPage((p) => Math.min(totalPages,p+1))} disabled={page===totalPages}
                      className="p-2 rounded-lg disabled:opacity-30 hover:bg-gray-100 transition-all">
                      <ChevronRight size={16}/>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Grafik Tab */}
          {activeTab === "grafik" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="font-bold mb-4" style={{color:"#800000"}}>Fallout per STO</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stoStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0"/>
                      <XAxis type="number" tick={{fontSize:11,fill:"#888"}} allowDecimals={false}/>
                      <YAxis dataKey="sto" type="category" tick={{fontSize:12,fill:"#555",fontWeight:600}} width={50}/>
                      <Tooltip contentStyle={{borderRadius:8,fontSize:12,border:"1px solid #E0E0E0"}}/>
                      <Bar dataKey="fallout" name="Total Fallout" fill="#800000" radius={[0,6,6,0]}
                        label={{position:"right",fontSize:12,fill:"#800000",fontWeight:"bold"}}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="font-bold mb-4" style={{color:"#800000"}}>RESOLVED / ESKALASI</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} dataKey="value">
                        {pieData.map((entry) => <Cell key={entry.name} fill={entry.color}/>)}
                      </Pie>
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:12}}/>
                      <Tooltip formatter={(v) => [v,""]} contentStyle={{borderRadius:8,fontSize:12}}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-2">
                    {pieData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor:d.color}}/>
                          <span className="text-gray-600">{d.name}</span>
                        </div>
                        <span className="font-bold" style={{color:"#800000"}}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4" style={{color:"#800000"}}>Status Penyelesaian</h3>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} dataKey="value">
                        {statusPieData.map((entry) => <Cell key={entry.name} fill={entry.color}/>)}
                      </Pie>
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:12}}/>
                      <Tooltip formatter={(v) => [v,""]} contentStyle={{borderRadius:8,fontSize:12}}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="w-full max-w-xs space-y-3">
                    {statusPieData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor:d.color}}/>
                          <span className="text-sm text-gray-600">{d.name}</span>
                        </div>
                        <span className="font-extrabold text-lg" style={{color:d.color}}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-5 text-center border-t bg-white">
        <p className="text-sm font-semibold" style={{color:"#800000"}}>© 2026 Telkom Indonesia — Fallout Management System</p>
        <p className="text-xs text-gray-400 mt-1">Data tersedia untuk umum. Login diperlukan untuk manajemen data.</p>
      </footer>

      {/* ── MODAL EXPORT DATA ────────────────────────────────────────── */}
      {showExportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !isExporting && setShowExportModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            
            {/* Header Modal */}
            <div className="px-6 py-5 flex items-center justify-between text-white" style={{ background: GRADIENT }}>
              <div>
                <h3 className="font-extrabold text-lg">Export Data Fallout</h3>
                <p className="text-red-200 text-xs mt-1">Sesuaikan periode rekap data yang ingin diunduh</p>
              </div>
              <button onClick={() => !isExporting && setShowExportModal(false)} className="text-white/70 hover:text-white transition-all bg-white/10 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              
              {/* Filter Area dalam Modal */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-5">
                
                {/* Pilihan Mode Export */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Pilih Tipe Export</label>
                  <div className="flex bg-gray-100 p-1.5 rounded-xl">
                    <button
                      onClick={() => setExportMode("bulan")}
                      className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${exportMode === "bulan" ? "bg-white text-[#800000] shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Bulan & Tahun
                    </button>
                    <button
                      onClick={() => setExportMode("tahun")}
                      className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${exportMode === "tahun" ? "bg-white text-[#800000] shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Tahun
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap md:flex-nowrap items-end gap-4">
                  {exportMode === "bulan" && (
                    <div className="w-full md:w-1/2">
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Pilih Bulan</label>
                      <select 
                        value={exportMonth} 
                        onChange={(e) => setExportMonth(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border text-sm font-semibold outline-none transition-all cursor-pointer"
                        style={{ backgroundColor: "#F9FAFB", borderColor: "#E5E7EB", color: "#374151" }}
                        onFocus={(e) => { e.target.style.borderColor = "#800000"; e.target.style.boxShadow = "0 0 0 3px rgba(128,0,0,0.1)"; e.target.style.backgroundColor = "#fff"; }}
                        onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "none"; e.target.style.backgroundColor = "#F9FAFB"; }}
                      >
                        {MONTHS_ID.map((m, i) => <option key={m} value={i}>{m}</option>)}
                      </select>
                    </div>
                  )}
                  
                  <div className={`w-full ${exportMode === "bulan" ? "md:w-1/2" : ""}`}>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Pilih Tahun</label>
                    <select 
                      value={exportYear} 
                      onChange={(e) => setExportYear(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border text-sm font-semibold outline-none transition-all cursor-pointer"
                      style={{ backgroundColor: "#F9FAFB", borderColor: "#E5E7EB", color: "#374151" }}
                      onFocus={(e) => { e.target.style.borderColor = "#800000"; e.target.style.boxShadow = "0 0 0 3px rgba(128,0,0,0.1)"; e.target.style.backgroundColor = "#fff"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#E5E7EB"; e.target.style.boxShadow = "none"; e.target.style.backgroundColor = "#F9FAFB"; }}
                    >
                      {tahunList.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status & Preview Tabel */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm" style={{ backgroundColor: "#FFF5F5", border: "1px solid #FFCCCC" }}>
                  <Calendar size={16} style={{ color: "#800000" }} />
                  <span className="font-semibold" style={{ color: "#800000" }}>Periode Export:</span>
                  <span className="text-gray-700 font-medium">{exportPeriodLabel}</span>
                </div>
                <span className="font-bold text-gray-600 bg-gray-200 px-3 py-1 rounded-lg text-xs">{exportData.length} baris data ditemukan</span>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Preview Data (Max 5 Baris)</p>
                </div>
                {exportData.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <p className="font-medium text-sm">Tidak ada data untuk periode ini.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ backgroundColor: "#f3f4f6" }}>
                          {["No", "No/Order ID", "STO", "Tgl Fallout", "RESOLVED/ESKALASI", "Status"].map((h) => (
                            <th key={h} className="px-3 py-2.5 text-left text-gray-600 font-bold whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {exportData.slice(0, 5).map((row, i) => (
                          <tr key={row.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                            <td className="px-3 py-2.5 text-gray-500">{i + 1}</td>
                            <td className="px-3 py-2.5 text-gray-700 font-medium whitespace-nowrap" style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis" }}>{row.id}</td>
                            <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap font-bold">{row.sto}</td>
                            <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{row.tanggal}</td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ backgroundColor: row.resolved_eskalasi === "RESOLVED" ? "#F0FFF4" : "#FFF0F0", color: row.resolved_eskalasi === "RESOLVED" ? "#166534" : "#800000" }}>
                                {row.resolved_eskalasi}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap truncate max-w-[120px]" title={row.status}>{row.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal (Action Button) */}
            <div className="p-5 bg-white border-t border-gray-100 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowExportModal(false)}
                className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
              >
                Batal
              </button>
              <button 
                onClick={handleExportDownload} 
                disabled={isExporting || exportData.length === 0} 
                className="px-8 py-3 rounded-xl text-white font-bold text-sm flex items-center gap-2 shadow-lg hover:opacity-90 transition-all disabled:opacity-50" 
                style={{ background: GRADIENT }}
              >
                {isExporting ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <><Download size={16} /> Download {exportData.length > 0 ? `(${exportData.length} Data)` : ""}</>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Full ID */}
      {fullId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50" onClick={() => setFullId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">No/Order ID Lengkap</h3>
              <button onClick={() => setFullId(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-700 break-all leading-relaxed">{fullId}</p>
            </div>
            <button onClick={() => navigator.clipboard.writeText(fullId)}
              className="mt-4 w-full py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
              style={{background:GRADIENT}}>
              Copy ID
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDetail && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4" onClick={() => setSelectedDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 flex items-center justify-between rounded-t-2xl sticky top-0" style={{background:GRADIENT}}>
              <h3 className="font-bold text-white text-sm">Detail Fallout</h3>
              <button onClick={() => setSelectedDetail(null)} className="text-white/70 hover:text-white text-xl leading-none">✕</button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {[
                ["No/Order ID", selectedDetail.id],
                ["STO", selectedDetail.sto],
                ["Tanggal Fallout", selectedDetail.tanggal],
                ["PIC", selectedDetail.pic],
                ["RESOLVED/ESKALASI", selectedDetail.resolved_eskalasi],
                ["Status", selectedDetail.status],
              ].map(([k,v]) => (
                <div key={k} className="flex items-start justify-between gap-4 border-b border-gray-50 pb-2">
                  <span className="text-sm text-gray-400 w-44 flex-shrink-0">{k}</span>
                  <span className="text-sm font-semibold text-gray-800 text-right break-all">{v}</span>
                </div>
              ))}
              <div className="pt-1">
                <p className="text-xs text-gray-400 mb-1">Deskripsi Lengkap</p>
                <p className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed break-all">{selectedDetail.deskripsi}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Keterangan (KET)</p>
                <p className="text-xs rounded-lg p-3 leading-relaxed break-all" style={{backgroundColor:"#FFF5F5",color:"#800000"}}>{selectedDetail.ket}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end sticky bottom-0 bg-white">
              <button onClick={() => setSelectedDetail(null)}
                className="px-5 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90"
                style={{background:GRADIENT}}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
