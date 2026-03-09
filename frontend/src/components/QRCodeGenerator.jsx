import React from 'react';
import QRCode from 'react-qr-code';

const QRCodeGenerator = ({ batchId, drugData }) => {
  const qrValue = JSON.stringify({
    batchId,
    name: drugData.name,
    manufacturer: drugData.manufacturer,
    expiryDate: drugData.expiryDate,
    timestamp: Date.now()
  });

  const downloadQR = () => {
    const svg = document.getElementById('qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `drug-${batchId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <QRCode
          id="qr-code"
          value={qrValue}
          size={200}
          level="H"
        />
      </div>
      <button
        onClick={downloadQR}
        className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700"
      >
        Download QR Code
      </button>
    </div>
  );
};

export default QRCodeGenerator;