'use client';

import { useState } from 'react';

interface Props {
  plan: {
    id: number;
    planName: string;
    // Add other plan fields if needed
  };
  onClose?: () => void;  // optional bana diya
}

export default function LicenseValidate({ plan, onClose }: Props) {
  const [licenseCode, setLicenseCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/license/validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          licenseCode,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage('✅ License validated successfully!');
        // Success pe direct dashboard pe bhej de
        window.location.href = '/dashboard/duprun';
      } else {
        setMessage(`❌ ${data.message || 'Invalid license code'}`);
      }
    } catch (err) {
      console.error(err);
      setMessage('Server error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-900 p-8 rounded-xl shadow-lg max-w-md w-full text-center relative">
        <button
          onClick={onClose}  // agar pass kiya to close karega, warna kuch nahi
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl"
        >
          ×
        </button>

        <h2 className="text-2xl font-semibold text-white mb-4">
          Validate License for <span className="text-blue-400">{plan.planName}</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Enter License Code"
            value={licenseCode}
            onChange={(e) => setLicenseCode(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white focus:outline-none"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-white text-black px-6 py-3 rounded-lg text-lg font-semibold hover:bg-gray-200 transition w-full"
          >
            {loading ? 'Validating...' : 'Validate License'}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-lg text-gray-300">{message}</p>
        )}
      </div>
    </div>
  );
}