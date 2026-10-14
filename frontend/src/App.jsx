import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import CandidateDashboard from './pages/CandidateDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';

/**
 * Protected Route Guard Component
 * Redirects unauthenticated users to login, and wrong-role users to their dashboard.
 */
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--sl-text-muted)' }}>
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'recruiter' ? '/recruiter' : '/candidate'} replace />;
  }

  return children;
};

/**
 * Root redirect: authenticated users go to their dashboard,
 * unauthenticated users see the landing page.
 */
const HomeRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--sl-text-muted)' }}>
        Loading...
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === 'recruiter' ? '/recruiter' : '/candidate'} replace />;
  }

  return <LandingPage />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Landing page -- no navbar, it has its own */}
          <Route path="/" element={<HomeRoute />} />

          {/* Auth pages -- no navbar */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected dashboard routes -- with navbar */}
          <Route
            path="/candidate"
            element={
              <ProtectedRoute allowedRole="candidate">
                <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--sl-bg-gray-50)' }}>
                  <Navbar />
                  <main style={{ flex: 1 }}>
                    <CandidateDashboard />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter"
            element={
              <ProtectedRoute allowedRole="recruiter">
                <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--sl-bg-gray-50)' }}>
                  <Navbar />
                  <main style={{ flex: 1 }}>
                    <RecruiterDashboard />
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
