// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Common/ProtectedRoute';
import Layout from './components/Layout/Layout';

// ─── Public Pages ─────────────────────────────────────────────────────────────
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';

// ─── Admin Pages ──────────────────────────────────────────────────────────────
import AdminDashboard from './pages/AdminDashboard';
import Trucks from './pages/Trucks';
import Drivers from './pages/Drivers';
import Devices from './pages/Devices';
import LiveMap from './pages/LiveMap';
import TripHistory from './pages/TripHistory';
import GateManagement from './pages/GateManagement';
import Users from './pages/Users';
import DriverScoreConfig from './pages/DriverScoreConfig';
import DriverHistory from './pages/DriverHistory';       
import TruckHistory from './pages/TruckHistory';     
import AllTruckHistory from './pages/AllTruckHistory';
// ─── Shipment Manager Pages ───────────────────────────────────────────────────
import ShipmentManagerDashboard from './pages/ShipmentManagerDashboard';
import Shipments from './pages/Shipments';
import CreateShipment from './pages/CreateShipment';
import ShipmentDetail from './pages/ShipmentDetail';

// ─── Shared Pages ─────────────────────────────────────────────────────────────
import Notifications from './pages/Notifications';

// ─── Route Guards ─────────────────────────────────────────────────────────────
const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin']}>
    {children}
  </ProtectedRoute>
);

const ShipmentManagerRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['shipment_manager']}>
    {children}
  </ProtectedRoute>
);

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <Routes>

          {/* ── Public ──────────────────────────────────────────────────── */}
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* ── Admin ───────────────────────────────────────────────────── */}
          <Route
            path="/dashboard"
            element={
              <AdminRoute>
                <Layout />
              </AdminRoute>
            }
          >
            {/* Overview */}
            <Route index element={<AdminDashboard />} />

            {/* Fleet */}
            <Route path="trucks" element={<Trucks />} />
<Route path="truck-history" element={<AllTruckHistory />} />           // list of all trucks
<Route path="truck-history/:truckId" element={<TruckHistory />} />    // detail for one truck            <Route path="drivers" element={<Drivers />} />
            <Route path="driver-history" element={<DriverHistory />} />       
            <Route path="driver-history/:driverId" element={<DriverHistory />} />

            <Route path="devices" element={<Devices />} />
            <Route path="driver-scores" element={<DriverScoreConfig />} />

            {/* Operations */}
            <Route path="tracking" element={<LiveMap />} />
            <Route path="trips" element={<TripHistory />} />
            <Route path="gate-management" element={<GateManagement />} />
            <Route path="shipments" element={<Shipments />} />
            <Route path="shipments/create" element={<CreateShipment />} />

            {/* Admin */}
            <Route path="users" element={<Users />} />

            {/* Shared */}
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />                   
          </Route>

          {/* ── Shipment Manager ────────────────────────────────────────── */}
          <Route
            path="/shipment_manager"
            element={
              <ShipmentManagerRoute>
                <Layout />
              </ShipmentManagerRoute>
            }
          >
            <Route index element={<ShipmentManagerDashboard />} />
            <Route path="shipments" element={<Shipments />} />
            <Route path="shipments/create" element={<CreateShipment />} />
            <Route path="shipments/:shipmentId" element={<ShipmentDetail />} />
            <Route path="tracking" element={<LiveMap />} />
            <Route path="map" element={<LiveMap />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="trips" element={<TripHistory />} />

          </Route>

          {/* ── Fallback ─────────────────────────────────────────────────── */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;