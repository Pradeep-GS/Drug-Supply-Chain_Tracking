import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useBlockchain } from '../context/BlockchainContext';
import { STATUS, STATUS_COLORS } from '../utils/constants';
import QRCode from 'react-qr-code';

const TrackDrug = () => {
  const { batchId } = useParams();
  const { contract } = useBlockchain();
  const [drug, setDrug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (contract && batchId) {
      fetchDrugDetails();
    }
  }, [contract, batchId]);

  const fetchDrugDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching drug details for batch:', batchId);
      
      // Call contract to get drug data
      const drugData = await contract.getDrug(batchId);
      console.log('Drug data:', drugData);
      
      if (!drugData.exists) {
        throw new Error('Drug not found');
      }
      
      // Convert expiry date from seconds to milliseconds
      const formattedDrug = {
        name: drugData.name,
        batchId: drugData.batchId,
        expiryDate: Number(drugData.expiryDate) * 1000,
        manufacturer: drugData.manufacturer,
        currentOwner: drugData.currentOwner,
        status: Number(drugData.status),
        exists: drugData.exists
      };
      
      setDrug(formattedDrug);
      
      // Fetch timeline events
      await fetchTimeline(batchId);
      
    } catch (error) {
      console.error('Error fetching drug:', error);
      setError(error.message || 'Drug not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async (batchId) => {
    try {
      // Get all events for this batch
      const createdFilter = contract.filters.DrugCreated(batchId, null);
      const transferredFilter = contract.filters.DrugTransferred(batchId, null, null);
      const receivedFilter = contract.filters.DrugReceived(batchId, null);
      const soldFilter = contract.filters.DrugSold(batchId, null);
      
      const [createdEvents, transferredEvents, receivedEvents, soldEvents] = await Promise.all([
        contract.queryFilter(createdFilter, 0, 'latest'),
        contract.queryFilter(transferredFilter, 0, 'latest'),
        contract.queryFilter(receivedFilter, 0, 'latest'),
        contract.queryFilter(soldFilter, 0, 'latest')
      ]);
      
      const timelineEvents = [];
      
      // Add created event
      createdEvents.forEach(event => {
        timelineEvents.push({
          status: 0,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          actor: event.args[1],
          type: 'Created'
        });
      });
      
      // Add transferred events
      transferredEvents.forEach(event => {
        timelineEvents.push({
          status: 1,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          actor: event.args[2],
          from: event.args[1],
          type: 'Transferred'
        });
      });
      
      // Add received events
      receivedEvents.forEach(event => {
        timelineEvents.push({
          status: 2,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          actor: event.args[1],
          type: 'Received'
        });
      });
      
      // Add sold events
      soldEvents.forEach(event => {
        timelineEvents.push({
          status: 3,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          actor: event.args[1],
          type: 'Sold'
        });
      });
      
      // Sort by block number (oldest first)
      timelineEvents.sort((a, b) => a.blockNumber - b.blockNumber);
      
      // Add location based on status
      const eventsWithLocation = timelineEvents.map(event => {
        let location = '';
        switch(event.status) {
          case 0: location = 'Manufacturing Facility'; break;
          case 1: location = 'In Transit'; break;
          case 2: location = 'Distribution Center'; break;
          case 3: location = 'Pharmacy'; break;
          default: location = 'Unknown';
        }
        return { ...event, location };
      });
      
      setTimeline(eventsWithLocation);
      
    } catch (error) {
      console.error('Error fetching timeline:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Loading drug information...</p>
      </div>
    );
  }

  if (error || !drug || !drug.exists) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Drug Not Found</h2>
        <p className="text-gray-600">{error || `No drug found with batch ID: ${batchId}`}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Track Drug: {drug.name}</h1>
      
      {/* Drug Details Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Drug Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Batch ID</label>
            <p className="font-semibold">{drug.batchId}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Current Status</label>
            <p className={`mt-1 px-3 py-1 rounded-full text-sm font-semibold inline-block ${
              STATUS_COLORS[drug.status]
            }`}>
              {STATUS[drug.status]}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Manufacturer</label>
            <p className="font-mono text-sm">{drug.manufacturer.slice(0, 10)}...{drug.manufacturer.slice(-8)}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Current Owner</label>
            <p className="font-mono text-sm">{drug.currentOwner.slice(0, 10)}...{drug.currentOwner.slice(-8)}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Expiry Date</label>
            <p className="font-semibold">
              {new Date(drug.expiryDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">Supply Chain Timeline</h2>
        <div className="space-y-4">
          {timeline.length === 0 ? (
            <p className="text-center text-gray-500">No timeline events found</p>
          ) : (
            timeline.map((event, index) => (
              <div key={index} className="relative pl-8 pb-4 border-l-2 border-primary-200 last:pb-0">
                <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary-600"></div>
                <div className="mb-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    STATUS_COLORS[event.status]
                  }`}>
                    {STATUS[event.status]}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">{event.location}</p>
                <p className="text-sm text-gray-500 font-mono">
                  {event.actor?.slice(0, 10)}...{event.actor?.slice(-8)}
                </p>
                {event.from && (
                  <p className="text-xs text-gray-500">
                    From: {event.from.slice(0, 10)}...{event.from.slice(-8)}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Block #{event.blockNumber}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* QR Code for this drug */}
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">QR Code</h2>
        <div className="inline-block bg-gray-100 p-4 rounded-lg">
          <QRCode
            value={JSON.stringify({
              batchId: drug.batchId,
              name: drug.name,
              manufacturer: drug.manufacturer,
              timestamp: Date.now()
            })}
            size={200}
            level="H"
          />
        </div>
        <p className="mt-4 text-sm text-gray-600">
          Scan this QR code to verify drug authenticity
        </p>
      </div>
    </div>
  );
};

export default TrackDrug;