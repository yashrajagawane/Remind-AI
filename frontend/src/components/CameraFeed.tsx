"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, XCircle, ScanFace } from "lucide-react";
import FaceResult from "./FaceResult";

export default function CameraFeed() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
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
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please allow permissions.");
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
  };

  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !isCameraActive) return;

    setIsScanning(true);
    setScanResult(null);

    // Create a canvas to grab the frame
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg"));
      
      if (blob) {
        const formData = new FormData();
        formData.append("file", blob, "scan.jpg");
        
        try {
          // Call FastAPI backend
          const response = await fetch("http://localhost:8000/api/v1/faces/recognize", {
            method: "POST",
            body: formData,
          });
          const data = await response.json();
          if (data && data.length > 0) {
            setScanResult(data[0]);
            // Voice feedback
            if ("speechSynthesis" in window) {
              const msg = new SpeechSynthesisUtterance(`Hello. This is ${data[0].name}, ${data[0].relationship}.`);
              window.speechSynthesis.speak(msg);
            }
          }
        } catch (error) {
          console.error("Scan failed", error);
        }
      }
    }
    setIsScanning(false);
  }, [isCameraActive]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-cream min-h-[50vh] rounded-xl shadow-lg border border-gray-100">
      <div className="relative w-full max-w-2xl bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center shadow-inner">
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
          <div className="absolute inset-0 bg-blue-500/20 animate-pulse border-4 border-blue-500 rounded-xl pointer-events-none" />
        )}

        {/* Overlay results */}
        {scanResult && (
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <FaceResult result={scanResult} />
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-8 w-full max-w-2xl justify-center">
        {!isCameraActive ? (
          <button
            onClick={startCamera}
            className="flex-1 flex items-center justify-center gap-3 bg-accent text-white py-6 px-8 rounded-2xl text-2xl font-semibold shadow-lg hover:bg-blue-600 transition-colors"
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
              {isScanning ? "Scanning..." : "Scan Face"}
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
