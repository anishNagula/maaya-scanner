import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './App.css';

// Import the list of hashes from your JSON file
import prnHashes from './prnHashes.json';

// For faster lookups, convert the array of hashes into a Set
const prnHashSet = new Set(prnHashes);

function App() {
  const [result, setResult] = useState({ message: '', status: '' });

  // This function will be called when a QR code is successfully scanned
  const onScanSuccess = (decodedText, decodedResult) => {
    validatePRN(decodedText);
  };

  // This function will handle the validation logic
  const validatePRN = (prn) => {
    if (!prn) return;

    // Hash the scanned input using the SHA-256 algorithm
    const hashedPrn = CryptoJS.SHA256(prn.trim()).toString();

    // Check if the new hash exists in our Set of valid hashes
    if (prnHashSet.has(hashedPrn)) {
      setResult({ status: 'valid', message: '✅ Access Granted! Welcome.' });
    } else {
      setResult({ status: 'invalid', message: '❌ Access Denied! PRN not found.' });
    }
    
    // Optional: Hide the result message after a few seconds
    setTimeout(() => setResult({ message: '', status: '' }), 4000);
  };

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        qrbox: { width: 250, height: 250 },
        fps: 10,
        // This is the line you need to add 👇
        facingMode: "environment" 
      },
      false
    );

    scanner.render(onScanSuccess);

    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear html5-qrcode scanner.", error);
      });
    };
  }, []);

  return (
    <div id="container">
      <header>
        <h1>Event Entry 🎟️</h1>
        <p>Point the camera at the ID card barcode</p>
      </header>

      <div id="qr-reader-wrapper">
        <div id="qr-reader"></div>
      </div>

      {/* Add a 'visible' class when there's a message */}
      <div 
        id="result" 
        className={`${result.status} ${result.message ? 'visible' : ''}`}
      >
        {result.message}
      </div>
    </div>
  );
}

export default App;