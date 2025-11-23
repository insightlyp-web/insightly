// components/student/QRScanner.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "./Card";

interface QRScannerProps {
  onScan: (sessionCode: string) => Promise<void>;
  loading?: boolean;
}

export function QRScanner({ onScan, loading }: QRScannerProps) {
  const [error, setError] = useState<string>("");
  const [scanning, setScanning] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || loading || !scanning) return;

    let isMounted = true;
    let html5QrCode: any = null;

    const startScanner = async () => {
      try {
        // Dynamically import html5-qrcode (client-side only)
        const { Html5Qrcode } = await import("html5-qrcode");
        
        html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText: string) => {
            if (!isMounted || !scanning || loading) return;
            
            setScanning(false);
            setError("");
            
            html5QrCode?.stop().then(() => {
              onScan(decodedText).catch((err: any) => {
                if (isMounted) {
                  setError(err.message || "Failed to mark attendance");
                  setScanning(true);
                  // Restart scanner
                  startScanner().catch(() => {});
                }
              });
            }).catch(() => {});
          },
          (errorMessage: string) => {
            // Ignore scanning errors (continuous scanning)
          }
        );
      } catch (err: any) {
        if (isMounted) {
          console.error("QR Scanner error:", err);
          setError("Camera access denied or not available. Please allow camera permissions.");
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (html5QrCode) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, [loading, scanning, isClient, onScan]);

  const handleRestart = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
    }
    setScanning(true);
    setError("");
  };

  if (!isClient) {
    return (
      <Card>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Scan QR Code</h3>
            <p className="text-sm text-gray-500">Loading scanner...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Scan QR Code</h3>
          <p className="text-sm text-gray-500">
            Point your camera at the attendance QR code to mark your attendance
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div
          ref={containerRef}
          id="qr-reader"
          className="rounded-lg overflow-hidden bg-gray-900"
          style={{ minHeight: "400px" }}
        />

        {!scanning && (
          <div className="flex justify-center">
            <button
              onClick={handleRestart}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Scan Again
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
