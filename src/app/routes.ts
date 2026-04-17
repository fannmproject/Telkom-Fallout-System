import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardLayout from "./pages/DashboardLayout";
import TotalRekapPage from "./pages/TotalRekapPage";
import DataRekapPage from "./pages/DataRekapPage";
import DetailFalloutPage from "./pages/DetailFalloutPage";
import UploadDataPage from "./pages/UploadDataPage";
import EditDataPage from "./pages/EditDataPage";
import ExportPage from "./pages/ExportPage";
import PublicRekapPage from "./pages/PublicRekapPage";
import ArsipandDeletePage from "./pages/ArsipandDeletePage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/rekap-fallout",
    Component: PublicRekapPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    path: "/forgot-password",
    Component: ForgotPasswordPage,
  },
  {
    path: "/reset-password",
    Component: ResetPasswordPage,
  },
  {
    path: "/dashboard",
    Component: DashboardLayout,
    children: [
      { index: true, Component: TotalRekapPage },
      { path: "rekap", Component: DataRekapPage },
      { path: "detail-fallout", Component: DetailFalloutPage },
      { path: "upload", Component: UploadDataPage },
      { path: "edit", Component: EditDataPage },
      { path: "export", Component: ExportPage },
      { path: "arsip", Component: ArsipandDeletePage },
    ],
  },
]);