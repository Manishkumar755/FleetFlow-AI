import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Shipments from './pages/Shipments';
import CustomerPortal from './pages/CustomerPortal';
import Users from './pages/Users';
import Drivers from './pages/Drivers';
import Vehicles from './pages/Vehicles';
import LiveTracking from './pages/LiveTracking';
import Predictions from './pages/Predictions';
import Anomalies from './pages/Anomalies';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function MainLayout() {
  const [serviceStatus, setServiceStatus] = useState({
    django: false,
    fastapi: false,
  });

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header
          djangoOnline={serviceStatus.django}
          fastapiOnline={serviceStatus.fastapi}
        />
        <main>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard onStatusUpdate={setServiceStatus} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shipments"
              element={
                <ProtectedRoute>
                  <Shipments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tracking"
              element={
                <ProtectedRoute>
                  <LiveTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/drivers"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                  <Drivers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicles"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                  <Vehicles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/predictions"
              element={
                <ProtectedRoute>
                  <Predictions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/anomalies"
              element={
                <ProtectedRoute>
                  <Anomalies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication & Tracking Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/portal" element={<CustomerPortal />} />

          {/* Protected Enterprise SaaS Application */}
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
