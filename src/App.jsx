import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext'; 
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
import LoadingZoneManagement from './pages/LoadingZoneManagement';
import Users from './pages/Users';
import DriverScoreConfig from './pages/DriverScoreConfig';
import DriverHistory from './pages/DriverHistory';       
import TruckHistory from './pages/TruckHistory';     
import AllTruckHistory from './pages/AllTruckHistory';
import DriverProfile from './pages/DriverProfile';
import Customers from './pages/Customers';
import LprEvents from './pages/LprEvents';  // ← NEW

// ─── Shipment Manager Pages ───────────────────────────────────────────────────
import ShipmentManagerDashboard from './pages/ShipmentManagerDashboard';
import Shipments from './pages/Shipments';
import CreateShipment from './pages/CreateShipment';
import ShipmentHistory from './pages/ShipmentHistory';

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
        <SocketProvider>
          <Routes>
            {/* ── Public ──────────────────────────────────────────────────── */}
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* ── Admin Routes ───────────────────────────────────────────── */}
            <Route
              path="/dashboard"
              element={
                <AdminRoute>
                  <Layout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />

              {/* Fleet */}
              <Route path="trucks" element={<Trucks />} />
              <Route path="truck-history" element={<AllTruckHistory />} />
              <Route path="truck-history/:truckId" element={<TruckHistory />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="driver-history" element={<DriverHistory />} />       
              <Route path="driver-history/:driverId" element={<DriverHistory />} />
              <Route path="devices" element={<Devices />} />
              <Route path="driver-scores" element={<DriverScoreConfig />} />

              {/* Operations */}
              <Route path="tracking" element={<LiveMap />} />
              <Route path="trips" element={<TripHistory />} />
              <Route path="loading-zones" element={<LoadingZoneManagement />} />
              <Route path="shipments" element={<Shipments />} />
              <Route path="shipments/create" element={<CreateShipment />} />
              <Route path="shipments/:shipmentId" element={<ShipmentHistory />} />
              <Route path="customers" element={<Customers />} />
              <Route path="lpr-events" element={<LprEvents />} />  {/* ← NEW */}

              {/* Admin */}
              <Route path="users" element={<Users />} />

              {/* Shared */}
              <Route path="profile" element={<Profile />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="drivers/:driverId" element={<DriverProfile />} />   
            </Route>

            {/* ── Shipment Manager Routes ─────────────────────────────────── */}
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
              <Route path="shipments/:shipmentId" element={<ShipmentHistory />} />
              <Route path="tracking" element={<LiveMap />} />
              <Route path="map" element={<LiveMap />} />
              <Route path="trips" element={<TripHistory />} />
              <Route path="customers" element={<Customers />} />
              <Route path="profile" element={<Profile />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="lpr-events" element={<LprEvents />} />  {/* ← NEW */}
            </Route>

            {/* ── Fallback ─────────────────────────────────────────────────── */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;