import React, { useState, useEffect, useRef } from 'react';
import CryptoJS from 'crypto-js';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { supabase } from './supabase';
import './App.css';

function App() {
  const [result, setResult] = useState({ message: '', status: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef(null); // Ref to hold the video element
  const controlsRef = useRef(null); // Ref to hold the scanner controls

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

    // After 4 seconds, clear the message and allow scanning again
    setTimeout(() => {
      setResult({ message: '', status: '' });
      setIsProcessing(false);
    }, 4000);
  };

  // This useEffect runs only ONCE to initialize and clean up the scanner
  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    const startScanner = async () => {
      if (videoRef.current) {
        try {
          // Use decodeFromConstraints to directly ask for the back camera
          const streamControls = await codeReader.decodeFromConstraints(
            { video: { facingMode: 'environment' } },
            videoRef.current,
            (scanResult, err) => {
              if (scanResult && !isProcessing) {
                setIsProcessing(true); // Prevent multiple validations
                validatePRN(scanResult.getText());
              }
            }
          );
          // Store the controls so we can stop the stream later
          controlsRef.current = streamControls;
        } catch (err) {
          console.error("Error initializing scanner:", err);
          // Display an error to the user if the camera fails
          setResult({ status: 'invalid', message: '📷 Camera Error. Please grant permission and refresh.' });
        }
      }
    };

    startScanner();

    // Cleanup function: this is called when the component unmounts
    return () => {
      if (controlsRef.current) {
        // Use the correct method to stop the video stream and release the camera
        controlsRef.current.stop();
      }
    };
  }, [isProcessing]); // Dependency array still uses isProcessing to re-engage the listener loop

  return (
    <div id="container">
      <header>
        <h1>Event Entry Scanner 🎟️</h1>
        <p>Center the ID card's barcode in the box below</p>
      </header>
      <div id="qr-reader-wrapper">
        <video ref={videoRef} id="qr-reader-video" />
      </div>
      <div id="result" className={`${result.status} ${result.message ? 'visible' : ''}`}>
        {result.message}
      </div>
    </div>
  );
}

export default App;