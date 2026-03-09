import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBlockchain } from '../context/BlockchainContext';
import QRCodeGenerator from '../components/QRCodeGenerator';

const CreateDrug = () => {
  const navigate = useNavigate();
  const { contract, account, role } = useBlockchain();
  const [loading, setLoading] = useState(false);
  const [createdDrug, setCreatedDrug] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    batchId: '',
    expiryDate: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      
      // Validate inputs
      if (!formData.name || !formData.batchId || !formData.expiryDate) {
        throw new Error('Please fill all fields');
      }
      
      // Convert expiry date to timestamp (seconds)
      const expiryDate = new Date(formData.expiryDate);
      const now = new Date();
      
      if (expiryDate <= now) {
        throw new Error('Expiry date must be in the future');
      }
      
      const expiryTimestamp = Math.floor(expiryDate.getTime() / 1000);
      
      console.log('Creating drug with:', {
        name: formData.name,
        batchId: formData.batchId,
        expiry: expiryTimestamp
      });
      
      // Call contract method
      const tx = await contract.createDrug(
        formData.name, 
        formData.batchId, 
        expiryTimestamp
      );
      
      console.log('Transaction sent:', tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      setCreatedDrug({
        ...formData,
        manufacturer: account,
        transactionHash: tx.hash
      });
      
      alert('✅ Drug created successfully!');
    } catch (error) {
      console.error('Error creating drug:', error);
      setError(error.message || 'Error creating drug');
      alert('❌ Error: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (role !== 1) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only manufacturers can create drugs</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Drug Batch</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {!createdDrug ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Drug Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="e.g., Paracetamol"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Batch ID
            </label>
            <input
              type="text"
              value={formData.batchId}
              onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="e.g., BATCH001"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></span>
                Creating...
              </>
            ) : (
              'Create Drug Batch'
            )}
          </button>
        </form>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-green-600 mb-2 ">
              Drug Created Successfully!
            </h2>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Drug Details:</h3>
            <p><span className="font-medium">Name:</span> {createdDrug.name}</p>
            <p><span className="font-medium">Batch ID:</span> {createdDrug.batchId}</p>
            <p><span className="font-medium">Expiry:</span> {createdDrug.expiryDate}</p>
            <p><span className="font-medium">Transaction:</span> {createdDrug.transactionHash?.slice(0, 10)}...{createdDrug.transactionHash?.slice(-8)}</p>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4 text-center">QR Code for Tracking</h3>
            <QRCodeGenerator batchId={createdDrug.batchId} drugData={createdDrug} />
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setCreatedDrug(null);
                setFormData({ name: '', batchId: '', expiryDate: '' });
              }}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Create Another
            </button>
            <button
              onClick={() => navigate('/manufacturer')}
              className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateDrug;