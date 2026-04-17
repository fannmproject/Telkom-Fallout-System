import React, { useState, useRef } from "react";
import {
  Upload, FileText, CheckCircle2, X,
  AlertCircle, FileSpreadsheet, AlertTriangle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
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

const GRADIENT = "linear-gradient(to right, #360000, #800000)";
const CHUNK_SIZE = 200;

const excelSerialToIndonesian = (serial: any): string => {
  if (!serial) return "";
  const num = Number(serial);
  if (!isNaN(num) && num > 40000 && num < 60000) {
    const date = new Date(Math.round((num - 25569) * 86400 * 1000));
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ];
    return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  }
  return String(serial).trim();
};

const slashDateToIndonesian = (tanggal: string): string => {
  if (!tanggal || !tanggal.includes("/")) return tanggal;
  const parts = tanggal.split("/");
  if (parts.length !== 3) return tanggal;
  const months = [
    "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  // Deteksi otomatis format MM/DD/YYYY vs DD/MM/YYYY
  // Kalau parts[0] > 12, pasti hari (DD/MM/YYYY)
  // Kalau parts[1] > 12, pasti bulan di parts[0] (MM/DD/YYYY)
  let day: number, month: number;
  const p0 = parseInt(parts[0]);
  const p1 = parseInt(parts[1]);
  if (p0 > 12) {
    // Pasti DD/MM/YYYY
    day = p0; month = p1;
  } else if (p1 > 12) {
    // Pasti MM/DD/YYYY
    month = p0; day = p1;
  } else {
    // Ambigu — asumsikan DD/MM/YYYY (format Indonesia)
    day = p0; month = p1;
  }
  const year = parts[2].length === 2 ? "20" + parts[2] : parts[2];
  if (month >= 1 && month <= 12) return `${day} ${months[month]} ${year}`;
  return tanggal;
};

export default function UploadDataPage() {
  const { user } = useAuth();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<FalloutRow[]>([]);
  const [preview, setPreview] = useState<FalloutRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState<{ total: number; baru: number; update: number } | null>(null);
  const [error, setError] = useState("");
  const [dupWarning, setDupWarning] = useState(false);
  const [dupInfo, setDupInfo] = useState({ dupCount: 0, newCount: 0 });
  const [maxUploadWarning, setMaxUploadWarning] = useState(false);
  const [existingBatchCount, setExistingBatchCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Parser Excel ────────────────────────────────────────────────
  const parseExcel = (f: File): Promise<FalloutRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array", raw: true, dense: true });
          const sheetName =
            workbook.SheetNames.find((n) => n.toUpperCase() === "ALL") ||
            workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, {
            header: 1, raw: true, defval: "",
          }) as any[][];

          let startRow = 1;
          for (let i = 0; i < Math.min(5, rows.length); i++) {
            const row = rows[i];
            if (row && row[0] && String(row[0]).trim() !== "" &&
              !String(row[0]).toLowerCase().includes("sc") &&
              !String(row[0]).toLowerCase().includes("no")) {
              startRow = i; break;
            }
          }

          const result: FalloutRow[] = [];
          for (let i = startRow; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !row[0] || String(row[0]).trim() === "") continue;
            const id = String(row[0]).trim();
            if (
              id.toLowerCase().includes("order") ||
              id.toLowerCase().includes("no/") ||
              id.toLowerCase() === "sc"
            ) continue;

            let tanggal = "";
            const rawTanggal = row[3];
            if (rawTanggal !== undefined && rawTanggal !== "") {
              const strTanggal = String(rawTanggal).trim();
              tanggal = strTanggal.includes("/")
                ? slashDateToIndonesian(strTanggal)
                : excelSerialToIndonesian(rawTanggal);
            }

            let status = String(row[6] || "").trim();
            if (status.startsWith("=") || status === "") status = "Process OSS (Provision Issued)";

            let ket = String(row[7] || "").trim();
            if (ket.startsWith("=") || ket === "") ket = row[25] ? String(row[25]).substring(0, 4) : "";

            result.push({
              id,
              deskripsi: String(row[1] || "").trim(),
              sto: String(row[2] || "").trim(),
              tanggal,
              pic: String(row[4] || "").trim(),
              resolved_eskalasi: String(row[5] || "").trim(),
              status,
              ket,
            });
          }

          if (result.length === 0) reject(new Error("Tidak ada data yang bisa dibaca."));
          else resolve(result);
        } catch (err) { reject(err); }
      };
      reader.onerror = () => reject(new Error("Gagal membaca file."));
      reader.readAsArrayBuffer(f);
    });
  };

  // ── Parser CSV ──────────────────────────────────────────────────
  const parseCSV = (f: File): Promise<FalloutRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split("\n").filter(Boolean);
          const result: FalloutRow[] = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
            if (!cols[0]) continue;
            result.push({
              id: cols[0], deskripsi: cols[1] || "", sto: cols[2] || "",
              tanggal: cols[3] || "", pic: cols[4] || "",
              resolved_eskalasi: cols[5] || "", status: cols[6] || "", ket: cols[7] || "",
            });
          }
          resolve(result);
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsText(f);
    });
  };

  const handleFile = async (selectedFile: File) => {
    setError(""); setPreview([]); setParsedRows([]);
    setFile(selectedFile); setUploadDone(null); setParsing(true);
    try {
      const rows = selectedFile.name.endsWith(".csv")
        ? await parseCSV(selectedFile)
        : await parseExcel(selectedFile);

      const deduped = Array.from(new Map(rows.map((r) => [r.id, r])).values());
      setParsedRows(deduped);
      setPreview(deduped.slice(0, 5));
    } catch {
      setError("Gagal membaca file. Pastikan format file benar.");
      setFile(null);
    }
    setParsing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && [".csv", ".xlsx", ".xls"].some((ext) => dropped.name.endsWith(ext))) {
      handleFile(dropped);
    } else {
      setError("Format file tidak didukung. Gunakan CSV atau Excel (.xlsx/.xls)");
    }
  };

  // ── Cek duplikat ────────────────────────────────────────────────
  const checkDuplicates = async (rows: FalloutRow[]): Promise<number> => {
    const ids = rows.map((r) => r.id);
    let foundCount = 0;
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500);
      const { data, error } = await supabase.from("fallout_data").select("id").in("id", chunk);
      if (error) throw error;
      foundCount += (data?.length || 0);
    }
    return foundCount;
  };

  // ── Upsert ke DB (tanpa shift) ──────────────────────────────────
  const doUpsert = async (rows: FalloutRow[]) => {
    const batchId = crypto.randomUUID();
    const tanggalData = rows[0]?.tanggal || "-";
    const picData = rows[0]?.pic || "-";

    // Insert ke upload_batches — tanpa kolom shift
    const { error: batchError } = await supabase.from("upload_batches").insert({
      batch_id: batchId,
      tanggal: tanggalData,
      pic: picData,
      total_data: rows.length,
      uploaded_by: user?.id || null,
    });
    if (batchError) throw batchError;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE).map((row) => ({
        batch_id: batchId,
        id: row.id,
        deskripsi: row.deskripsi,
        sto: row.sto,
        tanggal: row.tanggal,
        pic: row.pic,
        resolved_eskalasi: row.resolved_eskalasi,
        status: row.status,
        ket: row.ket,
        uploaded_by: user?.id || null,
      }));
      const { error: upsertError } = await supabase
        .from("fallout_data")
        .upsert(chunk, { onConflict: "id", ignoreDuplicates: false });
      if (upsertError) throw upsertError;
    }
  };

  // ── Upload utama ────────────────────────────────────────────────
  const handleUpload = async (forceUpload = false) => {
    if (!file || parsedRows.length === 0) return;
    setUploading(true); setError(""); setDupWarning(false); setMaxUploadWarning(false);

    try {
      const tanggalData = parsedRows[0]?.tanggal || "-";

      // ── Cek max 2 upload per tanggal ─────────────────────────────
      if (!forceUpload) {
        const { data: batchCek } = await supabase
          .from("upload_batches")
          .select("batch_id")
          .eq("tanggal", tanggalData);
        const count = batchCek?.length || 0;
        if (count >= 2) {
          setExistingBatchCount(count);
          setUploading(false);
          setMaxUploadWarning(true);
          return;
        }
      }

      const dupCount = await checkDuplicates(parsedRows);
      const newCount = parsedRows.length - dupCount;

      if (!forceUpload && dupCount > 0 && newCount === 0) {
        setDupInfo({ dupCount, newCount });
        setUploading(false);
        setDupWarning(true);
        return;
      }

      await doUpsert(parsedRows);

      setUploadDone({ total: parsedRows.length, baru: newCount, update: dupCount });
      setFile(null); setParsedRows([]); setPreview([]);
      setTimeout(() => setUploadDone(null), 8000);
    } catch (err: any) {
      setError(`Gagal upload: ${err.message || "Silakan coba lagi."}`);
    }
    setUploading(false);
  };

  const resetFile = () => { setFile(null); setParsedRows([]); setPreview([]); setError(""); };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: "#800000" }}>Upload Data</h1>
        <p className="text-gray-500 text-sm">Unggah file rekap fallout (Excel)</p>
      </div>

      {/* Success Banner */}
      {uploadDone && (
        <div className="mb-5 flex items-start gap-3 px-5 py-4 rounded-xl"
          style={{ backgroundColor: "#F0FFF4", border: "1px solid #86EFAC" }}>
          <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-700 font-semibold text-sm">
              Upload berhasil! — {uploadDone.total} data diproses
            </p>
            <p className="text-green-600 text-xs mt-0.5">
              {uploadDone.baru > 0 && <span>{uploadDone.baru} data baru ditambahkan</span>}
              {uploadDone.baru > 0 && uploadDone.update > 0 && <span> · </span>}
              {uploadDone.update > 0 && <span>{uploadDone.update} data diperbarui</span>}
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-5 flex items-center gap-3 px-5 py-4 rounded-xl"
          style={{ backgroundColor: "#FFF0F0", border: "1px solid #FFCCCC" }}>
          <AlertCircle size={20} style={{ color: "#800000" }} />
          <p className="text-sm font-medium" style={{ color: "#800000" }}>{error}</p>
        </div>
      )}

      {/* Modal Max Upload Per Tanggal */}
      {maxUploadWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#FFF7ED" }}>
                <AlertTriangle size={20} style={{ color: "#92400E" }} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Batas upload tercapai!</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tanggal ini sudah diupload <strong>{existingBatchCount}x</strong> (maksimal 2x per hari).
                </p>
              </div>
            </div>
            <div className="rounded-xl p-4 mb-5"
              style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}>
              <p className="text-xs text-amber-700 leading-relaxed">
                Jika data ini memang perlu diupload (misalnya ada koreksi), pilih <strong>Upload Tetap</strong>.<br />
                Data yang ID-nya sama akan diperbarui, data baru akan ditambahkan.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setMaxUploadWarning(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-gray-50"
                style={{ borderColor: "#E0E0E0", color: "#666" }}>
                Batal
              </button>
              <button onClick={() => handleUpload(true)}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90"
                style={{ background: GRADIENT }}>
                Upload Tetap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Duplikat */}
      {dupWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#FFF7ED" }}>
                <AlertTriangle size={20} style={{ color: "#92400E" }} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">File ini sepertinya sudah pernah diupload</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Semua <strong>{dupInfo.dupCount} data</strong> di file ini sudah ada di database.
                </p>
              </div>
            </div>
            <div className="rounded-xl p-4 mb-5"
              style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}>
              <p className="text-sm text-amber-800 font-medium mb-1">Pilih tindakan:</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                • <strong>Upload Tetap</strong>: data lama akan diperbarui dengan data dari file ini.<br />
                • <strong>Batal</strong>: tidak ada yang berubah di database.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDupWarning(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-gray-50"
                style={{ borderColor: "#E0E0E0", color: "#666" }}>
                Batal
              </button>
              <button onClick={() => handleUpload(true)}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90"
                style={{ background: GRADIENT }}>
                Upload Tetap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      {!file && !parsing && (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className="border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all"
          style={{
            borderColor: dragging ? "#800000" : "#FFCCCC",
            backgroundColor: dragging ? "#FFF5F5" : "#FFFAFA",
          }}
        >
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            className="hidden" />
          <Upload size={44} className="mx-auto mb-4" style={{ color: "#800000", opacity: 0.5 }} />
          <p className="font-bold text-gray-700 text-base mb-1">Drag and Drop Files Here</p>
          <p className="text-gray-400 text-sm mb-3">Or click to select a file</p>
        </div>
      )}

      {/* Parsing loading */}
      {parsing && (
        <div className="border-2 border-dashed rounded-2xl p-14 text-center"
          style={{ borderColor: "#FFCCCC", backgroundColor: "#FFFAFA" }}>
          <svg className="animate-spin w-10 h-10 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#800000" strokeWidth="4" />
            <path className="opacity-75" fill="#800000" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-600 font-semibold text-sm">Membaca file...</p>
          <p className="text-gray-400 text-xs mt-1">Mohon tunggu sebentar</p>
        </div>
      )}

      {/* File Info + Preview */}
      {file && !parsing && !uploading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {file.name.endsWith(".csv")
                ? <FileText size={32} style={{ color: "#800000" }} />
                : <FileSpreadsheet size={32} style={{ color: "#800000" }} />}
              <div>
                <p className="font-semibold text-gray-800 text-sm">{file.name}</p>
                <p className="text-gray-400 text-xs">
                  {formatSize(file.size)} · <span style={{ color: "#800000", fontWeight: 600 }}>{parsedRows.length} baris data</span>
                </p>
              </div>
            </div>
            <button onClick={resetFile}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
              <X size={18} />
            </button>
          </div>

          {preview.length > 0 && (
            <>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                Preview 5 baris pertama
              </p>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ backgroundColor: "#800000" }}>
                      {["No/Order ID", "Deskripsi", "STO", "Tgl Fallout", "PIC", "Status", "KET"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-white font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#FFF5F5" }}>
                        <td className="px-3 py-2 text-gray-700 font-mono whitespace-nowrap"
                          style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {row.id}
                        </td>
                        <td className="px-3 py-2 text-gray-600 max-w-xs truncate">{row.deskripsi}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{row.sto}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{row.tanggal}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{row.pic}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: row.resolved_eskalasi === "RESOLVED" ? "#F0FFF4" : "#FFF0F0",
                              color: row.resolved_eskalasi === "RESOLVED" ? "#166534" : "#800000",
                            }}>
                            {row.resolved_eskalasi}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{row.ket}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 5 && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  ...dan {parsedRows.length - 5} baris lainnya
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Uploading state */}
      {uploading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 mb-5 text-center">
          <svg className="animate-spin w-10 h-10 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#800000" strokeWidth="4" />
            <path className="opacity-75" fill="#800000" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-700 font-semibold text-sm">Mengupload {parsedRows.length} data...</p>
          <p className="text-gray-400 text-xs mt-1">Mohon tunggu, jangan tutup halaman ini</p>
        </div>
      )}

      {/* Upload Button */}
      {file && !parsing && !uploading && (
        <button
          onClick={() => handleUpload(false)}
          className="w-full py-4 rounded-xl text-white font-bold text-base transition-all hover:opacity-90 flex items-center justify-center gap-2"
          style={{ background: GRADIENT }}
        >
          <Upload size={18} />
          Upload {parsedRows.length} Data
        </button>
      )}
    </div>
  );
}