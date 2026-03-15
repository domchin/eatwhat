'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSession } from '@/lib/helpers';
import { MapPin, Globe, ArrowRight, Loader2 } from 'lucide-react';

const modes = [
  {
    id: 'mall' as const,
    Icon: MapPin,
    title: 'Browse by Restaurant',
    subtitle: 'Swipe real restaurants at VivoCity',
    accent: '#FF5252',
    bg: '#FFF5F5',
    border: '#FFCDD2',
    selectedBorder: '#FF5252',
    iconBg: 'linear-gradient(135deg, #FF5252, #FF8A80)',
  },
  {
    id: 'cuisine' as const,
    Icon: Globe,
    title: 'Browse by Cuisine',
    subtitle: 'Match on a cuisine type together',
    accent: '#4ECDC4',
    bg: '#F0FFFE',
    border: '#B2DFDB',
    selectedBorder: '#4ECDC4',
    iconBg: 'linear-gradient(135deg, #4ECDC4, #80CBC4)',
  },
];

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [choice, setChoice] = useState<'mall' | 'cuisine' | null>(null);

  const handleStart = async () => {
    if (!choice) return;
    setLoading(true);
    try {
      const session = await createSession(choice);
      router.push(`/swipe/${session.session_code}?type=${choice}`);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-lg mb-5"
            style={{ background: 'linear-gradient(135deg, #FF5252, #FF8A80)' }}
          >
            <span className="text-4xl">🍽️</span>
          </div>
          <h1 className="text-[42px] font-black tracking-tight text-gray-900 leading-none">
            EatWhat
          </h1>
          <p className="text-gray-500 mt-2 text-[15px] font-medium">
            Swipe. Match. Eat — together.
          </p>
        </div>

        {/* Mode selection */}
        <div className="space-y-3 mb-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest pl-1 mb-3">
            Choose a mode
          </p>
          {modes.map(({ id, Icon, title, subtitle, accent, bg, border, selectedBorder, iconBg }) => {
            const selected = choice === id;
            return (
              <button
                key={id}
                onClick={() => setChoice(id)}
                className="w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: selected ? bg : '#FFFFFF',
                  borderColor: selected ? selectedBorder : border,
                  boxShadow: selected ? `0 4px 16px -2px ${accent}33` : '0 2px 8px rgba(0,0,0,0.06)',
                  transform: selected ? 'scale(1.01)' : 'scale(1)',
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                    style={{ background: iconBg }}
                  >
                    <Icon size={22} color="white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 text-[15px]">{title}</div>
                    <div className="text-gray-500 text-sm mt-0.5">{subtitle}</div>
                  </div>
                  {selected && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: accent }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <button
          onClick={handleStart}
          disabled={!choice || loading}
          className="w-full py-[17px] rounded-2xl font-bold text-[16px] transition-all duration-200 flex items-center justify-center gap-2"
          style={
            choice && !loading
              ? {
                  background: 'linear-gradient(135deg, #FF5252, #FF1744)',
                  color: 'white',
                  boxShadow: '0 6px 20px rgba(255,82,82,0.4)',
                }
              : {
                  background: '#F3F4F6',
                  color: '#9CA3AF',
                  cursor: 'not-allowed',
                }
          }
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Creating session…
            </>
          ) : (
            <>
              Start Swiping
              <ArrowRight size={18} strokeWidth={2.5} />
            </>
          )}
        </button>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-8">
          Made for foodies in Singapore 🇸🇬
        </p>
      </div>
    </div>
  );
}
