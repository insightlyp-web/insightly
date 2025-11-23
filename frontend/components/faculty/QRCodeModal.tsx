// components/faculty/QRCodeModal.tsx
"use client";

import dynamic from "next/dynamic";

const QRCodeSVG = dynamic(() => import("qrcode.react").then((mod) => mod.QRCodeSVG), {
  ssr: false,
});

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionCode: string;
  courseName: string;
}

export function QRCodeModal({ isOpen, onClose, sessionCode, courseName }: QRCodeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Attendance Session QR Code</h3>
        <p className="text-sm text-gray-500 mb-4">{courseName}</p>
        
        <div className="flex justify-center mb-4">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <QRCodeSVG value={sessionCode} size={200} />
          </div>
        </div>
        
        <div className="text-center mb-4">
          <p className="text-sm font-medium text-gray-700">Session Code:</p>
          <p className="text-lg font-mono text-blue-600">{sessionCode}</p>
        </div>
        
        <p className="text-xs text-gray-500 text-center mb-4">
          Students can scan this QR code to mark their attendance
        </p>
        
        <button
          onClick={onClose}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}

