import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBlockchain } from '../context/BlockchainContext';
import { STATUS, STATUS_COLORS } from '../utils/constants';

const ManufacturerDashboard = () => {
  const { contract, account } = useBlockchain();
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transferData, setTransferData] = useState({ batchId: '', distributor: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (contract && account) {
      fetchManufacturerDrugs();
    }
  }, [contract, account]);

  const fetchManufacturerDrugs = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching drugs for manufacturer:', account);
      
      // Get DrugCreated events filtered by manufacturer address
      const filter = contract.filters.DrugCreated(null, account);
      const events = await contract.queryFilter(filter, 0, 'latest');
      
      console.log('Found events:', events.length);
      
      const drugPromises = events.map(async (event) => {
        const batchId = event.args[0]; // First argument is batchId
        try {
          const drug = await contract.getDrug(batchId);
          console.log('Drug data:', drug);
          
          return {
            batchId: drug.batchId,
            name: drug.name,
            expiryDate: Number(drug.expiryDate) * 1000, // Convert to milliseconds
            status: Number(drug.status),
            manufacturer: drug.manufacturer,
            currentOwner: drug.currentOwner
          };
        } catch (error) {
          console.error(`Error fetching drug ${batchId}:`, error);
          return null;
        }
      });
      
      const drugsList = (await Promise.all(drugPromises)).filter(d => d !== null);
      setDrugs(drugsList);
      
    } catch (error) {
      console.error('Error fetching drugs:', error);
      setError('Failed to fetch drugs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      
      if (!transferData.batchId || !transferData.distributor) {
        throw new Error('Please fill all fields');
      }

      console.log('Transferring drug:', transferData.batchId, 'to', transferData.distributor);
      
      // Call contract method
      const tx = await contract.transferDrug(transferData.batchId, transferData.distributor);
      console.log('Transaction sent:', tx.hash);
      
      await tx.wait(); // Wait for transaction to be mined
      
      alert('✅ Drug transferred successfully!');
      setTransferData({ batchId: '', distributor: '' });
      fetchManufacturerDrugs(); // Refresh list
    } catch (error) {
      console.error('Error transferring drug:', error);
      setError(error.message || 'Error transferring drug');
      alert('❌ Error: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && drugs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Loading your drugs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manufacturer Dashboard</h1>
        <Link
          to="/create-drug"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          + Create New Drug
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-2">📦</div>
          <div className="text-2xl font-bold">{drugs.length}</div>
          <div className="text-gray-600">Total Batches</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-2">⏳</div>
          <div className="text-2xl font-bold">
            {drugs.filter(d => d.status === 0).length}
          </div>
          <div className="text-gray-600">Pending Shipment</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-2">🚚</div>
          <div className="text-2xl font-bold">
            {drugs.filter(d => d.status === 1).length}
          </div>
          <div className="text-gray-600">Shipped</div>
        </div>
      </div>

      {/* Transfer Drug Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Transfer Drug to Distributor</h2>
        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Batch ID
            </label>
            <input
              type="text"
              value={transferData.batchId}
              onChange={(e) => setTransferData({ ...transferData, batchId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., BATCH001"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Distributor Address
            </label>
            <input
              type="text"
              value={transferData.distributor}
              onChange={(e) => setTransferData({ ...transferData, distributor: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0x..."
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center font-medium"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></span>
                Processing...
              </>
            ) : (
              'Transfer Drug'
            )}
          </button>
        </form>
      </div>

      {/* Drug List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Your Drug Batches</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {drugs.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>No drugs created yet.</p>
              <Link to="/create-drug" className="text-primary-600 hover:text-primary-800 mt-2 inline-block">
                Create your first drug batch →
              </Link>
            </div>
          ) : (
            drugs.map((drug, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{drug.name}</h3>
                    <p className="text-sm text-gray-600">Batch: {drug.batchId}</p>
                    <p className="text-sm text-gray-600">
                      Expiry: {new Date(drug.expiryDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Current Owner: {drug.currentOwner.slice(0, 10)}...{drug.currentOwner.slice(-8)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[drug.status]}`}>
                      {STATUS[drug.status]}
                    </span>
                    <Link
                      to={`/track/${drug.batchId}`}
                      className="block mt-2 text-primary-600 hover:text-primary-800 text-sm"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ManufacturerDashboard;