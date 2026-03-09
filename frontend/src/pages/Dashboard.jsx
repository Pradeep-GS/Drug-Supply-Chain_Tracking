import React from 'react';
import { Link } from 'react-router-dom';
import { useBlockchain } from '../context/BlockchainContext';
import { ROLES } from '../utils/constants';

const Dashboard = () => {
  const { account, role } = useBlockchain();

  const features = [
    {
      title: 'Manufacturer',
      description: 'Create and ship drug batches',
      icon: '🏭',
      link: '/manufacturer',
      role: 1
    },
    {
      title: 'Distributor',
      description: 'Receive and forward drug shipments',
      icon: '🚚',
      link: '/distributor',
      role: 2
    },
    {
      title: 'Pharmacy',
      description: 'Receive and sell drugs to patients',
      icon: '💊',
      link: '/pharmacy',
      role: 3
    },
    {
      title: 'Verify Drug',
      description: 'Scan QR code to verify authenticity',
      icon: '✓',
      link: '/verify',
      role: null
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Drug Supply Chain Management
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Blockchain-based solution for transparent and secure pharmaceutical supply chain
        </p>
      </div>

      {/* Stats Section */}
      {account && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl mb-2">👤</div>
            <div className="text-sm text-gray-600">Connected as</div>
            <div className="font-semibold">{ROLES[role]}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl mb-2">🔗</div>
            <div className="text-sm text-gray-600">Wallet Address</div>
            <div className="font-semibold text-sm">{account.slice(0, 10)}...{account.slice(-8)}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl mb-2">✓</div>
            <div className="text-sm text-gray-600">Network</div>
            <div className="font-semibold">Ethereum</div>
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          (feature.role === null || feature.role === role) && (
            <Link
              key={index}
              to={feature.link}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </Link>
          )
        ))}
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-primary-600 font-bold">1</span>
            </div>
            <h3 className="font-semibold">Manufacturer</h3>
            <p className="text-sm text-gray-600">Creates drug batch with QR code</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-primary-600 font-bold">2</span>
            </div>
            <h3 className="font-semibold">Distributor</h3>
            <p className="text-sm text-gray-600">Receives and ships to pharmacy</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-primary-600 font-bold">3</span>
            </div>
            <h3 className="font-semibold">Pharmacy</h3>
            <p className="text-sm text-gray-600">Receives and sells to patients</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-primary-600 font-bold">4</span>
            </div>
            <h3 className="font-semibold">Verification</h3>
            <p className="text-sm text-gray-600">Scan QR to verify authenticity</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;