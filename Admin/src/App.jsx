
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import { useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Appointments from './pages/Appointments.jsx';
import Schedule from './pages/Schedule.jsx';
import Services from './pages/Services.jsx';

function RequireAuth({ roles, children }) {
  const { admin, checking } = useAuth();

  if (checking) {
    return <p className="center-note">Checking your session...</p>;
  }

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(admin.role)) {
    return <Navigate to="/appointments" replace />;
  }

  return children;
}

export default function App() {
  const { admin } = useAuth();
  const location = useLocation();

  // Update browser tab title and favicon
  useEffect(() => {
    const isLogin = location.pathname === '/login';

    document.title = isLogin
      ? 'Visit Balayan | Staff Login'
      : 'Visit Balayan | Staff Dashboard';

    // Set browser tab logo
    let favicon = document.querySelector("link[rel~='icon']");

    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }

    favicon.type = 'image/png';
    favicon.href = '/balayanlogo.png';

  }, [location.pathname]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          admin
            ? <Navigate to="/appointments" replace />
            : <Login />
        }
      />

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/schedule" element={<Schedule />} />

        <Route
          path="/services"
          element={
            <RequireAuth roles={['Admin']}>
              <Services />
            </RequireAuth>
          }
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/appointments" replace />}
      />
    </Routes>
  );
}
