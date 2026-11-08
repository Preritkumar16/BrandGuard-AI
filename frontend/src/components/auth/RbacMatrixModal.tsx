import React from 'react';

export function RbacMatrixModal({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl">
        <h2 className="text-xl font-bold mb-4">RBAC Matrix</h2>
        <p className="text-gray-600">Role-Based Access Control configuration view.</p>
        <button 
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}