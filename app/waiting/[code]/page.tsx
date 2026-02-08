'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSessionByCode, getOptionDetails } from '@/lib/helpers';
import { supabase } from '@/lib/supabase';

export default function WaitingPage() {
  const params = useParams();
  const router = useRouter();
  const sessionCode = params.code as string;
  
  const [session, setSession] = useState<any>(null);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [matched, setMatched] = useState<any>(null);
  const [matchedItem, setMatchedItem] = useState<any>(null);

  useEffect(() => {
    loadSession();
    setShareLink(`${window.location.origin}/swipe/${sessionCode}?type=cuisine`); // You might want to store type in session
  }, [sessionCode]);

  useEffect(() => {
    if (!session) return;

    // Subscribe to session changes
    const channel = supabase
      .channel(`session-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${session.id}`,
        },
        async (payload) => {
          setSession(payload.new);
          if (payload.new.matched_option_id) {
            const item = await getOptionDetails(
              payload.new.matched_option_id,
              payload.new.matched_option_type
            );
            setMatchedItem(item);
            setMatched(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const loadSession = async () => {
    try {
      const sessionData = await getSessionByCode(sessionCode);
      setSession(sessionData);
      
      // Check if already matched
      if (sessionData.matched_option_id) {
        const item = await getOptionDetails(
          sessionData.matched_option_id,
          sessionData.matched_option_type
        );
        setMatchedItem(item);
        setMatched(true);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (matched) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="text-8xl mb-8 animate-bounce">🎉</div>
          <h1 className="text-4xl font-bold text-primary mb-4">It's a Match!</h1>
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
            <div className="text-6xl mb-4">🍽️</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {matchedItem?.name}
            </h2>
            {matchedItem?.description && (
              <p className="text-gray-600 mt-4">{matchedItem.description}</p>
            )}
            {matchedItem?.cuisine_type && (
              <div className="text-lg text-gray-500 mt-4">
                {matchedItem.cuisine_type} {matchedItem.price_range && `• ${matchedItem.price_range}`}
              </div>
            )}
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full py-4 rounded-xl bg-primary text-white font-semibold text-lg hover:bg-red-500 transition-all shadow-lg"
          >
            Start New Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Waiting for Your Friend</h1>
          <p className="text-gray-600">
            You've made your selections! Share the link below with your friend to find a match.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Code
            </label>
            <div className="text-4xl font-bold text-primary text-center py-4 bg-pink-50 rounded-xl">
              {sessionCode}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-red-500 transition-all"
              >
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              This page will automatically update when your friend finds a match
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.reload()}
            className="text-primary hover:text-red-500 font-medium"
          >
            🔄 Refresh manually
          </button>
        </div>
      </div>
    </div>
  );
}
