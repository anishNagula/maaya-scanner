import React, { useState, useEffect, useRef } from 'react';
import CryptoJS from 'crypto-js';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { supabase } from './supabase';
import './App.css';

function App() {
  const [result, setResult] = useState({ message: '', status: '' });
  // Use a ref to hold the scanner instance so it persists across re-renders
  const scannerRef = useRef(null);

  // This function is now the main control point after a successful scan
  const onScanSuccess = (decodedText) => {
    // 1. Immediately pause the scanner to prevent further scans
    if (scannerRef.current) {
      scannerRef.current.pause();
    }
    // 2. Run the validation logic
    validatePRN(decodedText);
  };

  const validatePRN = async (prn) => {
    if (!prn) return;

    const hashedPrn = CryptoJS.SHA256(prn.trim()).toString();

    try {
      const { data, error } = await supabase
        .from('students')
        .select('checked_in')
        .eq('id', hashedPrn)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        if (data.checked_in) {
          setResult({ status: 'invalid', message: '⚠️ Already Checked In!' });
        } else {
          setResult({ status: 'valid', message: '✅ Access Granted! Welcome.' });
          await supabase.from('students').update({ checked_in: true }).eq('id', hashedPrn);
        }
      } else {
        setResult({ status: 'invalid', message: '❌ Access Denied! PRN not found.' });
      }
    } catch (error) {
      console.error("Error connecting to Supabase:", error);
      setResult({ status: 'invalid', message: '🔌 DB Connection Error. Check console.' });
    }

    // After 4 seconds, clear the message and resume scanning
    setTimeout(() => {
      setResult({ message: '', status: '' });
      if (scannerRef.current) {
        scannerRef.current.resume();
      }
    }, 4000);
  };

  // This useEffect runs only ONCE when the component mounts
  useEffect(() => {
    // Create and configure the scanner
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        qrbox: { width: 250, height: 250 },
        fps: 10,
        facingMode: "environment",
        // Only allow scanning from the camera
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      },
      false // Verbose logs
    );

    // Store the instance in our ref
    scannerRef.current = scanner;
    
    // Start scanning
    scanner.render(onScanSuccess);

    // Cleanup function to clear the scanner on component unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => console.error("Scanner clear failed.", error));
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  return (
    <div id="container">
      <header>
        <h1>Event Entry Scanner 🎟️</h1>
        <p>Center the ID card's barcode in the box below</p>
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