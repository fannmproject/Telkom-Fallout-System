import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Trash2, AlertTriangle, CheckCircle2, AlertCircle, Calendar, Clock } from "lucide-react";

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

interface StatItem {
  tanggal: string;
  jumlah: number;
  ymd: string;
}

interface TahunStat {
  tahun: string;
  jumlah: number;
}

export default function ArsipandDeletePage() {
  const [loading, setLoading] = useState(true);
  const [statsByTanggal, setStatsByTanggal] = useState<StatItem[]>([]);
  const [statsByTahun, setStatsByTahun] = useState<TahunStat[]>([]);
  const [tahunList, setTahunList] = useState<string[]>([]);

  // Hapus per tanggal
  const [selectedTanggal, setSelectedTanggal] = useState("");
  const [confirmTanggal, setConfirmTanggal] = useState(false);
  const [deletingTanggal, setDeletingTanggal] = useState(false);

  // Hapus per tahun
  const [selectedTahun, setSelectedTahun] = useState("");
  const [confirmTahun, setConfirmTahun] = useState(false);
  const [deletingTahun, setDeletingTahun] = useState(false);

  // Feedback
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fallout_data")
      .select("tanggal");

    if (!error && data) {
      // Hitung per tanggal
      const tanggalMap: Record<string, number> = {};
      data.forEach((r) => {
        if (r.tanggal) tanggalMap[r.tanggal] = (tanggalMap[r.tanggal] || 0) + 1;
      });

      const tanggalStats: StatItem[] = Object.entries(tanggalMap)
        .map(([tanggal, jumlah]) => ({
          tanggal,
          jumlah,
          ymd: parseIndonesianDate(tanggal) || "",
        }))
        .filter((s) => s.ymd)
        .sort((a, b) => b.ymd.localeCompare(a.ymd));

      setStatsByTanggal(tanggalStats);

      // Hitung per tahun
      const tahunMap: Record<string, number> = {};
      data.forEach((r) => {
        const parts = r.tanggal?.split(" ");
        if (parts?.length === 3) {
          tahunMap[parts[2]] = (tahunMap[parts[2]] || 0) + 1;
        }
      });

      const tahunStats: TahunStat[] = Object.entries(tahunMap)
        .map(([tahun, jumlah]) => ({ tahun, jumlah }))
        .sort((a, b) => b.tahun.localeCompare(a.tahun));

      setStatsByTahun(tahunStats);
      setTahunList(tahunStats.map((t) => t.tahun));

      if (tahunStats.length > 0) setSelectedTahun(tahunStats[tahunStats.length - 1].tahun);
    }
    setLoading(false);
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 5000);
  };

  // ── Hapus per tanggal ───────────────────────────────────────────
  const handleHapusTanggal = async () => {
    if (!selectedTanggal) return;
    setDeletingTanggal(true);
    setConfirmTanggal(false);

    try {
      // Cari nama tanggal Indonesia yang sesuai dengan YMD yang dipilih
      const targetItems = statsByTanggal.filter((s) => s.ymd === selectedTanggal);
      if (targetItems.length === 0) throw new Error("Tanggal tidak ditemukan");

      for (const item of targetItems) {
        // Hapus dari fallout_data
        const { error: delData } = await supabase
          .from("fallout_data")
          .delete()
          .eq("tanggal", item.tanggal);
        if (delData) throw delData;

        // Hapus batch yang terkait
        const { error: delBatch } = await supabase
          .from("upload_batches")
          .delete()
          .eq("tanggal", item.tanggal);
        if (delBatch) throw delBatch;
      }

      showSuccess(`Berhasil menghapus ${targetItems.reduce((s,i) => s+i.jumlah, 0)} data tanggal ${new Date(selectedTanggal).toLocaleDateString("id-ID", {day:"2-digit",month:"long",year:"numeric"})}`);
      setSelectedTanggal("");
      fetchStats();
    } catch (err: any) {
      showError(`Gagal menghapus: ${err.message || "Coba lagi."}`);
    }
    setDeletingTanggal(false);
  };

  // ── Hapus per tahun ─────────────────────────────────────────────
  const handleHapusTahun = async () => {
    if (!selectedTahun) return;
    setDeletingTahun(true);
    setConfirmTahun(false);

    try {
      // Ambil semua tanggal di tahun tersebut
      const targetItems = statsByTanggal.filter((s) => s.ymd.startsWith(selectedTahun));

      for (const item of targetItems) {
        const { error: delData } = await supabase
          .from("fallout_data")
          .delete()
          .eq("tanggal", item.tanggal);
        if (delData) throw delData;

        const { error: delBatch } = await supabase
          .from("upload_batches")
          .delete()
          .eq("tanggal", item.tanggal);
        if (delBatch) throw delBatch;
      }

      const totalHapus = targetItems.reduce((s, i) => s + i.jumlah, 0);
      showSuccess(`Berhasil menghapus ${totalHapus} data tahun ${selectedTahun}`);
      fetchStats();
    } catch (err: any) {
      showError(`Gagal menghapus: ${err.message || "Coba lagi."}`);
    }
    setDeletingTahun(false);
  };

  // Jumlah data di tanggal yang dipilih
  const jumlahTanggalDipilih = selectedTanggal
    ? statsByTanggal.filter((s) => s.ymd === selectedTanggal).reduce((s,i) => s+i.jumlah, 0)
    : 0;

  const jumlahTahunDipilih = selectedTahun
    ? statsByTahun.find((t) => t.tahun === selectedTahun)?.jumlah || 0
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#800000" strokeWidth="4"/>
          <path className="opacity-75" fill="#800000" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold" style={{color:"#800000"}}>Arsip & Hapus Data</h1>
        <p className="text-gray-500 text-sm">Hapus data per tanggal atau per tahun secara permanen</p>
      </div>

      {/* Banners */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{backgroundColor:"#F0FFF4",border:"1px solid #86EFAC"}}>
          <CheckCircle2 size={18} className="text-green-600"/>
          <p className="text-green-700 text-sm font-medium">{successMsg}</p>
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{backgroundColor:"#FFF0F0",border:"1px solid #FFCCCC"}}>
          <AlertCircle size={18} style={{color:"#800000"}}/>
          <p className="text-sm font-medium" style={{color:"#800000"}}>{errorMsg}</p>
        </div>
      )}

      {/* Warning Box */}
      <div className="mb-6 flex items-start gap-3 px-5 py-4 rounded-xl"
        style={{backgroundColor:"#FFFBEB",border:"1px solid #FDE68A"}}>
        <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5"/>
        <p className="text-sm text-amber-800">
          <strong>Peringatan:</strong> Data yang dihapus <strong>tidak bisa dikembalikan</strong>. 
          Pastikan data sudah dibackup (download CSV/Excel) sebelum menghapus.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Hapus Per Tanggal ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{backgroundColor:"#FFF0F0"}}>
              <Calendar size={20} style={{color:"#800000"}}/>
            </div>
            <div>
              <h2 className="font-extrabold text-gray-800">Hapus Per Tanggal</h2>
              <p className="text-xs text-gray-400">Hapus semua data di tanggal tertentu</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1.5 text-gray-700">Pilih Tanggal</label>
            <input type="date" value={selectedTanggal}
              onChange={(e) => setSelectedTanggal(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white"
              style={{borderColor:"#E0E0E0"}}
              onFocus={(e) => {e.target.style.borderColor="#800000";}}
              onBlur={(e) => {e.target.style.borderColor="#E0E0E0";}}/>
          </div>

          {/* Preview data yang akan dihapus */}
          {selectedTanggal && (
            <div className="mb-4 rounded-xl p-4"
              style={{backgroundColor: jumlahTanggalDipilih > 0 ? "#FFF5F5" : "#F9FAFB",
                      border: `1px solid ${jumlahTanggalDipilih > 0 ? "#FFCCCC" : "#E5E7EB"}`}}>
              {jumlahTanggalDipilih > 0 ? (
                <>
                  <p className="text-sm font-semibold" style={{color:"#800000"}}>
                    {jumlahTanggalDipilih} data akan dihapus
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tanggal: {new Date(selectedTanggal).toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"})}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400">Tidak ada data di tanggal ini</p>
              )}
            </div>
          )}

          <button
            onClick={() => setConfirmTanggal(true)}
            disabled={!selectedTanggal || jumlahTanggalDipilih === 0 || deletingTanggal}
            className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
            style={{background:GRADIENT}}>
            {deletingTanggal ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>Menghapus...</>
            ) : (
              <><Trash2 size={15}/>Hapus Data Tanggal Ini</>
            )}
          </button>
        </div>

        {/* ── Hapus Per Tahun ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{backgroundColor:"#FFF0F0"}}>
              <Clock size={20} style={{color:"#800000"}}/>
            </div>
            <div>
              <h2 className="font-extrabold text-gray-800">Hapus Per Tahun</h2>
              <p className="text-xs text-gray-400">Hapus semua data dalam satu tahun</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1.5 text-gray-700">Pilih Tahun</label>
            <select value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white"
              style={{borderColor:"#E0E0E0"}}
              onFocus={(e) => {e.target.style.borderColor="#800000";}}
              onBlur={(e) => {e.target.style.borderColor="#E0E0E0";}}>
              <option value="">Pilih tahun...</option>
              {tahunList.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Preview data yang akan dihapus */}
          {selectedTahun && (
            <div className="mb-4 rounded-xl p-4"
              style={{backgroundColor:"#FFF5F5",border:"1px solid #FFCCCC"}}>
              <p className="text-sm font-semibold" style={{color:"#800000"}}>
                {jumlahTahunDipilih} data akan dihapus
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Seluruh data tahun {selectedTahun} ({statsByTanggal.filter((s) => s.ymd.startsWith(selectedTahun)).length} tanggal)
              </p>
            </div>
          )}

          <button
            onClick={() => setConfirmTahun(true)}
            disabled={!selectedTahun || jumlahTahunDipilih === 0 || deletingTahun}
            className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
            style={{background:GRADIENT}}>
            {deletingTahun ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>Menghapus...</>
            ) : (
              <><Trash2 size={15}/>Hapus Semua Data Tahun {selectedTahun}</>
            )}
          </button>
        </div>
      </div>

      {/* ── Ringkasan Data ─────────────────────────────────────────── */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-extrabold mb-4" style={{color:"#800000"}}>Ringkasan Data di Database</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Per Tahun */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Per Tahun</p>
            <div className="space-y-2">
              {statsByTahun.map((t) => (
                <div key={t.tahun} className="flex items-center justify-between py-2 px-4 rounded-xl"
                  style={{backgroundColor:"#FFF5F5"}}>
                  <span className="font-bold text-gray-700">{t.tahun}</span>
                  <span className="text-sm font-bold" style={{color:"#800000"}}>{t.jumlah} data</span>
                </div>
              ))}
              {statsByTahun.length === 0 && (
                <p className="text-sm text-gray-400 italic">Tidak ada data</p>
              )}
            </div>
          </div>

          {/* Per Tanggal (10 terbaru) */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">10 Tanggal Terbaru</p>
            <div className="space-y-2">
              {statsByTanggal.slice(0, 10).map((s) => (
                <div key={s.tanggal} className="flex items-center justify-between py-2 px-4 rounded-xl"
                  style={{backgroundColor:"#FAFAFA",border:"1px solid #F0F0F0"}}>
                  <span className="text-sm text-gray-600">{s.tanggal}</span>
                  <span className="text-xs font-bold" style={{color:"#800000"}}>{s.jumlah} data</span>
                </div>
              ))}
              {statsByTanggal.length === 0 && (
                <p className="text-sm text-gray-400 italic">Tidak ada data</p>
              )}
              {statsByTanggal.length > 10 && (
                <p className="text-xs text-gray-400 text-center">...dan {statsByTanggal.length - 10} tanggal lainnya</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal Konfirmasi Hapus Tanggal ──────────────────────────── */}
      {confirmTanggal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{backgroundColor:"rgba(0,0,0,0.5)"}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{backgroundColor:"#FFF0F0"}}>
              <Trash2 size={28} style={{color:"#800000"}}/>
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">Hapus Data?</h3>
            <p className="text-gray-500 text-sm mb-2">
              Kamu akan menghapus <strong style={{color:"#800000"}}>{jumlahTanggalDipilih} data</strong> tanggal:
            </p>
            <p className="font-bold text-gray-800 mb-5">
              {new Date(selectedTanggal).toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"})}
            </p>
            <p className="text-xs text-red-500 mb-5">⚠️ Tindakan ini tidak bisa dibatalkan!</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmTanggal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all">
                Batal
              </button>
              <button onClick={handleHapusTanggal}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{background:GRADIENT}}>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Konfirmasi Hapus Tahun ────────────────────────────── */}
      {confirmTahun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{backgroundColor:"rgba(0,0,0,0.5)"}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{backgroundColor:"#FFF0F0"}}>
              <Trash2 size={28} style={{color:"#800000"}}/>
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">Hapus Semua Data?</h3>
            <p className="text-gray-500 text-sm mb-2">
              Kamu akan menghapus <strong style={{color:"#800000"}}>{jumlahTahunDipilih} data</strong> dari tahun:
            </p>
            <p className="font-bold text-gray-800 text-2xl mb-5">{selectedTahun}</p>
            <p className="text-xs text-red-500 mb-5">⚠️ Tindakan ini tidak bisa dibatalkan!</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmTahun(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all">
                Batal
              </button>
              <button onClick={handleHapusTahun}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{background:GRADIENT}}>
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}