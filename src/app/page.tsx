'use client';

import Link from 'next/link';
import { signIn, useSession } from "next-auth/react";
import { ArrowRight, Video, Image, Music, Download, Check, X, Sparkles, Zap, Layers, Wand2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import LicenseValidate from "./license_validate";

interface Plan {
  id: number;
  planName: string;
  license_id: number;
  retailPrice: number;
  salePrice: number;
  features: string[];
  noWatermark: number;
  videos: number;
  watermark: number;
}

export default function Home() {
  const { data: session } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string>('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      }
    };
    fetchPlans();
  }, []);

  const handleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard/duprun" });
  };

  const handleSelectPlan = (plan: Plan) => {
    if (!session) {
      handleSignIn(); // redirect to Google login
      return;
    }
    setSelectedPlan(plan);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 font-sans text-white overflow-x-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-purple-500/20' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">DUPRUN</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-300 hover:text-white transition">Home</Link>
            <Link href="#features" className="text-gray-300 hover:text-white transition">Features</Link>
            <Link href="/about" className="text-gray-300 hover:text-white transition">About</Link>
            <Link href="/contact" className="text-gray-300 hover:text-white transition">Contact</Link>
            <button
              onClick={handleSignIn}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2.5 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 flex items-center gap-2 group"
            >
              Try DUPRUN
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
            <span className="text-purple-300 text-sm font-semibold">✨ Trusted by 8,600+ Creators</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            Create <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Stunning</span>
            <br />Zoom Videos with DUPRUN
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Transform your images into engaging zoom videos with smooth transitions, custom zoom points, and background music in just a few clicks.
          </p>
          <button
            onClick={handleSignIn}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-10 py-4 rounded-full text-lg font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to Create
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Amazing Videos</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Powerful features designed for creators who demand excellence</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Video, title: 'Smooth Zoom Effects', desc: 'Create dynamic zoom animations with precise control over timing and positioning', gradient: 'from-purple-500 to-pink-500' },
              { icon: Layers, title: 'Multi-Image Support', desc: 'Combine unlimited images with seamless transitions for storytelling', gradient: 'from-blue-500 to-cyan-500' },
              { icon: Music, title: 'Background Music', desc: 'Add your favorite tracks to enhance emotional impact and engagement', gradient: 'from-green-500 to-emerald-500' },
              { icon: Wand2, title: 'Custom Backgrounds', desc: 'Choose from stunning backgrounds or upload your own designs', gradient: 'from-orange-500 to-red-500' },
              { icon: Sparkles, title: 'Fade Effects', desc: 'Professional transitions that make your videos flow seamlessly', gradient: 'from-violet-500 to-purple-500' },
              { icon: Image, title: 'Text Overlays', desc: 'Add animated text to communicate your message clearly', gradient: 'from-pink-500 to-rose-500' },
              { icon: Zap, title: 'Instant Export', desc: 'Download high-quality videos in WebM format with one click', gradient: 'from-yellow-500 to-orange-500' },
              { icon: Download, title: 'No Watermark', desc: 'Premium plans include watermark-free exports for professional use', gradient: 'from-teal-500 to-cyan-500' }
            ].map((feature, idx) => (
              <div key={idx} className="group relative bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section id="pricing" className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Pricing Plans</span>
            </h2>
            <p className="text-gray-400 text-lg">Simple, transparent pricing that grows with you</p>
          </div>

          {error ? (
            <p className="text-red-400 text-center text-lg">{error}</p>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
              <p className="text-gray-400 mt-4">Loading plans...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan, idx) => {
                const isPopular = idx === 1;
                return (
                  <div key={plan.id} className={`relative bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border rounded-3xl p-8 transition-all duration-300 hover:transform hover:scale-105 ${isPopular ? 'border-purple-500 shadow-2xl shadow-purple-500/20' : 'border-white/10 hover:border-purple-500/50'}`}>
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.planName}</h3>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          ${plan.salePrice.toFixed(2)}
                        </span>
                        {plan.retailPrice !== plan.salePrice && (
                          <span className="text-2xl text-gray-500 line-through">${plan.retailPrice.toFixed(2)}</span>
                        )}
                      </div>
                      {plan.retailPrice !== plan.salePrice && (
                        <div className="mt-2 inline-block px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                          <span className="text-green-400 text-sm font-semibold">
                            Save ${(plan.retailPrice - plan.salePrice).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-3 text-gray-300">
                        <div className="w-5 h-5 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <Video className="w-3 h-3 text-purple-400" />
                        </div>
                        <span>{plan.videos} videos per month</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-gray-300">
                        {plan.noWatermark ? (
                          <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-green-400" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <X className="w-3 h-3 text-red-400" />
                          </div>
                        )}
                        <span>{plan.noWatermark ? 'No Watermark' : 'With Watermark'}</span>
                      </div>

                      {plan.features && plan.features.length > 0 && (
                        <>
                          <div className="border-t border-white/10 my-4"></div>
                          {plan.features.map((feature, i) => (
                            <div key={i} className="flex items-start gap-3 text-gray-300">
                              <Check className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                              <span className="text-sm leading-relaxed">{feature}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-300 ${
                        isPopular
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50'
                          : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      Select Plan
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Render modal once at component level - ORIGINAL LOGIC PRESERVED */}
        {showModal && selectedPlan && (
          <LicenseValidate plan={selectedPlan} />
        )}
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What Our <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Users Say</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Amit Sharma', role: 'Content Creator', text: 'DUPRUN made my tutorial videos look so professional with minimal effort. The zoom effects are a game-changer!' },
              { name: 'Priya Patel', role: 'Educator', text: 'The ability to add music and export in WebM format is so smooth. DUPRUN is my go-to for quick video edits.' },
              { name: 'Rahul Verma', role: 'Freelancer', text: 'Combining multiple images into one video was so easy. DUPRUN saved me hours of editing time!' }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed italic">&quot;{testimonial.text}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-24 px-6 relative border-t border-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-white mb-6">Ready to Create Your Next Video?</h2>
          <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Join thousands of creators using DUPRUN to make professional zoom videos effortlessly. Start now and see the difference!
          </p>
          <button
            onClick={handleSignIn}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-10 py-4 rounded-full text-lg font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
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
