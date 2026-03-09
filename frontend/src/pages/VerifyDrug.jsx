import React, { useState } from 'react';
import QRScanner from '../components/QRScanner';
import { useBlockchain } from '../context/BlockchainContext';
import { STATUS, STATUS_COLORS } from '../utils/constants';

const VerifyDrug = () => {
  const { contract } = useBlockchain();
  const [drugData, setDrugData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualBatchId, setManualBatchId] = useState('');
  const [error, setError] = useState('');

  const handleScan = async (scannedData) => {
    if (scannedData && scannedData.batchId) {
      await verifyDrug(scannedData.batchId);
    }
  };

  const verifyDrug = async (batchId) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Verifying drug with batch ID:', batchId);
      
      // Call contract to get drug data
      const drug = await contract.getDrug(batchId);
      console.log('Drug data:', drug);
      
      if (!drug.exists) {
        throw new Error('Drug not found');
      }
      
      const formattedDrug = {
        name: drug.name,
        batchId: drug.batchId,
        expiryDate: Number(drug.expiryDate) * 1000,
        manufacturer: drug.manufacturer,
        currentOwner: drug.currentOwner,
        status: Number(drug.status),
        exists: drug.exists
      };
      
      setDrugData(formattedDrug);
    } catch (error) {
      console.error('Error verifying drug:', error);
      setError(error.message || 'Drug not found or invalid');
      setDrugData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = (e) => {
    e.preventDefault();
    if (manualBatchId) {
      verifyDrug(manualBatchId);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Verify Drug Authenticity</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Scan QR Code</h2>
        <QRScanner onScan={handleScan} />
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Or Enter Batch ID Manually</h2>
        <form onSubmit={handleManualVerify} className="flex space-x-2">
          <input
            type="text"
            value={manualBatchId}
            onChange={(e) => setManualBatchId(e.target.value)}
            placeholder="Enter batch ID (e.g., BATCH001)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading || !manualBatchId}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </button>
        </form>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Verifying...</p>
        </div>
      )}

      {drugData && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Verification Result</h2>
          
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${
              drugData.exists ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{drugData.exists ? '✅' : '❌'}</span>
                <span className={`font-semibold ${
                  drugData.exists ? 'text-green-700' : 'text-red-700'
                }`}>
                  {drugData.exists ? 'Authentic Drug' : 'Invalid or Fake Drug'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Drug Name</label>
                <p className="font-semibold">{drugData.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Batch ID</label>
                <p className="font-semibold">{drugData.batchId}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Manufacturer</label>
                <p className="font-semibold text-sm">{drugData.manufacturer.slice(0, 10)}...{drugData.manufacturer.slice(-8)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Current Owner</label>
                <p className="font-semibold text-sm">{drugData.currentOwner.slice(0, 10)}...{drugData.currentOwner.slice(-8)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Expiry Date</label>
                <p className="font-semibold">
                  {new Date(drugData.expiryDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Status</label>
                <p className={`mt-1 px-3 py-1 rounded-full text-sm font-semibold inline-block ${
                  STATUS_COLORS[drugData.status]
                }`}>
                  {STATUS[drugData.status]}
                </p>
              </div>
            </div>

            {drugData.status < 3 && new Date(drugData.expiryDate) < new Date() && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 font-semibold">⚠️ This drug has expired!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyDrug;