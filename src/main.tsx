import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import AdminApp from "./app/admin/AdminApp.tsx";
// @ts-ignore
import { AuthProvider } from "./app/admin/context/AuthContext.jsx";
import "./app/styles/index.css";

function RootApp() {
  const location = useLocation();

  useEffect(() => {
    // Clean up admin styles when leaving admin routes
    if (!location.pathname.startsWith("/admin")) {
      const style1 = document.getElementById('admin-index-styles');
      const style2 = document.getElementById('admin-app-styles');
      if (style1) style1.remove();
      if (style2) style2.remove();
      console.log('Cleaned up admin styles on route change');
    }
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

function RootWrapper() {
  return (
    <AuthProvider>
      <Router>
        <RootApp />
      </Router>
    </AuthProvider>
  );
}

createRoot(document.getElementById("root")!).render(<RootWrapper />);
  