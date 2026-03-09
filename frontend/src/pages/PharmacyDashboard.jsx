import React, { useState, useEffect } from 'react';
import { useBlockchain } from '../context/BlockchainContext';
import { STATUS, STATUS_COLORS } from '../utils/constants';

const PharmacyDashboard = () => {
  const { contract, account } = useBlockchain();
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (contract && account) {
      fetchInventory();
    }
  }, [contract, account]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get all DrugTransferred events where 'to' is current pharmacy
      const filter = contract.filters.DrugTransferred(null, null, account);
      const events = await contract.queryFilter(filter, 0, 'latest');
      
      console.log('Found inventory events:', events.length);
      
      const inventoryPromises = events.map(async (event) => {
        const batchId = event.args[0];
        
        try {
          const drug = await contract.getDrug(batchId);
          
          // Only show drugs that are received (status 2) or sold (status 3)
          if (Number(drug.status) >= 2) {
            return {
              batchId: drug.batchId,
              name: drug.name,
              quantity: 100, // You'd need to track quantity separately
              receivedDate: Date.now() - 2 * 24 * 60 * 60 * 1000, // From event timestamp
              expiryDate: Number(drug.expiryDate) * 1000,
              status: Number(drug.status)
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching drug ${batchId}:`, error);
          return null;
        }
      });
      
      const inventoryList = (await Promise.all(inventoryPromises)).filter(i => i !== null);
      setInventory(inventoryList);
      
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError('Failed to fetch inventory: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (batchId) => {
    try {
      setLoading(true);
      
      console.log('Receiving drug:', batchId);
      
      const tx = await contract.receiveDrug(batchId);
      console.log('Transaction sent:', tx.hash);
      
      await tx.wait();
      
      alert('✅ Drug received successfully!');
      fetchInventory(); // Refresh inventory
    } catch (error) {
      console.error('Error receiving drug:', error);
      alert('❌ Error: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async (batchId) => {
    try {
      setLoading(true);
      
      console.log('Selling drug:', batchId);
      
      const tx = await contract.sellDrug(batchId);
      console.log('Transaction sent:', tx.hash);
      
      await tx.wait();
      
      alert('✅ Drug sold successfully!');
      fetchInventory(); // Refresh inventory
    } catch (error) {
      console.error('Error selling drug:', error);
      alert('❌ Error: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && inventory.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pharmacy Dashboard</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-2">💊</div>
          <div className="text-2xl font-bold">{inventory.length}</div>
          <div className="text-gray-600">Products in Stock</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-2">📦</div>
          <div className="text-2xl font-bold">
            {inventory.reduce((acc, item) => acc + (item.quantity || 0), 0)}
          </div>
          <div className="text-gray-600">Total Units</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-2">⚠️</div>
          <div className="text-2xl font-bold">
            {inventory.filter(item => {
              const daysUntilExpiry = Math.floor((item.expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
              return daysUntilExpiry < 30;
            }).length}
          </div>
          <div className="text-gray-600">Near Expiry</div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Current Inventory</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {inventory.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No inventory found
            </div>
          ) : (
            inventory.map((item, index) => {
              const daysUntilExpiry = Math.floor((item.expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
              const isNearExpiry = daysUntilExpiry < 30;
              
              return (
                <div key={index} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        {isNearExpiry && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            Expiring Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">Batch: {item.batchId}</p>
                      <p className="text-sm text-gray-600">
                        Received: {new Date(item.receivedDate).toLocaleDateString()}
                      </p>
                      <p className={`text-sm ${isNearExpiry ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                        Expiry: {new Date(item.expiryDate).toLocaleDateString()} 
                        ({daysUntilExpiry} days left)
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[item.status]}`}>
                        {STATUS[item.status]}
                      </span>
                      {item.status === 1 && (
                        <button
                          onClick={() => handleReceive(item.batchId)}
                          disabled={loading}
                          className="block w-full text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          Mark as Received
                        </button>
                      )}
                      {item.status === 2 && (
                        <button
                          onClick={() => handleSell(item.batchId)}
                          disabled={loading}
                          className="block w-full text-sm bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700 disabled:opacity-50"
                        >
                          Sell to Patient
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Expiry Alert */}
      {inventory.some(item => {
        const daysUntilExpiry = Math.floor((item.expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry < 7;
      }) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-800">Critical Expiry Alert</h3>
              <p className="text-sm text-red-600">
                Some drugs will expire within 7 days. Please prioritize selling or return them.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyDashboard;