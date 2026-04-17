import React, { useState } from "react";
import { Outlet, useNavigate, useLocation, Navigate } from "react-router";
import { TelkomLogo } from "../components/TelkomLogo";
import { useAuth } from "../context/AuthContext";
import {
  BarChart3,
  FileText,
  Search,
  Upload,
  Edit3,
  Download,
  FileSpreadsheet,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  Archive,
} from "lucide-react";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface MenuGroup {
  group: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    group: "Data Rekap",
    items: [
      { label: "Total Rekap", icon: <BarChart3 size={17} />, path: "/dashboard" },
      { label: "Detail Fallout", icon: <Search size={17} />, path: "/dashboard/detail-fallout" },
    ],
  },
  {
    group: "Manajemen Data",
    items: [
      { label: "Upload Data", icon: <Upload size={17} />, path: "/dashboard/upload" },
      { label: "Edit Data", icon: <Edit3 size={17} />, path: "/dashboard/edit" },
      { label: "Arsip & Hapus", icon: <Archive size={17} />, path: "/dashboard/arsip" },
    ],
  },
  {
    group: "Export",
    items: [
      { label: "Export Data", icon: <Download size={17} />, path: "/dashboard/export" },
    ],
  },
];

export default function DashboardLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Data Rekap": true,
    "Manajemen Data": true,
    "Export": false,
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const GRADIENT = "linear-gradient(to right, #360000, #800000)";
  const SIDEBAR_GRADIENT = "linear-gradient(to bottom, #360000, #800000)";

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: SIDEBAR_GRADIENT }}>
      {/* Logo */}
      <div className="px-5 py-6 border-b border-red-700 flex items-center gap-3">
        <TelkomLogo size={38} withBg />
        <div>
          <p className="text-white font-extrabold text-sm leading-tight">Telkom</p>
          <p className="text-red-200 text-xs leading-tight">Fallout Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-1">
        {menuGroups.map((group) => (
          <div key={group.group} className="mb-1">
            <button
              onClick={() => toggleGroup(group.group)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-red-200 hover:text-white hover:bg-red-800 transition-all text-xs font-bold uppercase tracking-wider"
            >
              <span>{group.group}</span>
              {openGroups[group.group] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>

            {openGroups[group.group] && (
              <div className="mt-1 space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setMobileSidebar(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                      style={{
                        backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "transparent",
                        color: isActive ? "white" : "rgba(255,200,200,0.85)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.1)";
                          (e.currentTarget as HTMLButtonElement).style.color = "white";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                          (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,200,200,0.85)";
                        }
                      }}
                    >
                      <span style={{ opacity: isActive ? 1 : 0.8 }}>{item.icon}</span>
                      {item.label}
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="px-3 py-4 border-t border-red-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-200 hover:text-white hover:bg-red-900 transition-all text-sm font-semibold"
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex flex-col flex-shrink-0 transition-all duration-300 ${sidebarOpen ? "w-64" : "w-0 overflow-hidden"}`}
      >
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebar && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileSidebar(false)} />
          <div className="relative z-10 w-64 h-full shadow-2xl">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header
          className="flex items-center justify-between px-5 py-3.5 shadow-sm flex-shrink-0"
          style={{ background: GRADIENT }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSidebarOpen(!sidebarOpen); setMobileSidebar(!mobileSidebar); }}
              className="text-white hover:bg-red-700 p-2 rounded-lg transition-all"
            >
              <Menu size={20} />
            </button>
            <div>
              <span className="text-white font-bold text-sm">Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-3 px-4 py-2 rounded-lg"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: "white", color: "#800000" }}
              >
                {user?.namaLengkap?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-tight">{user?.namaLengkap}</p>
                <p className="text-red-200 text-xs leading-tight">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}