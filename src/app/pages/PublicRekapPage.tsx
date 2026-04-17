import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { TelkomLogo } from "../components/TelkomLogo";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Eye, FileText, FileSpreadsheet, Download, X,
  ChevronLeft, ChevronRight, BarChart2, LayoutDashboard, LogIn,
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
  const [allData, setAllData] = useState<FalloutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stoFilter, setStoFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [page, setPage] = useState(1);
  const [selectedDetail, setSelectedDetail] = useState<FalloutRecord | null>(null);
  const [fullId, setFullId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tabel" | "grafik">("tabel");
  const [tahunList, setTahunList] = useState<string[]>([]);
  const [latestTanggalYMD, setLatestTanggalYMD] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fallout_data")
      .select("*")
      .order("uploaded_at", { ascending: false }); // terbaru duluan
    if (!error && data) {
      setAllData(data);

      // Cari tanggal terbaru dari data
      const ymdList = data
        .map((r) => parseIndonesianDate(r.tanggal))
        .filter(Boolean) as string[];
      if (ymdList.length > 0) {
        const latest = ymdList.reduce((a, b) => (a > b ? a : b));
        setLatestTanggalYMD(latest);
        setFilterTanggal(latest); // default tampilkan data terbaru
      }

      const tahuns = [...new Set(
        data.map((r) => parseIndonesianDate(r.tanggal)?.split("-")[0]).filter(Boolean)
      )].sort((a,b) => b!.localeCompare(a!)) as string[];
      setTahunList(tahuns);
    }
    setLoading(false);
  };

  // ── Filter ──────────────────────────────────────────────────────
  const filtered = allData.filter((d) => {
    const matchTanggal = !filterTanggal || parseIndonesianDate(d.tanggal) === filterTanggal;
    const matchSto = stoFilter === "Semua" || d.sto === stoFilter;
    const matchStatus = statusFilter === "Semua" || d.resolved_eskalasi === statusFilter;
    return matchTanggal && matchSto && matchStatus;
  });

  // Info header dari data yang difilter
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

  // ── Download helpers ────────────────────────────────────────────
  const downloadCSV = (data: FalloutRecord[]) => {
    const headers = ["No/Order ID","Deskripsi","STO","Tgl Fallout","PIC","RESOLVED/ESKALASI","Status","KET"];
    const rows = data.map((r) => [r.id,r.deskripsi,r.sto,r.tanggal,r.pic,r.resolved_eskalasi,r.status,r.ket]);
    const csv = [headers,...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`rekap-fallout-${tanggalRekap.replace(/ /g,"-")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = (data: FalloutRecord[]) => {
    const headers = ["No/Order ID","Deskripsi","STO","Tgl Fallout","PIC","RESOLVED/ESKALASI","Status","KET"];
    const rows = data.map((r) => [r.id,r.deskripsi,r.sto,r.tanggal,r.pic,r.resolved_eskalasi,r.status,r.ket]);
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="UTF-8"><title>Rekap Fallout</title></head><body>
      <table border="1"><thead><tr>${headers.map((h) => `<th style="background:#800000;color:white;font-weight:bold;">${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
    const blob = new Blob([html],{type:"application/vnd.ms-excel;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`rekap-fallout-${tanggalRekap.replace(/ /g,"-")}.xls`; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = (data: FalloutRecord[]) => {
    const doc = new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
    doc.setFillColor(54,0,0); doc.rect(0,0,297,35,"F");
    doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont("helvetica","bold");
    doc.text("PT Telekomunikasi Indonesia",148,10,{align:"center"});
    doc.setFontSize(13); doc.text("REKAP DATA FALLOUT",148,18,{align:"center"});
    doc.setFontSize(10); doc.setFont("helvetica","normal");
    doc.text(`Wilayah Jakarta Selatan  ·  Tanggal: ${tanggalRekap}`,148,25,{align:"center"});
    doc.setFillColor(128,0,0); doc.rect(0,35,297,10,"F");
    doc.setFontSize(9); doc.setTextColor(255,255,255);
    doc.text(`Total Data: ${data.length}`,14,41);
    doc.text(`PIC: ${picList}`,100,41);
    doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"})}`,200,41);
    autoTable(doc,{
      startY:48,
      head:[["No","No/Order ID","Deskripsi","STO","Tgl Fallout","PIC","RESOLVED/ESKALASI","Status","KET"]],
      body:data.map((r,i) => [i+1,r.id,r.deskripsi,r.sto,r.tanggal,r.pic,r.resolved_eskalasi,r.status,r.ket]),
      styles:{fontSize:7,cellPadding:2,overflow:"linebreak",valign:"middle"},
      headStyles:{fillColor:[128,0,0],textColor:[255,255,255],fontStyle:"bold",fontSize:8},
      alternateRowStyles:{fillColor:[255,245,245]},
      columnStyles:{0:{cellWidth:8},1:{cellWidth:35},2:{cellWidth:80},3:{cellWidth:15},4:{cellWidth:25},5:{cellWidth:18},6:{cellWidth:28},7:{cellWidth:28},8:{cellWidth:15}},
    });
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i=1;i<=pageCount;i++) {
      doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150,150,150);
      doc.text(`Halaman ${i} dari ${pageCount}  ·  PT Telekomunikasi Indonesia`,148,205,{align:"center"});
    }
    doc.save(`rekap-fallout-${tanggalRekap.replace(/ /g,"-")}.pdf`);
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
            <div className="flex flex-wrap gap-2">
              <button onClick={() => downloadCSV(filtered)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all shadow"
                style={{background:GRADIENT}}>
                <FileText size={15}/> CSV
              </button>
              <button onClick={() => downloadExcel(filtered)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all shadow"
                style={{background:GRADIENT}}>
                <FileSpreadsheet size={15}/> Excel
              </button>
              <button onClick={() => downloadPDF(filtered)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all shadow"
                style={{background:GRADIENT}}>
                <Download size={15}/> PDF
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
              {/* Filter Bar — tanggal + STO + status (tanpa search) */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Filter Tanggal */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">Tanggal:</label>
                    <input type="date" value={filterTanggal}
                      onChange={(e) => { setFilterTanggal(e.target.value); setPage(1); }}
                      className="px-3 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white"
                      style={{borderColor:"#E0E0E0"}}
                      onFocus={(e) => {e.target.style.borderColor="#800000";}}
                      onBlur={(e) => {e.target.style.borderColor="#E0E0E0";}}/>
                  </div>

                  {/* Filter STO */}
                  <select value={stoFilter} onChange={(e) => {setStoFilter(e.target.value); setPage(1);}}
                    className="px-3 py-2.5 rounded-xl border text-sm outline-none bg-white"
                    style={{borderColor:"#E0E0E0"}}>
                    {stoList.map((s) => <option key={s}>{s}</option>)}
                  </select>

                  {/* Filter Status */}
                  <select value={statusFilter} onChange={(e) => {setStatusFilter(e.target.value); setPage(1);}}
                    className="px-3 py-2.5 rounded-xl border text-sm outline-none bg-white"
                    style={{borderColor:"#E0E0E0"}}>
                    <option>Semua</option>
                    <option>RESOLVED</option>
                    <option>ESKALASI</option>
                  </select>

                  {/* Tombol reset ke tanggal terbaru */}
                  {filterTanggal !== latestTanggalYMD && latestTanggalYMD && (
                    <button onClick={() => {setFilterTanggal(latestTanggalYMD); setPage(1);}}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl transition-all hover:opacity-80"
                      style={{backgroundColor:"#FFF0F0",color:"#800000"}}>
                      Kembali ke data terbaru
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-3">{filtered.length} data ditemukan</p>
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
                            {/* No */}
                            <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                {(page-1)*PAGE_SIZE+i+1}
                                {isNew && (
                                  <span className="px-1.5 py-0.5 rounded-full text-white font-bold"
                                    style={{fontSize:"9px",backgroundColor:"#800000"}}>BARU</span>
                                )}
                              </div>
                            </td>

                            {/* ID — truncate + tombol mata */}
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

                            {/* Deskripsi */}
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
                                style={row.resolved_eskalasi==="RESOLVED"
                                  ? {backgroundColor:"#F0FFF4",color:"#166534"}
                                  : {backgroundColor:"#FFF7ED",color:"#9A3412"}}>
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

                {/* Pagination */}
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

      {/* Modal Full ID */}
      {fullId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{backgroundColor:"rgba(0,0,0,0.5)"}} onClick={() => setFullId(null)}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
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