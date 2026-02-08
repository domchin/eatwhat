'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSession } from '@/lib/helpers';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [choice, setChoice] = useState<'mall' | 'cuisine' | null>(null);

  const handleStart = async () => {
    if (!choice) return;
    
    setLoading(true);
    try {
      const session = await createSession();
      router.push(`/swipe/${session.session_code}?type=${choice}`);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-primary mb-4">🍽️ EatWhat</h1>
          <p className="text-gray-600 text-lg">
            Can't decide what to eat? Swipe and match with your friends!
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
            What are you looking for?
          </h2>

          <button
            onClick={() => setChoice('mall')}
            className={`w-full p-6 rounded-2xl border-2 transition-all ${
              choice === 'mall'
                ? 'border-primary bg-pink-50 shadow-lg scale-105'
                : 'border-gray-200 hover:border-primary hover:shadow-md'
            }`}
          >
            <div className="text-5xl mb-3">🏢</div>
            <div className="text-xl font-semibold text-gray-800">Food at a Mall</div>
            <div className="text-sm text-gray-500 mt-2">Browse restaurants in VivoCity</div>
          </button>

          <button
            onClick={() => setChoice('cuisine')}
            className={`w-full p-6 rounded-2xl border-2 transition-all ${
              choice === 'cuisine'
                ? 'border-primary bg-pink-50 shadow-lg scale-105'
                : 'border-gray-200 hover:border-primary hover:shadow-md'
            }`}
          >
            <div className="text-5xl mb-3">🌍</div>
            <div className="text-xl font-semibold text-gray-800">Cuisine Type</div>
            <div className="text-sm text-gray-500 mt-2">Choose your favorite cuisines</div>
          </button>

          <button
            onClick={handleStart}
            disabled={!choice || loading}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
              choice && !loading
                ? 'bg-primary text-white hover:bg-red-500 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Creating Session...' : 'Start Swiping'}
          </button>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Made for couples and friends in Singapore 🇸🇬</p>
        </div>
      </div>
    </div>
  );
}
