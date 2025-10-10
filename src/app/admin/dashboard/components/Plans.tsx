'use client';

import { useState, useEffect } from 'react';

interface License {
  id: number;
  name: string;
}

interface Plan {
  id: number;
  planName: string;
  licenseId: number;
  retailPrice: number;
  salePrice: number;
}

export default function Plans() {
  const [formData, setFormData] = useState({
    planName: '',
    licenseId: '',
    retailPrice: '',
    salePrice: '',
  });
  const [licenses, setLicenses] = useState<License[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch licenses for dropdown and plans for table
  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        const response = await fetch('/api/admin/license');
        if (!response.ok) {
          throw new Error(`Failed to fetch licenses: Status ${response.status}`);
        }
        const result = await response.json();
        console.log('Fetched licenses:', result);
        if (result.data) {
          setLicenses(result.data);
        } else {
          setMessage('No licenses found');
        }
      } catch (error: any) {
        console.error('Error fetching licenses:', error);
        setMessage(`Failed to load licenses: ${error.message}`);
      }
    };

    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/admin/plans');
        if (!response.ok) {
          throw new Error(`Failed to fetch plans: Status ${response.status}`);
        }
        const result = await response.json();
        console.log('Fetched plans:', result);
        if (result.data) {
          setPlans(result.data);
        } else {
          setMessage('No plans found');
        }
      } catch (error: any) {
        console.error('Error fetching plans:', error);
        setMessage(`Failed to load plans: ${error.message}`);
      }
    };

    fetchLicenses();
    fetchPlans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const payload = {
        planName: formData.planName,
        licenseId: parseInt(formData.licenseId),
        retailPrice: parseFloat(formData.retailPrice),
        salePrice: parseFloat(formData.salePrice),
      };

      console.log('Sending payload:', payload);

      const response = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('Server response:', result);

      if (!response.ok) {
        throw new Error(result.details || result.error || `Failed to create plan: Status ${response.status}`);
      }

      if (result.data) {
        setMessage('Plan created successfully!');
        setFormData({ planName: '', licenseId: '', retailPrice: '', salePrice: '' });
        
        // Refresh plans
        const refreshed = await fetch('/api/admin/plans');
        if (refreshed.ok) {
          const refreshedData = await refreshed.json();
          setPlans(refreshedData.data);
        }
      } else {
        setMessage(result.error || 'Something went wrong');
      }
    } catch (error: any) {
      console.error('Error creating plan:', error);
      setMessage(`Error creating plan: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <section className="bg-gray-900 p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">Manage Plans</h2>
      <p className="text-gray-300 text-lg">Create and manage subscription plans.</p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-gray-300 block mb-1">Plan Name</label>
          <input
            type="text"
            name="planName"
            value={formData.planName}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-lg"
            placeholder="Enter plan name"
            required
          />
        </div>
        <div>
          <label className="text-gray-300 block mb-1">License</label>
          <select
            name="licenseId"
            value={formData.licenseId}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-lg"
            required
          >
            <option value="" disabled>Select a license</option>
            {licenses.length === 0 ? (
              <option disabled>No licenses available</option>
            ) : (
              licenses.map((license) => (
                <option key={license.id} value={license.id}>
                  {license.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label className="text-gray-300 block mb-1">Retail Price ($)</label>
          <input
            type="number"
            name="retailPrice"
            value={formData.retailPrice}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-lg"
            placeholder="Enter retail price"
            min="0"
            step="0.01"
            required
          />
        </div>
        <div>
          <label className="text-gray-300 block mb-1">Sale Price ($)</label>
          <input
            type="number"
            name="salePrice"
            value={formData.salePrice}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded-lg"
            placeholder="Enter sale price"
            min="0"
            step="0.01"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Create Plan'}
        </button>
        {message && (
          <p className={message.includes('Error') || message.includes('Failed') ? 'text-red-400' : 'text-green-400'}>
            {message}
          </p>
        )}
      </form>

      {/* Plans Table */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Available Plans</h3>
        {plans.length === 0 ? (
          <p className="text-gray-400">No plans found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="py-2 px-4">Plan Name</th>
                  <th className="px-4">License</th>
                  <th className="px-4">Retail Price</th>
                  <th className="px-4">Sale Price</th>
                  <th className="px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id} className="border-t border-gray-700 hover:bg-gray-800">
                    <td className="py-3 px-4">{plan.planName}</td>
                    <td className="px-4">
                      {licenses.find((license) => license.id === plan.licenseId)?.name || 'Unknown'}
                    </td>
                    <td className="px-4">${plan.retailPrice.toFixed(2)}</td>
                    <td className="px-4">${plan.salePrice.toFixed(2)}</td>
                    <td className="px-4">
                      <button className="text-blue-400 hover:text-blue-300">Edit</button>
                      <button className="text-red-400 hover:text-red-300 ml-4">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}