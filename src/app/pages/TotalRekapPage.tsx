import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "../lib/supabase";

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

interface BatchRow {
  batch_id: string;
  tanggal: string;
  pic: string;
  total_data: number;
  uploaded_at?: string;
}

type TabType = "harian" | "bulanan" | "tahunan";

const GRADIENT = "linear-gradient(to right, #360000, #800000)";

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const parseIndonesianDate = (tanggal: string): string | null => {
  const months: Record<string, string> = {
    Januari: "01", Februari: "02", Maret: "03", April: "04",
    Mei: "05", Juni: "06", Juli: "07", Agustus: "08",
    September: "09", Oktober: "10", November: "11", Desember: "12",
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

const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const StatCard = ({
  title, value, sub, icon,
}: {
  title: string; value: string; sub?: string; icon: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between">
    <div>
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      <p className="text-3xl font-extrabold" style={{ color: "#800000" }}>{value}</p>
      {sub && <p className="text-gray-400 text-xs mt-1">{sub}</p>}
    </div>
    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFF0F0" }}>
      {icon}
    </div>
  </div>
);

export default function TotalRekapPage() {
  const [data, setData] = useState<FalloutRow[]>([]);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>("harian");

  const [hariTanggal, setHariTanggal] = useState(toYMD(new Date()));
  const [bulanSelected, setBulanSelected] = useState(new Date().getMonth());
  const [tahunBulan, setTahunBulan] = useState(String(new Date().getFullYear()));
  const [tahunSelected, setTahunSelected] = useState(String(new Date().getFullYear()));
  const [tahunList, setTahunList] = useState<string[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from("fallout_data").select("*");
    if (!error && rows) {
      setData(rows);
      const tahuns = [...new Set(
        rows.map((r) => parseIndonesianDate(r.tanggal)?.split("-")[0]).filter(Boolean)
      )].sort((a, b) => b!.localeCompare(a!)) as string[];
      setTahunList(tahuns);
    }
    const { data: batchRows, error: batchError } = await supabase
      .from("upload_batches").select("*").order("uploaded_at", { ascending: false });
    if (!batchError && batchRows) setBatches(batchRows);
    setLoading(false);
  };

  // ── Filter data berdasarkan tab ─────────────────────────────────
  const getFilteredData = (): FalloutRow[] => {
    if (tab === "harian") {
      return data.filter((r) => parseIndonesianDate(r.tanggal) === hariTanggal);
    }
    if (tab === "bulanan") {
      const mm = String(bulanSelected + 1).padStart(2, "0");
      return data.filter((r) => parseIndonesianDate(r.tanggal)?.startsWith(`${tahunBulan}-${mm}`));
    }
    if (tab === "tahunan") {
      return data.filter((r) => parseIndonesianDate(r.tanggal)?.startsWith(tahunSelected));
    }
    return data;
  };

  // ── Filter batches berdasarkan tab ──────────────────────────────
  const getFilteredBatches = (): BatchRow[] => {
    if (tab === "harian") {
      return batches.filter((b) => parseIndonesianDate(b.tanggal) === hariTanggal);
    }
    if (tab === "bulanan") {
      const mm = String(bulanSelected + 1).padStart(2, "0");
      return batches.filter((b) => parseIndonesianDate(b.tanggal)?.startsWith(`${tahunBulan}-${mm}`));
    }
    if (tab === "tahunan") {
      return batches.filter((b) => parseIndonesianDate(b.tanggal)?.startsWith(tahunSelected));
    }
    return batches;
  };

  const filtered = getFilteredData();
  const filteredBatches = getFilteredBatches();

  // ── Statistik ───────────────────────────────────────────────────
  const total = filtered.length;
  const resolved = filtered.filter((r) => r.resolved_eskalasi === "RESOLVED").length;
  const eskalasi = filtered.filter((r) => r.resolved_eskalasi === "ESKALASI").length;
  const completed = filtered.filter((r) => r.status === "COMPLETED").length;
  const processOSS = filtered.filter((r) => r.status !== "COMPLETED").length;

  const stoMap: Record<string, number> = {};
  filtered.forEach((r) => { if (r.sto) stoMap[r.sto] = (stoMap[r.sto] || 0) + 1; });
  const stoData = Object.entries(stoMap)
    .map(([sto, count]) => ({ sto, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // ── Info Rekap ──────────────────────────────────────────────────
  const tanggalTerbaru = batches.length > 0 ? batches[0].tanggal : "-";

  // Akumulasi total_data per PIC unik di periode yang dipilih
  const uploadInfoPeriode = Object.values(
    filteredBatches.reduce<Record<string, { pic: string; total_data: number }>>((acc, b) => {
      const pic = b.pic?.trim() || "-";
      if (!acc[pic]) acc[pic] = { pic, total_data: 0 };
      acc[pic].total_data += b.total_data || 0;
      return acc;
    }, {})
  ).sort((a, b) => b.total_data - a.total_data); // urutkan dari terbanyak

  // ── Bar chart tren bulanan (tab tahunan) ────────────────────────
  const bulananData = MONTHS_ID.map((month, idx) => {
    const mm = String(idx + 1).padStart(2, "0");
    const count = data.filter((r) =>
      parseIndonesianDate(r.tanggal)?.startsWith(`${tahunSelected}-${mm}`)
    ).length;
    return { bulan: month.substring(0, 3), count };
  });

  // ── Label periode ───────────────────────────────────────────────
  const getPeriodLabel = () => {
    if (tab === "harian") {
      const d = new Date(hariTanggal);
      return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
    }
    if (tab === "bulanan") return `${MONTHS_ID[bulanSelected]} ${tahunBulan}`;
    return `Tahun ${tahunSelected}`;
  };

  const TABS: { key: TabType; label: string }[] = [
    { key: "harian", label: "Rekap Harian" },
    { key: "bulanan", label: "Rekap Bulanan" },
    { key: "tahunan", label: "Rekap Tahunan" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="animate-spin w-10 h-10 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#800000" strokeWidth="4" />
            <path className="opacity-75" fill="#800000" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500 text-sm">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold" style={{ color: "#800000" }}>Total Rekap Fallout</h1>
        <p className="text-gray-500 text-sm">Periode: {getPeriodLabel()}</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 mb-5 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 w-fit">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={
              tab === t.key
                ? { background: GRADIENT, color: "white" }
                : { color: "#6B7280", background: "transparent" }
            }>
            {t.label}
          </button>
        ))}
      </div>

      {/* Selector per Tab */}
      <div className="mb-5">
        {tab === "harian" && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-600">Tanggal:</label>
            <input type="date" value={hariTanggal}
              onChange={(e) => setHariTanggal(e.target.value)}
              className="px-4 py-2 rounded-xl border text-sm outline-none transition-all"
              style={{ borderColor: "#E0E0E0", backgroundColor: "#FAFAFA" }}
              onFocus={(e) => { e.target.style.borderColor = "#800000"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E0E0E0"; }} />
          </div>
        )}
        {tab === "bulanan" && (
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-semibold text-gray-600">Bulan:</label>
            <select value={bulanSelected} onChange={(e) => setBulanSelected(Number(e.target.value))}
              className="px-4 py-2 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: "#E0E0E0" }}>
              {MONTHS_ID.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={tahunBulan} onChange={(e) => setTahunBulan(e.target.value)}
              className="px-4 py-2 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: "#E0E0E0" }}>
              {tahunList.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        )}
        {tab === "tahunan" && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-600">Tahun:</label>
            <select value={tahunSelected} onChange={(e) => setTahunSelected(e.target.value)}
              className="px-4 py-2 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: "#E0E0E0" }}>
              {tahunList.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Tidak ada data */}
      {total === 0 ? (
        <div className="flex items-center justify-center h-48 bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
          <div className="text-center">
            <AlertCircle size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">Tidak ada data untuk periode ini</p>
            <p className="text-gray-400 text-sm mt-1">Coba pilih periode lain</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard title="Total Fallout" value={total.toString()} sub={getPeriodLabel()} icon={<AlertCircle size={22} style={{ color: "#800000" }} />} />
            <StatCard title="RESOLVED" value={resolved.toString()} icon={<CheckCircle2 size={22} style={{ color: "#800000" }} />} />
            <StatCard title="COMPLETED" value={completed.toString()} icon={<Clock size={22} style={{ color: "#800000" }} />} />
            <StatCard title="STO Aktif" value={Object.keys(stoMap).length.toString()} icon={<TrendingUp size={22} style={{ color: "#800000" }} />} />
          </div>

          {/* Charts + Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Pie RESOLVED/ESKALASI */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-extrabold mb-4" style={{ color: "#800000" }}>RESOLVED / ESKALASI</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "RESOLVED", value: resolved, color: "#800000" },
                      { name: "ESKALASI", value: eskalasi, color: "#cc3333" },
                    ]}
                    cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                    {[{ color: "#800000" }, { color: "#cc3333" }].map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Status */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-extrabold mb-4" style={{ color: "#800000" }}>Status Penyelesaian</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Process OSS", value: processOSS, color: "#800000" },
                      { name: "COMPLETED", value: completed, color: "#2d6a4f" },
                    ]}
                    cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                    {[{ color: "#800000" }, { color: "#2d6a4f" }].map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Info Rekap */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-extrabold mb-4" style={{ color: "#800000" }}>Info Rekap</h3>
              <div className="space-y-2">

                {/* Tgl rekap terbaru */}
                <div className="flex items-start justify-between py-2 border-b border-gray-50 gap-2">
                  <span className="text-gray-500 text-sm flex-shrink-0">Tgl Rekap Terbaru</span>
                  <span className="font-semibold text-sm text-gray-800 text-right">{tanggalTerbaru}</span>
                </div>

                {/* Total record periode */}
                <div className="flex items-start justify-between py-2 border-b border-gray-50 gap-2">
                  <span className="text-gray-500 text-sm flex-shrink-0">Total Record</span>
                  <span className="font-semibold text-sm text-right" style={{ color: "#800000" }}>{total} data</span>
                </div>

                {/* Riwayat upload periode ini — PIC diakumulasi */}
                <div className="py-2 border-b border-gray-50">
                  <p className="text-gray-500 text-sm mb-2">Upload ({getPeriodLabel()})</p>
                  {uploadInfoPeriode.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Belum ada upload di periode ini</p>
                  ) : (
                    <div className="space-y-1.5">
                      {uploadInfoPeriode.map((u, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#800000" }} />
                            <span className="text-xs font-semibold text-gray-700">{u.pic}</span>
                          </div>
                          <span className="text-xs font-bold" style={{ color: "#800000" }}>{u.total_data} data</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info statis */}
                <div className="flex items-start justify-between py-2 border-b border-gray-50 gap-2">
                  <span className="text-gray-500 text-sm flex-shrink-0">Tipe Fallout</span>
                  <span className="font-semibold text-sm text-gray-800 text-right">Provisioning Failed</span>
                </div>
                <div className="flex items-start justify-between py-2 gap-2">
                  <span className="text-gray-500 text-sm flex-shrink-0">Sistem</span>
                  <span className="font-semibold text-sm text-gray-800 text-right">UIM / OSM / OSS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart per STO */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-extrabold mb-4" style={{ color: "#800000" }}>Fallout per STO</h3>
            {stoData.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Tidak ada data STO untuk periode ini</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stoData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="sto" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#800000" radius={[6, 6, 0, 0]} name="Jumlah Fallout" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bar Chart Tren Bulanan — hanya tab Tahunan */}
          {tab === "tahunan" && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-extrabold mb-4" style={{ color: "#800000" }}>Tren Bulanan {tahunSelected}</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={bulananData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#800000" radius={[6, 6, 0, 0]} name="Jumlah Fallout" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}