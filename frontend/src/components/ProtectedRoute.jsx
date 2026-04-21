import React from 'react';
import { Navigate } from 'react-router-dom';
import { useBlockchain } from '../context/BlockchainContext';

const ProtectedRoute = ({ children, requiredRole, adminOnly }) => {
  const { account, role, isAdmin, loading, hasChecked } = useBlockchain();

  // 1. Wait until we have finished checking the blockchain
  if (!hasChecked || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Verifying Permissions...</p>
      </div>
    );
  }

  // 2. If no wallet is connected at all, go to home
  if (!account) {
    return <Navigate to="/" />;
  }

  // 3. Check Admin access
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" />;
  }

  // 4. Check Role access
  if (requiredRole !== undefined && role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
