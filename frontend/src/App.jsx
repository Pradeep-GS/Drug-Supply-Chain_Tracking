import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { BlockchainProvider } from './context/BlockchainContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ManufacturerDashboard from './pages/ManufacturerDashboard';
import DistributorDashboard from './pages/DistributorDashboard';
import PharmacyDashboard from './pages/PharmacyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateDrug from './pages/CreateDrug';
import TrackDrug from './pages/TrackDrug';
import VerifyDrug from './pages/VerifyDrug';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BlockchainProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              
              {/* Manufacturer Only */}
              <Route path="/manufacturer" element={
                <ProtectedRoute requiredRole={1}>
                  <ManufacturerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/create-drug" element={
                <ProtectedRoute requiredRole={1}>
                  <CreateDrug />
                </ProtectedRoute>
              } />

              {/* Distributor Only */}
              <Route path="/distributor" element={
                <ProtectedRoute requiredRole={2}>
                  <DistributorDashboard />
                </ProtectedRoute>
              } />

              {/* Pharmacy Only */}
              <Route path="/pharmacy" element={
                <ProtectedRoute requiredRole={3}>
                  <PharmacyDashboard />
                </ProtectedRoute>
              } />

              {/* Admin Only */}
              <Route path="/admin" element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              <Route path="/track/:batchId" element={<TrackDrug />} />
              <Route path="/verify" element={<VerifyDrug />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </Router>
    </BlockchainProvider>
  );
}

export default App;