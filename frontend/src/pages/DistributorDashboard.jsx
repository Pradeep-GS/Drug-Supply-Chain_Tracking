import React, { useState, useEffect } from 'react';
import { useBlockchain } from '../context/BlockchainContext';
import { STATUS, STATUS_COLORS } from '../utils/constants';

const DistributorDashboard = () => {
  const { contract, account } = useBlockchain();
  const [loading, setLoading] = useState(false);
  const [receiveData, setReceiveData] = useState({ batchId: '' });
  const [shipments, setShipments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (contract && account) {
      fetchShipments();
    }
  }, [contract, account]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get all DrugTransferred events where 'to' is current user
      const filter = contract.filters.DrugTransferred(null, null, account);
      const events = await contract.queryFilter(filter, 0, 'latest');
      
      console.log('Found shipment events:', events.length);
      
      const shipmentPromises = events.map(async (event) => {
        const batchId = event.args[0];
        const from = event.args[1];
        
        try {
          const drug = await contract.getDrug(batchId);
          
          // Only show drugs that are in transit or received
          if (Number(drug.status) === 1 || Number(drug.status) === 2) {
            return {
              batchId: drug.batchId,
              name: drug.name,
              from: from,
              status: Number(drug.status),
              received: Number(drug.status) === 2
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching drug ${batchId}:`, error);
          return null;
        }
      });
      
      const shipmentsList = (await Promise.all(shipmentPromises)).filter(s => s !== null);
      setShipments(shipmentsList);
      
    } catch (error) {
      console.error('Error fetching shipments:', error);
      setError('Failed to fetch shipments: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      
      if (!receiveData.batchId) {
        throw new Error('Please enter Batch ID');
      }
      
      console.log('Receiving drug:', receiveData.batchId);
      
      const tx = await contract.receiveDrug(receiveData.batchId);
      console.log('Transaction sent:', tx.hash);
      
      await tx.wait();
      
      alert('✅ Drug received successfully!');
      setReceiveData({ batchId: '' });
      fetchShipments(); // Refresh list
    } catch (error) {
      console.error('Error receiving drug:', error);
      setError(error.message || 'Error receiving drug');
      alert('❌ Error: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleShipToPharmacy = async (batchId, pharmacyAddress) => {
    try {
      setLoading(true);
      
      if (!pharmacyAddress || !pharmacyAddress.startsWith('0x')) {
        throw new Error('Invalid pharmacy address');
      }
      
      console.log('Shipping drug:', batchId, 'to pharmacy:', pharmacyAddress);
      
      const tx = await contract.transferDrug(batchId, pharmacyAddress);
      console.log('Transaction sent:', tx.hash);
      
      await tx.wait();
      
      alert('✅ Drug shipped to pharmacy!');
      fetchShipments(); // Refresh list
    } catch (error) {
      console.error('Error shipping drug:', error);
      alert('❌ Error: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && shipments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Loading shipments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Distributor Dashboard</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-2">📦</div>
          <div className="text-2xl font-bold">{shipments.length}</div>
          <div className="text-gray-600">Total Shipments</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold">
            {shipments.filter(s => s.received).length}
          </div>
          <div className="text-gray-600">Received</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-2">🚚</div>
          <div className="text-2xl font-bold">
            {shipments.filter(s => !s.received).length}
          </div>
          <div className="text-gray-600">To be Received</div>
        </div>
      </div>

      {/* Receive Drug Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Receive Drug from Manufacturer</h2>
        <form onSubmit={handleReceive} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Batch ID
            </label>
            <input
              type="text"
              value={receiveData.batchId}
              onChange={(e) => setReceiveData({ batchId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., BATCH001"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></span>
                Processing...
              </>
            ) : (
              'Receive Drug'
            )}
          </button>
        </form>
      </div>

      {/* Shipments List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Incoming Shipments</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {shipments.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No shipments found
            </div>
          ) : (
            shipments.map((shipment, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{shipment.name}</h3>
                    <p className="text-sm text-gray-600">Batch: {shipment.batchId}</p>
                    <p className="text-sm text-gray-600">From: {shipment.from.slice(0, 10)}...{shipment.from.slice(-8)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[shipment.status]}`}>
                      {STATUS[shipment.status]}
                    </span>
                    {shipment.status === 1 && !shipment.received && (
                      <button
                        onClick={() => {
                          const pharmacyAddr = prompt('Enter pharmacy address:');
                          if (pharmacyAddr && pharmacyAddr.startsWith('0x')) {
                            handleShipToPharmacy(shipment.batchId, pharmacyAddr);
                          } else {
                            alert('Please enter a valid Ethereum address starting with 0x');
                          }
                        }}
                        disabled={loading}
                        className="block mt-2 text-sm bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700 disabled:opacity-50"
                      >
                        Ship to Pharmacy
                      </button>
                    )}
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

export default DistributorDashboard;