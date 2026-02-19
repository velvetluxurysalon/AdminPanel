import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { AuthContext } from "./context/AuthContext";
import "./admin-panel.css";
// @ts-ignore
import Login from "./pages/Login";
// @ts-ignore
import AdminRegistration from "./pages/AdminRegistration";
// @ts-ignore
import Dashboard from "./pages/Dashboard";
// @ts-ignore
import Reception from "./pages/Reception";
// @ts-ignore
import Appointments from "./pages/Appointments";
// @ts-ignore
import Services from "./pages/Services";
// @ts-ignore
import Customers from "./pages/Customers";
// @ts-ignore
import Billing from "./pages/Billing";
// @ts-ignore
import VisitDetail from "./pages/VisitDetail";
// @ts-ignore
import Staff from "./pages/Staff";
// @ts-ignore
import StaffSalaryAnalytics from "./pages/StaffSalaryAnalytics";
// @ts-ignore
import Products from "./pages/Products";
// @ts-ignore
import Loyalty from "./pages/Loyalty";
// @ts-ignore
import Attendance from "./pages/Attendance";
// @ts-ignore
import HeroContent from "./pages/HeroContent";
// @ts-ignore
import ContactContent from "./pages/ContactContent";
// @ts-ignore
import GalleryContent from "./pages/GalleryContent";
// @ts-ignore
import ReviewsManagement from "./pages/ReviewsManagement";
// @ts-ignore
import FAQsContent from "./pages/FAQsContent";
// @ts-ignore
import OffersContent from "./pages/OffersContent";
// @ts-ignore
import NewsletterContent from "./pages/NewsletterContent";
// @ts-ignore
import MembershipManagement from "./pages/Membership";
// @ts-ignore
import AccountCreation from "./pages/AccountCreation";
// @ts-ignore
import ReceptionistManagement from "./pages/ReceptionistManagement";
// @ts-ignore
import Coupons from "./pages/Coupons";
// @ts-ignore
import AppointmentNotification from "./components/AppointmentNotification";
// @ts-ignore
import { usePendingAppointments } from "./hooks/usePendingAppointments";
import {
  Scissors,
  LogOut,
  Users,
  ClipboardList,
  BarChart3,
  Package,
  UserCog,
  Menu,
  X,
  Gift,
  Star,
  Clock,
  FileText,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  Award,
  Settings,
  Tag,
} from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  user: any;
  loading: boolean;
}

// Protected Route Wrapper
const ProtectedRoute = ({ children, user, loading }: ProtectedRouteProps) => {
  if (loading)
    return (
      <div className="admin-panel loading-overlay">
        <div
          className="loading-spinner"
          style={{ width: 40, height: 40, borderWidth: 3 }}
        ></div>
      </div>
    );
  return user ? <>{children}</> : <Navigate to="/admin/login" />;
};

interface NavItem {
  path: string;
  icon: any;
  label: string;
  submenu?: { path: string; label: string }[];
}

const DashboardLayout = () => {
  const location = useLocation();
  const { userRole } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const pendingCount = usePendingAppointments();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "/admin/login";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Define navigation items - all items available
  const allNavItems: NavItem[] = [
    { path: "/admin", icon: ClipboardList, label: "Reception" },
    { path: "/admin/appointments", icon: Calendar, label: "Appointments" },
    { path: "/admin/dashboard", icon: BarChart3, label: "Dashboard" },
    { path: "/admin/services", icon: Scissors, label: "Services" },
    { path: "/admin/staff", icon: UserCog, label: "Staff" },
    { path: "/admin/salary-analytics", icon: DollarSign, label: "Payroll" },
    { path: "/admin/products", icon: Package, label: "Inventory" },
    { path: "/admin/customers", icon: Users, label: "Customers" },
    { path: "/admin/attendance", icon: Clock, label: "Attendance" },
    { path: "/admin/loyalty", icon: Gift, label: "Loyalty" },
    { path: "/admin/memberships", icon: Award, label: "Memberships" },
    { path: "/admin/coupons", icon: Tag, label: "Coupons" },
    { path: "/admin/hero", icon: FileText, label: "Hero Section" },
    { path: "/admin/gallery", icon: FileText, label: "Gallery" },
    { path: "/admin/reviews", icon: Star, label: "Reviews" },
    { path: "/admin/faqs", icon: FileText, label: "FAQs" },
    { path: "/admin/offers", icon: Gift, label: "Special Offers" },
    { path: "/admin/newsletter", icon: Mail, label: "Newsletter" },
    { path: "/admin/contact", icon: Phone, label: "Contact Info" },
  ];

  // Admin-only items
  const adminOnlyItems: NavItem[] = [
    { path: "/admin/accounts", icon: Settings, label: "Accounts" },
    { path: "/admin/receptionists", icon: Users, label: "Receptionists" },
  ];

  // Receptionist hidden items (should not be visible)
  const receptionistHiddenPaths = [
    "/admin/dashboard",
    "/admin/salary-analytics",
    "/admin/customers",
    "/admin/hero",
    "/admin/gallery",
    "/admin/reviews",
    "/admin/faqs",
    "/admin/offers",
    "/admin/newsletter",
    "/admin/contact",
  ];

  // Filter navigation items based on user role
  // Default to admin view if role is still loading/not set (will update when role is fetched)
  const filteredNavItems =
    userRole === "admin" || !userRole
      ? [...allNavItems, ...adminOnlyItems]
      : allNavItems.filter(
          (item) => !receptionistHiddenPaths.includes(item.path),
        );

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="layout">
      {/* Header */}
      <div className="mobile-header">
        <div className="header-left">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mobile-menu-btn"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="header-title-section">
            <h1 className="header-page-title">
              Velvet Luxury Salon - Premium Beauty
            </h1>
          </div>
        </div>
        <div className="sidebar-logo">S</div>
      </div>

      {/* Main Layout Container */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar Overlay */}
        <div
          className={`sidebar-overlay ${isSidebarOpen ? "show" : ""}`}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Sidebar */}
        <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
          {/* Mobile Close Button */}
          <div
            className="sidebar-mobile-close"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <button
              className="mobile-menu-btn"
              style={{ display: "flex" }}
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section">
              <div className="nav-section-title">Main Menu</div>
              {filteredNavItems.map((item) => (
                <div key={item.path} style={{ position: "relative" }}>
                  <Link
                    to={item.path}
                    className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
                    onClick={() => {
                      if (window.innerWidth <= 1024) setIsSidebarOpen(false);
                      if (item.submenu)
                        setExpandedMenu(
                          expandedMenu === item.path ? null : item.path,
                        );
                    }}
                  >
                    <item.icon size={20} className="nav-icon" />
                    <span>{item.label}</span>
                    {item.submenu && (
                      <span style={{ marginLeft: "auto", fontSize: "0.75rem" }}>
                        {expandedMenu === item.path ? "▼" : "▶"}
                      </span>
                    )}
                  </Link>
                  {/* Pending Appointments Badge */}
                  {item.path === "/admin/appointments" && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "10px",
                        background: pendingCount > 0 ? "#ef4444" : "#cbd5e1",
                        color: "white",
                        fontSize: "0.7rem",
                        fontWeight: "700",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "999px",
                        minWidth: "20px",
                        textAlign: "center",
                        boxShadow:
                          pendingCount > 0
                            ? "0 2px 8px rgba(239, 68, 68, 0.4)"
                            : "0 2px 4px rgba(0, 0, 0, 0.1)",
                        zIndex: 10,
                      }}
                    >
                      {pendingCount > 99 ? "99+" : pendingCount || "0"}
                    </div>
                  )}
                  {item.submenu && expandedMenu === item.path && (
                    <div className="submenu">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.path}
                          to={subitem.path}
                          className="submenu-link"
                          onClick={() => setIsSidebarOpen(false)}
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>

          <div
            style={{
              marginTop: "auto",
              borderTop: "1px solid var(--border-light)",
              paddingTop: "1rem",
            }}
          >
            <div
              style={{
                marginBottom: "1rem",
                padding: "0.75rem",
                background: "var(--muted)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "0.75rem",
                  color: "var(--muted-foreground)",
                  lineHeight: "1.4",
                }}
              >
                Kalingarayanpalayam, Bhavani
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.75rem",
                  color: "var(--muted-foreground)",
                  lineHeight: "1.4",
                }}
              >
                Erode District, Tamil Nadu - 638301
              </p>
              <p
                style={{
                  margin: "0.5rem 0 0 0",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "var(--foreground)",
                }}
              >
                📞 9667722611
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="nav-link"
              style={{
                color: "var(--danger)",
                border: "none",
                background: "none",
                cursor: "pointer",
                width: "100%",
              }}
            >
              <LogOut size={20} className="nav-icon" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="content-wrapper">
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Reception />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/visits/:id" element={<VisitDetail />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/services" element={<Services />} />
              <Route path="/products" element={<Products />} />
              <Route path="/staff" element={<Staff />} />
              <Route
                path="/salary-analytics"
                element={<StaffSalaryAnalytics />}
              />
              <Route path="/customers" element={<Customers />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/loyalty" element={<Loyalty />} />
              <Route path="/memberships" element={<MembershipManagement />} />
              <Route path="/coupons" element={<Coupons />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/hero" element={<HeroContent />} />
              <Route path="/contact" element={<ContactContent />} />
              <Route path="/gallery" element={<GalleryContent />} />
              <Route path="/reviews" element={<ReviewsManagement />} />
              <Route path="/faqs" element={<FAQsContent />} />
              <Route path="/offers" element={<OffersContent />} />
              <Route path="/newsletter" element={<NewsletterContent />} />

              {/* Admin-only routes */}
              {userRole === "admin" && (
                <>
                  <Route path="/accounts" element={<AccountCreation />} />
                  <Route
                    path="/receptionists"
                    element={<ReceptionistManagement />}
                  />
                </>
              )}

              {/* Redirect hidden pages */}
              {userRole === "receptionist" && (
                <>
                  <Route path="/dashboard" element={<Navigate to="/" />} />
                  <Route
                    path="/salary-analytics"
                    element={<Navigate to="/" />}
                  />
                  <Route path="/customers" element={<Navigate to="/" />} />
                  <Route path="/hero" element={<Navigate to="/" />} />
                  <Route path="/gallery" element={<Navigate to="/" />} />
                  <Route path="/reviews" element={<Navigate to="/" />} />
                  <Route path="/faqs" element={<Navigate to="/" />} />
                  <Route path="/offers" element={<Navigate to="/" />} />
                  <Route path="/newsletter" element={<Navigate to="/" />} />
                  <Route path="/contact" element={<Navigate to="/" />} />
                </>
              )}
            </Routes>
          </main>
        </div>
      </div>

      {/* Appointment Notification */}
      <AppointmentNotification />

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {filteredNavItems.slice(0, 5).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

function AdminApp() {
  const { user, loading, userRole } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="admin-panel loading-overlay">
        <div
          className="loading-spinner"
          style={{ width: 40, height: 40, borderWidth: 3 }}
        ></div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<AdminRegistration />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default AdminApp;
