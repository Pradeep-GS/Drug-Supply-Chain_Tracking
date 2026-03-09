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

function App() {
  return (
    <BlockchainProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/manufacturer" element={<ManufacturerDashboard />} />
              <Route path="/distributor" element={<DistributorDashboard />} />
              <Route path="/pharmacy" element={<PharmacyDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/create-drug" element={<CreateDrug />} />
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