import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from './supabase'; // Import the Supabase client
import './App.css';

function App() {
  const [result, setResult] = useState({ message: '', status: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  // The main validation logic, now async to talk to Supabase
  const validatePRN = async (prn) => {
    if (isProcessing || !prn) return;
    setIsProcessing(true);

    const hashedPrn = CryptoJS.SHA256(prn.trim()).toString();

    try {
      // 1. Fetch the specific student record from Supabase
      const { data, error } = await supabase
        .from('students')
        .select('checked_in')
        .eq('id', hashedPrn)
        .single(); // Use .single() because we expect only one result

      if (error && error.code !== 'PGRST116') { // Ignore 'PGRST116' (row not found)
        throw error;
      }

      if (data) {
        // 2. Check if already checked in
        if (data.checked_in) {
          setResult({ status: 'invalid', message: '⚠️ Already Checked In!' });
        } else {
          // 3. Grant access and update the database
          setResult({ status: 'valid', message: '✅ Access Granted! Welcome.' });
          await supabase
            .from('students')
            .update({ checked_in: true })
            .eq('id', hashedPrn);
        }
      } else {
        // 4. If no data is found, the PRN is invalid
        setResult({ status: 'invalid', message: '❌ Access Denied! PRN not found.' });
      }
    } catch (error) {
      console.error("Error connecting to Supabase:", error);
      setResult({ status: 'invalid', message: '🔌 DB Connection Error. Check console.' });
    }

    setTimeout(() => {
      setResult({ message: '', status: '' });
      setIsProcessing(false);
    }, 4000);
  };

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('qr-reader', {
      qrbox: { width: 250, height: 250 },
      fps: 10,
      facingMode: "environment"
    }, false);
    
    const handleScan = (decodedText) => {
        if (!isProcessing) {
            validatePRN(decodedText);
        }
    }
    
    scanner.render(handleScan);

    return () => {
      scanner.clear().catch(error => console.error("Scanner clear failed.", error));
    };
  }, [isProcessing]);

  // Your JSX structure remains the same
  return (
    <div id="container">
      <header>
        <h1>Event Entry 🎟️</h1>
        <p>Point the camera at the ID card barcode</p>
      </header>
      <div id="qr-reader-wrapper">
        <div id="qr-reader"></div>
      </div>
      <div id="result" className={`${result.status} ${result.message ? 'visible' : ''}`}>
        {result.message}
      </div>
    </div>
  );
}

export default App;