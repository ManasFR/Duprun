'use client';

import Link from 'next/link';
import { signIn } from "next-auth/react";
import { ArrowRight, Video, Image, Music, Download } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Plan {
  id: number;
  planName: string;
  licenseId: number;
  retailPrice: number;
  salePrice: number;
}

export default function Home() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string>('');

  // Fetch plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/admin/plans');
        if (!response.ok) {
          throw new Error(`Failed to fetch plans: Status ${response.status}`);
        }
        const result = await response.json();
        if (result.data) {
          setPlans(result.data);
        } else {
          setError('No plans found');
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError(`Failed to load plans: ${err.message}`);
      }
    };
    fetchPlans();
  }, []);

  const handleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard/duprun" });
  };

  return (
    <div className="min-h-screen bg-black font-[Poppins] text-white">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold tracking-tight">DUPRUN</h1>
          <nav className="flex space-x-6">
            <Link href="/" className="text-gray-300 hover:text-white text-lg font-medium transition">Home</Link>
            <Link href="#features" className="text-gray-300 hover:text-white text-lg font-medium transition">Features</Link>
            <Link href="/about" className="text-gray-300 hover:text-white text-lg font-medium transition">About</Link>
            <Link href="/contact" className="text-gray-300 hover:text-white text-lg font-medium transition">Contact</Link>
            <button
              onClick={handleSignIn}
              className="bg-white text-black px-6 py-3 rounded-lg text-lg font-semibold hover:bg-gray-200 transition flex items-center gap-3"
            >
              Try DUPRUN <ArrowRight className="w-5 h-5" />
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-black py-28">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6">Create Stunning Zoom Videos with DUPRUN</h1>
          <p className="text-xl sm:text-2xl mb-10 max-w-3xl mx-auto text-gray-300">
            Transform your images into engaging zoom videos with smooth transitions, custom zoom points, and background music in just a few clicks. Trusted by over 8,600 creators.
          </p>
          <button
            onClick={handleSignIn}
            className="bg-white text-black px-10 py-4 rounded-lg text-xl font-semibold hover:bg-gray-200 transition"
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <h2 className="text-4xl font-extrabold text-white text-center mb-16">Why Choose DUPRUN?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="text-center p-8 bg-gray-900 rounded-xl shadow-lg">
              <Video className="w-14 h-14 text-white mx-auto mb-5" />
              <h3 className="text-2xl font-semibold text-white mb-3">Smooth Zoom Effects</h3>
              <p className="text-gray-300 text-lg">Add custom zoom points to create dynamic, professional video transitions with ease.</p>
            </div>
            <div className="text-center p-8 bg-gray-900 rounded-xl shadow-lg">
              <Image className="w-14 h-14 text-white mx-auto mb-5" />
              <h3 className="text-2xl font-semibold text-white mb-3">Multiple Image Support</h3>
              <p className="text-gray-300 text-lg">Combine multiple images into a single video with seamless slide transitions.</p>
            </div>
            <div className="text-center p-8 bg-gray-900 rounded-xl shadow-lg">
              <Music className="w-14 h-14 text-white mx-auto mb-5" />
              <h3 className="text-2xl font-semibold text-white mb-3">Add Background Music</h3>
              <p className="text-gray-300 text-lg">Enhance your videos with custom audio tracks for a more engaging experience.</p>
            </div>
            <div className="text-center p-8 bg-gray-900 rounded-xl shadow-lg">
              <Download className="w-14 h-14 text-white mx-auto mb-5" />
              <h3 className="text-2xl font-semibold text-white mb-3">Easy Export</h3>
              <p className="text-gray-300 text-lg">Download your videos in high-quality WebM format with a single click.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section id="pricing" className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <h2 className="text-4xl font-extrabold text-white text-center mb-16">Pricing Plans</h2>
          {error ? (
            <p className="text-red-400 text-center text-lg">{error}</p>
          ) : plans.length === 0 ? (
            <p className="text-gray-300 text-center text-lg">No plans available at the moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {plans.map((plan) => (
                <div key={plan.id} className="text-center p-8 bg-gray-900 rounded-xl shadow-lg">
                  <h3 className="text-2xl font-semibold text-white mb-3">{plan.planName}</h3>
                  <p className="text-gray-300 text-lg mb-4">
                    <span className="text-3xl font-bold text-white">${plan.salePrice.toFixed(2)}</span>
                    {plan.retailPrice !== plan.salePrice && (
                      <span className="text-gray-500 line-through ml-2">${plan.retailPrice.toFixed(2)}</span>
                    )}
                  </p>
                  <button
                    onClick={handleSignIn}
                    className="bg-white text-black px-6 py-3 rounded-lg text-lg font-semibold hover:bg-gray-200 transition"
                  >
                    Select Plan
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <h2 className="text-4xl font-extrabold text-white text-center mb-16">What Our Users Say</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="p-8 bg-gray-900 rounded-xl shadow-lg">
              <p className="text-gray-300 text-lg mb-4">"DUPRUN made my tutorial videos look so professional with minimal effort. The zoom effects are a game-changer!"</p>
              <p className="text-white font-semibold">Amit Sharma, Content Creator</p>
            </div>
            <div className="p-8 bg-gray-900 rounded-xl shadow-lg">
              <p className="text-gray-300 text-lg mb-4">"The ability to add music and export in WebM format is so smooth. DUPRUN is my go-to for quick video edits."</p>
              <p className="text-white font-semibold">Priya Patel, Educator</p>
            </div>
            <div className="p-8 bg-gray-900 rounded-xl shadow-lg">
              <p className="text-gray-300 text-lg mb-4">"Combining multiple images into one video was so easy. DUPRUN saved me hours of editing time!"</p>
              <p className="text-white font-semibold">Rahul Verma, Freelancer</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-24 bg-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h2 className="text-4xl font-extrabold text-white mb-6">Ready to Create Your Next Video?</h2>
          <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Join thousands of creators using DUPRUN to make professional zoom videos effortlessly. Start now and see the difference!
          </p>
          <button
            onClick={handleSignIn}
            className="bg-white text-black px-10 py-4 rounded-lg text-xl font-semibold hover:bg-gray-200 transition"
          >
            Start Creating Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            <div>
              <h3 className="text-xl font-semibold mb-5">DUPRUN</h3>
              <p className="text-gray-300 text-lg">Create professional zoom videos effortlessly with DUPRUN.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-5">Quick Links</h3>
              <ul className="space-y-3">
                <li><Link href="/" className="text-gray-300 hover:text-white text-lg transition">Home</Link></li>
                <li><Link href="#features" className="text-gray-300 hover:text-white text-lg transition">Features</Link></li>
                <li><Link href="/about" className="text-gray-300 hover:text-white text-lg transition">About</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-white text-lg transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-5">Follow Us</h3>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-300 hover:text-white text-lg transition">Twitter</a>
                <a href="#" className="text-gray-300 hover:text-white text-lg transition">LinkedIn</a>
                <a href="#" className="text-gray-300 hover:text-white text-lg transition">GitHub</a>
              </div>
            </div>
          </div>
          <div className="mt-10 text-center text-gray-300 text-lg">
            &copy; {new Date().getFullYear()} DUPRUN. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}