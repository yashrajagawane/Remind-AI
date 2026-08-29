'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, XCircle, ScanFace } from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface FaceScanResult {
  rank: number;
  member_id: string;
  name: string;
  relationship: string;
  confidence_score: number;
  confidence_label: string;
  photo_url: string | null;
}

interface Props {
  patientId: string;
}

export default function CameraFeed({ patientId }: Props) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState<FaceScanResult | null>(null);
  const [isUnknown, setIsUnknown] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access camera. Please allow permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setScanResult(null);
    setIsUnknown(false);
  };

  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !isCameraActive || !patientId) return;

    setIsScanning(true);
    setScanResult(null);
    setIsUnknown(false);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg'));
      
      if (blob) {
        const formData = new FormData();
        formData.append('patient_id', patientId);
        formData.append('file', blob, 'scan.jpg');
        
        try {
          const response = await fetchApi('/faces/recognize', {
            method: 'POST',
            body: formData,
          });
          
          if (response.ok) {
            const json = await response.json();
            const data = json.data;
            
            if (data.matched && data.results && data.results.length > 0) {
              const match = data.results[0];
              setScanResult(match);
              
              if ('speechSynthesis' in window) {
                const msg = new SpeechSynthesisUtterance(`Hello. This is ${match.name}, your ${match.relationship}.`);
                window.speechSynthesis.speak(msg);
              }
            } else {
              setIsUnknown(true);
            }
          } else {
            console.error('API Error', await response.text());
          }
        } catch (error) {
          console.error('Scan failed', error);
        }
      }
    }
    setIsScanning(false);
  }, [isCameraActive, patientId]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white min-h-[50vh] rounded-3xl shadow-xl border border-brand/10">
      <div className="relative w-full max-w-2xl bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center shadow-inner">
        {!isCameraActive ? (
          <div className="text-gray-400 flex flex-col items-center">
            <Camera size={64} className="mb-4 opacity-50" />
            <span className="text-xl">Camera is off</span>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
        
        {isScanning && (
          <div className="absolute inset-0 bg-brand/20 animate-pulse border-4 border-brand rounded-2xl pointer-events-none" />
        )}

        {/* Overlay Results */}
        {scanResult && (
          <div className="absolute bottom-6 left-6 right-6 z-10 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg flex items-center gap-4">
            {scanResult.photo_url && (
              <img src={scanResult.photo_url} alt={scanResult.name} className="w-16 h-16 rounded-full object-cover border-2 border-brand" />
            )}
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{scanResult.name}</h3>
              <p className="text-lg text-brand font-medium">{scanResult.relationship}</p>
            </div>
            <div className="ml-auto flex items-center justify-center bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold">
              {scanResult.confidence_score > 0.8 ? 'High Match' : 'Match'}
            </div>
          </div>
        )}

        {isUnknown && (
          <div className="absolute bottom-6 left-6 right-6 z-10 bg-red-500/90 backdrop-blur-sm p-4 rounded-xl shadow-lg flex items-center justify-center">
            <h3 className="text-xl font-bold text-white">Face not recognized</h3>
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-8 w-full max-w-2xl justify-center">
        {!isCameraActive ? (
          <button
            onClick={startCamera}
            className="flex-1 flex items-center justify-center gap-3 bg-brand text-white py-6 px-8 rounded-2xl text-2xl font-semibold shadow-lg hover:bg-brand/90 transition-colors"
          >
            <Camera size={36} />
            Turn On Camera
          </button>
        ) : (
          <>
            <button
              onClick={captureAndScan}
              disabled={isScanning}
              className="flex-1 flex items-center justify-center gap-3 bg-success text-white py-6 px-8 rounded-2xl text-2xl font-semibold shadow-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <ScanFace size={36} />
              {isScanning ? 'Scanning...' : 'Scan Face'}
            </button>
            <button
              onClick={stopCamera}
              className="flex items-center justify-center gap-3 bg-gray-200 text-gray-800 py-6 px-8 rounded-2xl text-2xl font-semibold shadow hover:bg-gray-300 transition-colors"
            >
              <XCircle size={36} />
              Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}
