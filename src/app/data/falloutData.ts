// ─── Tipe Data Fallout ─────────────────────────────────────────────────────────
export interface FalloutRecord {
  id: string;               // No/Order ID
  deskripsi: string;        // Full description (Provisioning Failed|UIM|INF...|error)
  sto: string;              // STO code (TBE, JAG, KBY, BIN, KAL, PSM, CPE)
  tanggal: string;          // Tanggal Fallout
  pic: string;              // Person In Charge
  resolvedEskalasi: string; // RESOLVED / ESKALASI
  status: string;           // Process OSS (Provision Issued) / COMPLETED / etc.
  ket: string;              // Keterangan / error code singkat
}

// ─── Data Rekap Fallout – 10 Maret 2026 ────────────────────────────────────────
export const FALLOUT_DATA: FalloutRecord[] = [
  {
    id: "1-46163979143",
    deskripsi: "Provisioning Failed|UIM|INF007497749|OSM java.lang.NullPointerException Failure Task : UpdateBITask",
    sto: "TBE",
    tanggal: "10/03/2026",
    pic: "FACHRI",
    resolvedEskalasi: "RESOLVED",
    status: "Process OSS (Provision Issued)",
    ket: "OSM java.lang.NullPointerException Failure Task : UpdateBITask",
  },
  {
    id: "1-44950853775",
    deskripsi: "Provisioning Failed|UIM|INF007497764|OSM java.lang.NullPointerException Failure Task : UpdateBITask",
    sto: "JAG",
    tanggal: "10/03/2026",
    pic: "FACHRI",
    resolvedEskalasi: "RESOLVED",
    status: "Process OSS (Provision Issued)",
    ket: "OSM java.lang.NullPointerException Failure Task : UpdateBITask",
  },
  {
    id: "1-45881654131",
    deskripsi: "Provisioning Failed|UIM|INF007471202|OSM Index: 0, Size: 0 Failure Task : WIFIUIMPopulateServiceInfoTask",
    sto: "TBE",
    tanggal: "10/03/2026",
    pic: "FACHRI",
    resolvedEskalasi: "RESOLVED",
    status: "Process OSS (Provision Issued)",
    ket: "OSM Index: 0, Size: 0 Failure Task : WIFIUIMPopulateServiceInfoTask",
  },
  {
    id: "DGPS260309194701318573346",
    deskripsi: "Provisioning Failed|UIM|INF007497784|1007:Unable to locate service port ODP-TBE-FEG/108 FEG/D10/108.01",
    sto: "TBE",
    tanggal: "10/03/2026",
    pic: "FACHRI",
    resolvedEskalasi: "RESOLVED",
    status: "Process OSS (Provision Issued)",
    ket: "1007: Unable to locate service port ODP-TBE-FEG/108 FEG/D10/108.01",
  },
  {
    id: "V1CIUC8IFSL62MXHL8E8ESGCG",
    deskripsi: "Provisioning Failed|UIM|INF007497947|1038: Mandatory parameter Network_ID of CPE is missing for : 1-P9X4KYN_122207495753_INTERNET",
    sto: "BIN",
    tanggal: "10/03/2026",
    pic: "FACHRI",
    resolvedEskalasi: "RESOLVED",
    status: "Process OSS (Provision Issued)",
    ket: "1038: Mandatory parameter Network_ID of CPE is missing for : 1-P9X4KYN_122207495753_INTERNET",
  },
  {
    id: "PLOFURDQTCL7JF9I2WO16CHWS",
    deskripsi: "Provisioning Failed|UIM|INF007497809|1057:Service_Port is missing for 58722930_122217256512_INTERNET",
    sto: "KAL",
    tanggal: "10/03/2026",
    pic: "FACHRI",
    resolvedEskalasi: "RESOLVED",
    status: "Process OSS (Provision Issued)",
    ket: "1057: Service_Port is missing for 58722930_122217256512_INTERNET",
  },
  {
    id: "V9BZOCPTA8U768TB0O9844I6R",
    deskripsi: "Provisioning Failed|UIM|INF007497836|An error occurred while calling process interaction.",
    sto: "BIN",
    tanggal: "10/03/2026",
    pic: "FACHRI",
    resolvedEskalasi: "RESOLVED",
    status: "Process OSS (Provision Issued)",
    ket: "An error occurred while calling process interaction.",
  },
  {
    id: "FAXQ9ESHTD2WN157JE5W5N45A",
    deskripsi: "Provisioning Failed|UIM|INF007492257|The Inventory item (id=1706529918) has a configuration that is associated to another BI (id=4142496829). The configuration is not in a completed or canceled state.",
    sto: "KBY",
    tanggal: "10/03/2026",
    pic: "FACHRI",
    resolvedEskalasi: "RESOLVED",
    status: "Process OSS (Provision Issued)",
    ket: "The Inventory item (id=1706529918) has a configuration associated to another BI (id=4142496829) — not in completed or canceled state.",
  },
  {
    id: "F4ZADJYGCFSR9PF72JK52MW81",
    deskripsi: "Provisioning Failed|UIM|INF007500006|Disconnect of 4696122_0217868155_VOICE_RFS is not allowed as configuration is not in Completed or Canceled state.",
    sto: "JAG",
    tanggal: "10/03/2026",
    pic: "FACHRI",
    resolvedEskalasi: "RESOLVED",
    status: "Process OSS (Provision Issued)",
    ket: "Disconnect of 4696122_0217868155_VOICE_RFS is not allowed — configuration not in Completed or Canceled state.",
  },
  {
    id: "DGPS260310104944979838357",
    deskripsi: "Provisioning Failed|UIM|INF007501168|1008:Unable to locate service port target GPON11-D2-TBE-3(172.28.118.224)",
    sto: "TBE",
    tanggal: "10/03/2026",
    pic: "FACHRI",
    resolvedEskalasi: "RESOLVED",
    status: "Process OSS (Provision Issued)",
    ket: "1008: Unable to locate service port target GPON11-D2-TBE-3(172.28.118.224)",
  },
  {
    id: "73F7TWJ68BCUXOSKLWAA34VY4",
    deskripsi: "Provisioning Failed|UIM|INF007501313|1038: Mandatory parameter Network_ID of CPE is missing for : 1-L3QH5J0_121202272313_INTERNET",
    sto: "KBY",
    tanggal: "10/03/2026",
    pic: "FACHRI",
    resolvedEskalasi: "RESOLVED",
    status: "Process OSS (Provision Issued)",
    ket: "1038: Mandatory parameter Network_ID of CPE is missing for : 1-L3QH5J0_121202272313_INTERNET",
  },
  {
    id: "W2WIRNRXK5EU1QYLCI9O7CDJT",
    deskripsi: "Provisioning Failed|UIM|INF007500695|1035: Service 3-4NAWKTEB_121202254274_INTERNET not found for action Modify",
    sto: "KBY",
    tanggal: "10/03/2026",
    pic: "FACHRI",
    resolvedEskalasi: "RESOLVED",
    status: "Process OSS (Provision Issued)",
    ket: "1035: Service 3-4NAWKTEB_121202254274_INTERNET not found for action Modify",
  },
  {
    id: "B4DQY7FS8AFNU86BHZZU3R4NM",
    deskripsi: "Provisioning Failed|UIM|INF007501057|oracle.communications.inventory.api.framework.security.UserContextData cannot be cast to oracle.communications.inventory.api.framework.security.UserContextData",
    sto: "PSM",
    tanggal: "10/03/2026",
    pic: "FACHRI",
    resolvedEskalasi: "RESOLVED",
    status: "Process OSS (Provision Issued)",
    ket: "oracle.communications.inventory...UserContextData cannot be cast to UserContextData",
  },
  {
    id: "I457FUVE240FZFNSZ60BXAPOL",
    deskripsi: "Provisioning Failed|UIM|INF007501202|1060:CPE is missing for 1-LIMIIOP_121105259865_INTERNET",
    sto: "TBE",
    tanggal: "10/03/2026",
    pic: "FACHRI",
    resolvedEskalasi: "RESOLVED",
    status: "Process OSS (Provision Issued)",
    ket: "1060: CPE is missing for 1-LIMIIOP_121105259865_INTERNET",
  },
  {
    id: "90CR0DWG35WIUKWJNJ5NONACF",
    deskripsi: "Provisioning Failed|UIM|INF007501515|240041Configuration Item CPE is already in De-Referenced state.",
    sto: "KAL",
    tanggal: "10/03/2026",
    pic: "FACHRI",
    resolvedEskalasi: "RESOLVED",
    status: "COMPLETED",
    ket: "240041: Configuration Item CPE is already in De-Referenced state.",
  },
  {
    id: "67ESATGI6U631XF9QQOBBTUYY",
    deskripsi: "Provisioning Failed|UIM|INF007502701|1057:Service_Port is missing for 66053895_122219254722_INTERNET",
    sto: "JAG",
    tanggal: "10/03/2026",
    pic: "FACHRI",
    resolvedEskalasi: "RESOLVED",
    status: "Process OSS (Provision Issued)",
    ket: "1057: Service_Port is missing for 66053895_122219254722_INTERNET",
  },
  {
    id: "C49SPXMAV8CBBPY4MMT8FYA4O",
    deskripsi: "Provisioning Failed|UIM|INF007502895|oracle.communications.inventory.api.framework.security.UserContextData cannot be cast to oracle.communications.inventory.api.framework.security.UserContextData",
    sto: "TBE",
    tanggal: "10/03/2026",
    pic: "FACHRI",
    resolvedEskalasi: "RESOLVED",
    status: "Process OSS (Provision Issued)",
    ket: "oracle.communications.inventory...UserContextData cannot be cast to UserContextData",
  },
  {
    id: "FKZ7M96O3N4JHJZ3TOIFMJ4WY",
    deskripsi: "Provisioning Failed|UIM|INF007502818|1038: Mandatory parameter Network_ID of CPE is missing for : 68908196_122207489016_INTERNET",
    sto: "BIN",
    tanggal: "10/03/2026",
    pic: "FACHRI",
    resolvedEskalasi: "RESOLVED",
    status: "Process OSS (Provision Issued)",
    ket: "1038: Mandatory parameter Network_ID of CPE is missing for : 68908196_122207489016_INTERNET",
  },
  {
    id: "1002298474",
    deskripsi: "Provisioning Failed|UIM|INF007497801|Disconnect of 32365735_02127811101_VOICE_RFS is not allowed as configuration is not in Completed or Canceled state.",
    sto: "CPE",
    tanggal: "10/03/2026",
    pic: "FACHRI",
    resolvedEskalasi: "RESOLVED",
    status: "Process OSS (Provision Issued)",
    ket: "Disconnect of 32365735_02127811101_VOICE_RFS is not allowed — configuration not in Completed or Canceled state.",
  },
  {
    id: "1002298758",
    deskripsi: "Provisioning Failed|UIM|INF007498767|Disconnect of 69020260_121202274073_INTERNET_RFS is not allowed as configuration is not in Completed or Canceled state.",
    sto: "KBY",
    tanggal: "10/03/2026",
    pic: "FACHRI",
    resolvedEskalasi: "RESOLVED",
    status: "Process OSS (Provision Issued)",
    ket: "Disconnect of 69020260_121202274073_INTERNET_RFS is not allowed — configuration not in Completed or Canceled state.",
  },
];

// ─── Helper: hitung per-STO ─────────────────────────────────────────────────
export const STO_STATS = Object.entries(
  FALLOUT_DATA.reduce<Record<string, number>>((acc, r) => {
    acc[r.sto] = (acc[r.sto] || 0) + 1;
    return acc;
  }, {})
).map(([sto, fallout]) => ({ sto, fallout }));

// ─── Helper: hitung per-status ─────────────────────────────────────────────
export const STATUS_STATS = {
  resolved: FALLOUT_DATA.filter((r) => r.resolvedEskalasi === "RESOLVED").length,
  eskalasi: FALLOUT_DATA.filter((r) => r.resolvedEskalasi === "ESKALASI").length,
  completed: FALLOUT_DATA.filter((r) => r.status === "COMPLETED").length,
  processOSS: FALLOUT_DATA.filter((r) => r.status !== "COMPLETED").length,
};
