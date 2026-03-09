import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';

const QRScanner = ({ onScan }) => {
  const [scanning, setScanning] = useState(false);
  const [data, setData] = useState('');

  const handleScan = (result) => {
    if (result) {
      try {
        const scannedData = JSON.parse(result?.text);
        setData(scannedData);
        onScan(scannedData);
        setScanning(false);
      } catch (error) {
        console.error('Invalid QR code', error);
      }
    }
  };

  const handleError = (error) => {
    console.error('Scanner error:', error);
  };

  return (
    <div className="space-y-4">
      {!scanning ? (
        <button
          onClick={() => setScanning(true)}
          className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Scan QR Code
        </button>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <QrReader
              onResult={handleScan}
              onError={handleError}
              constraints={{ facingMode: 'environment' }}
              className="w-full rounded-lg overflow-hidden"
            />
            <button
              onClick={() => setScanning(false)}
              className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {data && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800">Scanned Data:</h3>
          <pre className="text-sm text-gray-600 mt-2">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default QRScanner;