import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Edit3, Trash2, Plus, X, Save, AlertCircle,
  CheckCircle2, Eye, Copy, Check, ChevronLeft, ChevronRight,
} from "lucide-react";

interface FalloutRow {
  row_id?: string;
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

const EMPTY_ROW: FalloutRow = {
  id: "", deskripsi: "", sto: "", tanggal: "",
  pic: "", resolved_eskalasi: "", status: "", ket: "",
};

const GRADIENT = "linear-gradient(to right, #360000, #800000)";
const PER_PAGE = 50;

const STO_LIST = ["TBE", "JAG", "BIN", "KAL", "KBY", "PSM", "CPE", "KMG"];

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

const formatDateToIndonesian = (ymd: string): string => {
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const [year, month, day] = ymd.split("-");
  return `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${year}`;
};

const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const inputClass = "w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all";
const inputStyle = { borderColor: "#E0E0E0", backgroundColor: "#FAFAFA" };
const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.target.style.borderColor = "#800000";
  e.target.style.boxShadow = "0 0 0 2px rgba(128,0,0,0.12)";
};
const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.target.style.borderColor = "#E0E0E0";
  e.target.style.boxShadow = "none";
};

export default function EditDataPage() {
  const [data, setData] = useState<FalloutRow[]>([]);
  const [filtered, setFiltered] = useState<FalloutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filter
  const [filterTanggal, setFilterTanggal] = useState<string>("");
  const [filterSTO, setFilterSTO] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [latestUploadDate, setLatestUploadDate] = useState<string>("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"edit" | "add">("edit");
  const [selectedRow, setSelectedRow] = useState<FalloutRow>(EMPTY_ROW);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [customSto, setCustomSto] = useState("");
  const [isCustomSto, setIsCustomSto] = useState(false);

  // Apakah tanggal bukan terbaru
  const isNotLatest = filterTanggal !== "" && filterTanggal !== latestUploadDate;

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    applyFilter();
    setPage(1);
  }, [filterTanggal, filterSTO, filterStatus, data]);

  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("fallout_data")
      .select("*")
      .order("uploaded_at", { ascending: false });
    if (!error && rows) {
      setData(rows);
      // Set default ke tanggal upload terbaru
      if (rows.length > 0 && rows[0].uploaded_at) {
        const latest = toYMD(new Date(rows[0].uploaded_at));
        setLatestUploadDate(latest);
        setFilterTanggal(latest);
      }
    }
    setLoading(false);
  };

  const applyFilter = () => {
    let result = [...data];
    if (filterTanggal !== "") {
      result = result.filter((r) => parseIndonesianDate(r.tanggal) === filterTanggal);
    }
    if (filterSTO !== "Semua") {
      result = result.filter((r) => r.sto === filterSTO);
    }
    if (filterStatus !== "Semua") {
      result = result.filter((r) => r.resolved_eskalasi === filterStatus);
    }
    setFiltered(result);
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

  const openEdit = (row: FalloutRow) => {
    setSelectedRow({ ...row });
    const isCustom = !STO_LIST.includes(row.sto) && row.sto !== "";
    setIsCustomSto(isCustom);
    setCustomSto(isCustom ? row.sto : "");
    setModalMode("edit");
    setModalOpen(true);
  };

  const openAdd = () => {
    setSelectedRow({ ...EMPTY_ROW });
    setCustomSto("");
    setIsCustomSto(false);
    setModalMode("add");
    setModalOpen(true);
  };

  const openPreviewId = (id: string) => {
    setPreviewId(id);
    setCopied(false);
  };

  const handleCopyId = () => {
    if (previewId) {
      navigator.clipboard.writeText(previewId).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleSave = async () => {
    if (!selectedRow.id.trim()) { showError("ID tidak boleh kosong."); return; }
    if (!selectedRow.sto.trim()) { showError("STO tidak boleh kosong."); return; }
    setSaving(true);
    if (modalMode === "edit") {
      const { error } = await supabase
        .from("fallout_data")
        .update({
          deskripsi: selectedRow.deskripsi,
          sto: selectedRow.sto,
          tanggal: selectedRow.tanggal,
          pic: selectedRow.pic,
          resolved_eskalasi: selectedRow.resolved_eskalasi,
          status: selectedRow.status,
          ket: selectedRow.ket,
        })
        .eq("id", selectedRow.id);
      if (error) showError(`Gagal menyimpan: ${error.message}`);
      else { showSuccess("Data berhasil diupdate!"); setModalOpen(false); fetchData(); }
    } else {
      const { error } = await supabase.from("fallout_data").insert({
        id: selectedRow.id,
        deskripsi: selectedRow.deskripsi,
        sto: selectedRow.sto,
        tanggal: selectedRow.tanggal,
        pic: selectedRow.pic,
        resolved_eskalasi: selectedRow.resolved_eskalasi,
        status: selectedRow.status,
        ket: selectedRow.ket,
      });
      if (error) {
        if (error.message.includes("duplicate")) showError("ID sudah ada. Gunakan ID yang berbeda.");
        else showError(`Gagal menambah data: ${error.message}`);
      } else { showSuccess("Data berhasil ditambahkan!"); setModalOpen(false); fetchData(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("fallout_data").delete().eq("id", id);
    if (error) showError("Gagal menghapus data.");
    else { showSuccess("Data berhasil dihapus!"); setDeleteConfirm(null); fetchData(); }
  };

  // Pagination
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const hasNonDefaultFilter = filterTanggal !== latestUploadDate || filterSTO !== "Semua" || filterStatus !== "Semua";

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "#800000" }}>Edit Data</h1>
          <p className="text-gray-500 text-sm">Menampilkan {filtered.length} dari {data.length} total data</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90"
          style={{ background: GRADIENT }}>
          <Plus size={16} /> Tambah Data
        </button>
      </div>

      {/* Banners */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ backgroundColor: "#F0FFF4", border: "1px solid #86EFAC" }}>
          <CheckCircle2 size={18} className="text-green-600" />
          <p className="text-green-700 text-sm font-medium">{successMsg}</p>
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ backgroundColor: "#FFF0F0", border: "1px solid #FFCCCC" }}>
          <AlertCircle size={18} style={{ color: "#800000" }} />
          <p className="text-sm font-medium" style={{ color: "#800000" }}>{errorMsg}</p>
        </div>
      )}

      {/* Tombol Kembali ke Data Terbaru */}
      {isNotLatest && (
        <div className="mb-4">
          <button
            onClick={() => { setFilterTanggal(latestUploadDate); setFilterStatus("Semua"); setPage(1); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: "#FFF5F5", border: "1px solid #FFCCCC", color: "#800000" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
            Kembali ke data terbaru
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">

          {/* Date picker */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Tanggal:</span>
            <input
              type="date"
              value={filterTanggal}
              onChange={(e) => setFilterTanggal(e.target.value)}
              className="px-3 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white"
              style={{ borderColor: "#E0E0E0", minWidth: "160px" }}
              onFocus={(e) => { e.target.style.borderColor = "#800000"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E0E0E0"; }}
            />
          </div>

          {/* STO filter */}
          <select
            value={filterSTO}
            onChange={(e) => setFilterSTO(e.target.value)}
            className="px-3 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white"
            style={{ borderColor: "#E0E0E0" }}
          >
            <option value="Semua">Semua STO</option>
            {STO_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Reset filter */}
          {hasNonDefaultFilter && (
            <button
              onClick={() => { setFilterTanggal(latestUploadDate); setFilterSTO("Semua"); setFilterStatus("Semua"); setPage(1); }}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-all"
            >
              <X size={12} /> Reset filter
            </button>
          )}
        </div>

        {/* Status pills */}
        <div className="flex gap-2 mt-3">
          {["Semua", "RESOLVED", "ESKALASI"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: filterStatus === s ? GRADIENT : "white",
                color: filterStatus === s ? "white" : "#800000",
                border: `1px solid ${filterStatus === s ? "transparent" : "#800000"}`,
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Info filter */}
        <div className="mt-2 text-xs text-gray-400">
          {filterTanggal === ""
            ? "Menampilkan semua tanggal"
            : filterTanggal === latestUploadDate
              ? `Data terbaru · ${formatDateToIndonesian(filterTanggal)}`
              : `Tanggal · ${formatDateToIndonesian(filterTanggal)}`
          }
          {" "}· <span className="font-medium text-gray-500">{filtered.length} data ditemukan</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-8 h-8" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#800000" strokeWidth="4" />
              <path className="opacity-75" fill="#800000" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <AlertCircle size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Tidak ada data ditemukan</p>
            <p className="text-sm mt-1">Coba ubah filter pencarian</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#800000" }}>
                  {["No", "No/Order ID", "STO", "Tanggal", "PIC", "Status", "KET", "Aksi"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-white font-semibold whitespace-nowrap text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((row, i) => (
                  <tr key={row.row_id || row.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#FFF5F5" }}>
                    <td className="px-4 py-3 text-gray-400 text-xs text-center whitespace-nowrap">
                      {(page - 1) * PER_PAGE + i + 1}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-700"
                          style={{ maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}>
                          {row.id}
                        </span>
                        <button onClick={() => openPreviewId(row.id)}
                          className="p-0.5 rounded hover:bg-red-50 transition-all flex-shrink-0"
                          style={{ color: "#800000", opacity: 0.7 }} title="Lihat ID lengkap">
                          <Eye size={13} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap">{row.sto}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap">{row.tanggal}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap">{row.pic}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: row.resolved_eskalasi === "RESOLVED" ? "#F0FFF4" : "#FFF0F0",
                          color: row.resolved_eskalasi === "RESOLVED" ? "#166534" : "#800000",
                        }}>
                        {row.resolved_eskalasi}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap">{row.ket}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(row)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-all" style={{ color: "#800000" }}>
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => setDeleteConfirm(row.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-all text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            Halaman {page} dari {totalPages} · {filtered.length} data
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border transition-all disabled:opacity-40 hover:bg-gray-50"
              style={{ borderColor: "#E0E0E0" }}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc: (number | string)[], p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "..." ? (
                  <span key={idx} className="px-2 text-gray-400 text-sm">...</span>
                ) : (
                  <button
                    key={idx}
                    onClick={() => setPage(p as number)}
                    className="w-9 h-9 rounded-lg text-sm font-medium transition-all"
                    style={{
                      backgroundColor: page === p ? "#800000" : "white",
                      color: page === p ? "white" : "#374151",
                      border: `1px solid ${page === p ? "#800000" : "#E0E0E0"}`,
                    }}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border transition-all disabled:opacity-40 hover:bg-gray-50"
              style={{ borderColor: "#E0E0E0" }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Popup Preview ID */}
      {previewId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setPreviewId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-base">No/Order ID Lengkap</h3>
              <button onClick={() => setPreviewId(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="rounded-xl px-4 py-3 mb-5 text-sm text-gray-700 break-all leading-relaxed"
              style={{ backgroundColor: "#F5F5F5", border: "1px solid #E8E8E8" }}>
              {previewId}
            </div>
            <button onClick={handleCopyId}
              className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: GRADIENT }}>
              {copied ? <><Check size={16} />Tersalin!</> : <><Copy size={16} />Copy ID</>}
            </button>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: GRADIENT }}>
              <h3 className="text-white font-bold">{modalMode === "edit" ? "Edit Data" : "Tambah Data Baru"}</h3>
              <button onClick={() => setModalOpen(false)} className="text-white hover:opacity-70"><X size={20} /></button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* ID */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700">No/Order ID</label>
                <input type="text" value={selectedRow.id}
                  onChange={(e) => setSelectedRow({ ...selectedRow, id: e.target.value })}
                  disabled={modalMode === "edit"}
                  className={inputClass}
                  style={{ ...inputStyle, opacity: modalMode === "edit" ? 0.6 : 1 }}
                  onFocus={inputFocus} onBlur={inputBlur} placeholder="Masukkan ID" />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700">Deskripsi</label>
                <textarea value={selectedRow.deskripsi}
                  onChange={(e) => setSelectedRow({ ...selectedRow, deskripsi: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all resize-none"
                  style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}
                  placeholder="Masukkan deskripsi" />
              </div>

              {/* STO + Tanggal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-700">STO</label>
                  <select
                    value={isCustomSto ? "Lainnya" : selectedRow.sto}
                    onChange={(e) => {
                      if (e.target.value === "Lainnya") {
                        setIsCustomSto(true);
                        setCustomSto("");
                        setSelectedRow({ ...selectedRow, sto: "" });
                      } else {
                        setIsCustomSto(false);
                        setCustomSto("");
                        setSelectedRow({ ...selectedRow, sto: e.target.value });
                      }
                    }}
                    className={inputClass} style={inputStyle}
                    onFocus={inputFocus} onBlur={inputBlur}>
                    <option value="">Pilih STO...</option>
                    {STO_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                    <option value="Lainnya">Lainnya...</option>
                  </select>
                  {isCustomSto && (
                    <input
                      type="text"
                      placeholder="Ketik nama STO..."
                      value={customSto}
                      onChange={(e) => {
                        setCustomSto(e.target.value);
                        setSelectedRow({ ...selectedRow, sto: e.target.value });
                      }}
                      className={inputClass}
                      style={{ ...inputStyle, marginTop: "8px" }}
                      onFocus={inputFocus} onBlur={inputBlur}
                      autoFocus
                    />
                  )}
                </div>

                {/* Tanggal */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-700">Tanggal</label>
                  <input type="date"
                    value={selectedRow.tanggal
                      ? (() => {
                          const parsed = parseIndonesianDate(selectedRow.tanggal);
                          return parsed || selectedRow.tanggal;
                        })()
                      : ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        const date = new Date(e.target.value + "T00:00:00");
                        const formatted = date.toLocaleDateString("id-ID", {
                          day: "2-digit", month: "long", year: "numeric"
                        });
                        setSelectedRow({ ...selectedRow, tanggal: formatted });
                      }
                    }}
                    className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                </div>
              </div>

              {/* PIC + RESOLVED/ESKALASI */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-700">PIC</label>
                  <input type="text" value={selectedRow.pic}
                    onChange={(e) => setSelectedRow({ ...selectedRow, pic: e.target.value })}
                    className={inputClass} style={inputStyle}
                    onFocus={inputFocus} onBlur={inputBlur} placeholder="Nama PIC" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-700">RESOLVED/ESKALASI</label>
                  <select value={selectedRow.resolved_eskalasi}
                    onChange={(e) => setSelectedRow({ ...selectedRow, resolved_eskalasi: e.target.value })}
                    className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}>
                    <option value="">Pilih...</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="ESKALASI">ESKALASI</option>
                  </select>
                </div>
              </div>

              {/* Status + KET */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-700">Status</label>
                  <select value={selectedRow.status}
                    onChange={(e) => setSelectedRow({ ...selectedRow, status: e.target.value })}
                    className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}>
                    <option value="">Pilih...</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="Process OSS (Provision Issued)">Process OSS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-700">KET</label>
                  <input type="text" value={selectedRow.ket}
                    onChange={(e) => setSelectedRow({ ...selectedRow, ket: e.target.value })}
                    className={inputClass} style={inputStyle}
                    onFocus={inputFocus} onBlur={inputBlur} placeholder="Keterangan" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
              <button onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-70"
                style={{ background: GRADIENT }}>
                {saving ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : <Save size={15} />}
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <Trash2 size={48} className="mx-auto mb-4 text-red-400" />
            <h3 className="font-bold text-gray-800 mb-2">Hapus Data?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Data dengan ID <strong>{deleteConfirm}</strong> akan dihapus permanen dan tidak bisa dikembalikan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all">
                Batal
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ background: GRADIENT }}>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}