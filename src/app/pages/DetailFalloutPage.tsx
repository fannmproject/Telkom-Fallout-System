import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  ChevronLeft, ChevronRight, AlertCircle,
  Eye, X, ChevronUp, ChevronDown as ChevronDownIcon,
  RotateCcw,
} from "lucide-react";

interface FalloutRow {
  row_id: string;
  batch_id: string;
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

type SortKey = "tanggal" | "sto" | "pic" | "resolved_eskalasi" | "status";
type SortDir = "asc" | "desc";

const PER_PAGE = 50;
const GRADIENT = "linear-gradient(to right, #360000, #800000)";

const STO_LIST = ["Semua", "TBE", "JAG", "BIN", "KAL", "KBY", "PSM", "CPE", "KMG"];

// Konversi "10 Maret 2026" → "2026-03-10"
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

// Konversi "2026-04-13" → "13 April 2026"
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

export default function DetailFalloutPage() {
  const [data, setData] = useState<FalloutRow[]>([]);
  const [filtered, setFiltered] = useState<FalloutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("tanggal");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Filter states
  // filterTanggal: "yyyy-mm-dd" string atau "" (semua)
  const [filterTanggal, setFilterTanggal] = useState<string>("");
  const [filterSTO, setFilterSTO] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");

  // Modal
  const [fullId, setFullId] = useState<string | null>(null);
  const [fullDesc, setFullDesc] = useState<string | null>(null);

  // Tanggal upload terbaru dari seluruh data (berdasarkan uploaded_at)
  const [latestUploadDate, setLatestUploadDate] = useState<string>("");

  // Apakah sedang menampilkan tanggal selain terbaru?
  const isNotLatest = filterTanggal !== "" && filterTanggal !== latestUploadDate;

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    applyFilterAndSort();
    setPage(1);
  }, [filterTanggal, filterSTO, filterStatus, sortKey, sortDir, data]);

  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("fallout_data")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (!error && rows) {
      setData(rows);

      // Tentukan tanggal upload terbaru
      if (rows.length > 0 && rows[0].uploaded_at) {
        const latest = toYMD(new Date(rows[0].uploaded_at));
        setLatestUploadDate(latest);
        // Default: tampilkan data terbaru saja
        setFilterTanggal(latest);
      }
    }
    setLoading(false);
  };

  const applyFilterAndSort = () => {
    let result = [...data];

    // Filter by tanggal (match kolom "tanggal" di data, format "10 Maret 2026")
    if (filterTanggal !== "") {
      result = result.filter((r) => {
        const parsed = parseIndonesianDate(r.tanggal);
        return parsed === filterTanggal;
      });
    }

    if (filterSTO !== "Semua") result = result.filter((r) => r.sto === filterSTO);
    if (filterStatus !== "Semua") result = result.filter((r) => r.resolved_eskalasi === filterStatus);

    // Sort
    result.sort((a, b) => {
      let valA: string = "";
      let valB: string = "";

      if (sortKey === "tanggal") {
        valA = parseIndonesianDate(a.tanggal) || "";
        valB = parseIndonesianDate(b.tanggal) || "";
      } else {
        valA = (a[sortKey] || "").toLowerCase();
        valB = (b[sortKey] || "").toLowerCase();
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    setFiltered(result);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const resetFilter = () => {
    setFilterTanggal(latestUploadDate);
    setFilterSTO("Semua");
    setFilterStatus("Semua");
  };

  const goToLatest = () => {
    setFilterTanggal(latestUploadDate);
    setPage(1);
  };

  const isNewData = (row: FalloutRow): boolean => {
    if (!row.uploaded_at) return false;
    const uploadDate = toYMD(new Date(row.uploaded_at));
    return uploadDate === latestUploadDate;
  };

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="opacity-30 ml-1">↕</span>;
    return sortDir === "asc"
      ? <ChevronUp size={12} className="inline ml-1" />
      : <ChevronDownIcon size={12} className="inline ml-1" />;
  };

  const thSortable = (label: string, col: SortKey) => (
    <th
      className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap cursor-pointer hover:bg-red-900 select-none"
      onClick={() => handleSort(col)}
    >
      {label}<SortIcon col={col} />
    </th>
  );

  const selectStyle = "px-3 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white";
  const selectBorder = { borderColor: "#E0E0E0" };
  const hasNonDefaultFilter =
    filterTanggal !== latestUploadDate ||
    filterSTO !== "Semua" ||
    filterStatus !== "Semua";

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold" style={{ color: "#800000" }}>Detail Fallout</h1>
        <p className="text-gray-500 text-sm">Menampilkan {filtered.length} dari {data.length} data</p>
      </div>

      {/* Legend badge baru */}
      {latestUploadDate && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl w-fit text-sm"
          style={{ backgroundColor: "#FFF5F5", border: "1px solid #FFCCCC" }}>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: "#800000" }}>BARU</span>
          <span className="text-gray-600">
            = Data yang diupload pada <strong>{formatDateToIndonesian(latestUploadDate)}</strong>
          </span>
        </div>
      )}

      {/* Tombol Kembali ke Data Terbaru — muncul hanya saat tanggal dipilih bukan terbaru */}
      {isNotLatest && (
        <div className="mb-4">
          <button
            onClick={goToLatest}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{
              backgroundColor: "#FFF5F5",
              border: "1px solid #FFCCCC",
              color: "#800000",
            }}
          >
            <RotateCcw size={14} />
            Kembali ke data terbaru
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">

      {/* Baris filter: Tanggal, STO, Status */}
        <div className="flex flex-wrap items-center gap-3 mb-3">

          {/* Date picker — gaya mirip rekap fallout */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Tanggal:</span>
            <input
              type="date"
              value={filterTanggal}
              onChange={(e) => setFilterTanggal(e.target.value)}
              className={selectStyle}
              style={{ ...selectBorder, minWidth: "160px" }}
              onFocus={(e) => { e.target.style.borderColor = "#800000"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E0E0E0"; }}
            />
          </div>

          {/* STO */}
          <select
            value={filterSTO}
            onChange={(e) => setFilterSTO(e.target.value)}
            className={selectStyle}
            style={selectBorder}
          >
            {STO_LIST.map((s) => <option key={s}>{s}</option>)}
          </select>

        </div>

        {/* Status pills + reset */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
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
        </div>

        {/* Info tanggal yang sedang ditampilkan */}
        <div className="mt-3 text-xs text-gray-400">
          {filterTanggal === ""
            ? "Menampilkan semua tanggal"
            : filterTanggal === latestUploadDate
              ? `Menampilkan data terbaru · ${formatDateToIndonesian(filterTanggal)}`
              : `Menampilkan data tanggal · ${formatDateToIndonesian(filterTanggal)}`
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
          <div className="text-center py-16">
            <AlertCircle size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">Tidak ada data ditemukan</p>
            <p className="text-gray-400 text-sm mt-1">Coba ubah filter pencarian</p>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ maxHeight: "600px", overflowY: "auto" }}>
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10">
                <tr style={{ backgroundColor: "#800000" }}>
                  <th className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap">No</th>
                  <th className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap">No/Order ID</th>
                  <th className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap">Deskripsi</th>
                  {thSortable("STO", "sto")}
                  {thSortable("Tgl Fallout", "tanggal")}
                  {thSortable("PIC", "pic")}
                  {thSortable("RESOLVED/ESKALASI", "resolved_eskalasi")}
                  {thSortable("Status", "status")}
                  <th className="px-3 py-3 text-left text-white font-semibold whitespace-nowrap">KET</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((row, i) => {
                  const isNew = isNewData(row);
                  return (
                    <tr
                      key={row.row_id}
                      style={{
                        backgroundColor: isNew
                          ? "#FFF0F0"
                          : i % 2 === 0 ? "#fff" : "#FFF5F5",
                        borderLeft: isNew ? "3px solid #800000" : "3px solid transparent",
                      }}
                    >
                      <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {(page - 1) * PER_PAGE + i + 1}
                          {isNew && (
                            <span
                              className="px-1.5 py-0.5 rounded-full text-white font-bold leading-none"
                              style={{ fontSize: "9px", backgroundColor: "#800000" }}
                            >
                              BARU
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ID */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span
                            className="text-gray-700 font-medium font-mono"
                            style={{ maxWidth: "130px", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}
                          >
                            {row.id?.length > 20 ? row.id.substring(0, 20) + "..." : row.id}
                          </span>
                          {row.id?.length > 20 && (
                            <button
                              onClick={() => setFullId(row.id)}
                              className="flex-shrink-0 p-1 rounded hover:bg-gray-100 transition-all"
                              style={{ color: "#800000" }}
                              title="Lihat ID lengkap"
                            >
                              <Eye size={12} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Deskripsi */}
                      <td className="px-3 py-2.5" style={{ maxWidth: "250px" }}>
                        <div className="flex items-start gap-1.5">
                          <span className="text-gray-600 line-clamp-2 leading-relaxed">{row.deskripsi}</span>
                          {row.deskripsi?.length > 60 && (
                            <button
                              onClick={() => setFullDesc(row.deskripsi)}
                              className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5"
                            >
                              <Eye size={13} />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{row.sto}</td>
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{row.tanggal}</td>
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap font-semibold">{row.pic}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: row.resolved_eskalasi === "RESOLVED" ? "#F0FFF4" : "#FFF0F0",
                            color: row.resolved_eskalasi === "RESOLVED" ? "#166534" : "#800000",
                          }}
                        >
                          {row.resolved_eskalasi}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: row.status === "COMPLETED" ? "#F0FFF4" : "#FFF9E6",
                            color: row.status === "COMPLETED" ? "#166534" : "#92400E",
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{row.ket}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
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

      {/* Modal Full ID */}
      {fullId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setFullId(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">No/Order ID Lengkap</h3>
              <button onClick={() => setFullId(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-700 break-all leading-relaxed">{fullId}</p>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(fullId); }}
              className="mt-4 w-full py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
              style={{ background: GRADIENT }}
            >
              Copy ID
            </button>
          </div>
        </div>
      )}

      {/* Modal Full Deskripsi */}
      {fullDesc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setFullDesc(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Deskripsi Lengkap</h3>
              <button onClick={() => setFullDesc(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-700 break-all leading-relaxed">{fullDesc}</p>
            </div>
            <button
              onClick={() => setFullDesc(null)}
              className="mt-4 w-full py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
              style={{ background: GRADIENT }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}