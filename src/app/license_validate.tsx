"use client";
import { useSession } from "next-auth/react";

export default function LicenseValidate({ plan, onClose }: any) {
  const { data: session, status } = useSession();

  if (status === "loading") return null; // wait till session loads

  if (!session) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/70">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <p className="text-lg mb-4">Please log in to continue.</p>
          <button
            onClick={onClose}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      <div className="bg-white p-8 rounded-lg w-full max-w-md shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Activate Plan</h2>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Plan Name</label>
          <input
            type="text"
            value={plan.planName}
            readOnly
            className="w-full border text-gray-700 border-gray-300 rounded p-2 bg-gray-100"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">License Code</label>
          <input
            type="text"
            placeholder="Enter license code"
            className="w-full border border-gray-300 rounded p-2"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            Validate
          </button>
        </div>
      </div>
    </div>
  );
}
