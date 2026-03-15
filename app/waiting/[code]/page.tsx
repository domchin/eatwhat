'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Copy, Check, Share2 } from 'lucide-react';
import { getSessionByCode, getOptionDetails } from '@/lib/helpers';
import { supabase } from '@/lib/supabase';

export default function WaitingPage() {
  const params = useParams();
  const router = useRouter();
  const sessionCode = params.code as string;

  const [session, setSession] = useState<any>(null);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [matched, setMatched] = useState(false);
  const [matchedItem, setMatchedItem] = useState<any>(null);

  useEffect(() => {
    loadSession();
  }, [sessionCode]);

  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`waiting-${session.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${session.id}`,
      }, async (payload) => {
        setSession(payload.new);
        if (payload.new.matched_option_id) {
          const item = await getOptionDetails(payload.new.matched_option_id, payload.new.matched_option_type);
          setMatchedItem(item);
          setMatched(true);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session]);

  const loadSession = async () => {
    try {
      const sessionData = await getSessionByCode(sessionCode);
      setSession(sessionData);
      // Use stored session_type so person 2 gets the right mode
      const sType = sessionData.session_type || 'cuisine';
      setShareLink(`${window.location.origin}/swipe/${sessionCode}?type=${sType}`);
      if (sessionData.matched_option_id) {
        const item = await getOptionDetails(sessionData.matched_option_id, sessionData.matched_option_type);
        setMatchedItem(item);
        setMatched(true);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'EatWhat – Join my session', url: shareLink });
    } else {
      copyToClipboard();
    }
  };

  /* ─── Match screen ─── */
  if (matched && matchedItem) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5">
        <div className="w-full max-w-sm text-center">
          <div className="text-7xl mb-6 animate-bounce">🎉</div>
          <h1 className="text-4xl font-black text-gray-900 mb-1">It's a Match!</h1>
          <p className="text-gray-500 mb-8 text-[15px]">Your friend found a match!</p>

          <div className="bg-white rounded-3xl p-6 mb-6 text-left"
               style={{ boxShadow: '0 8px 32px -4px rgba(0,0,0,0.14)' }}>
            {(matchedItem.logo_url || matchedItem.image_url) && (
              <div className="flex justify-center mb-4 p-4 bg-gray-50 rounded-2xl">
                <img
                  src={matchedItem.logo_url || matchedItem.image_url}
                  alt={matchedItem.name}
                  className="object-contain"
                  style={{ maxHeight: '80px', maxWidth: '160px' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
            <h2 className="text-2xl font-black text-gray-900 mb-2">{matchedItem.name}</h2>
            <div className="flex gap-2 flex-wrap mb-3">
              {matchedItem.cuisine_type && (
                <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 text-xs font-bold">
                  {matchedItem.cuisine_type}
                </span>
              )}
              {matchedItem.price_range && (
                <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold">
                  {matchedItem.price_range}
                </span>
              )}
            </div>
            {matchedItem.description && (
              <p className="text-gray-500 text-sm leading-relaxed">{matchedItem.description}</p>
            )}
          </div>

          <button
            onClick={() => router.push('/')}
            className="w-full py-4 rounded-2xl font-bold text-white text-[16px]"
            style={{ background: 'linear-gradient(135deg, #FF5252, #FF1744)', boxShadow: '0 6px 20px rgba(255,82,82,0.35)' }}
          >
            Start New Session
          </button>
        </div>
      </div>
    );
  }

  /* ─── Waiting screen ─── */
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm">

        {/* Spinner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-card mb-5">
            <div className="w-10 h-10 border-4 border-gray-100 border-t-primary rounded-full animate-spin" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Waiting for your friend</h1>
          <p className="text-gray-500 text-[14px] leading-relaxed">
            Share the code below — they'll see your match the moment it happens.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 space-y-5"
             style={{ boxShadow: '0 8px 32px -4px rgba(0,0,0,0.12)' }}>

          {/* Session code */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Session Code
            </p>
            <div
              className="text-center py-4 px-6 rounded-2xl"
              style={{ background: '#FFF5F5' }}
            >
              <span className="text-4xl font-black tracking-[0.2em]" style={{ color: '#FF5252' }}>
                {sessionCode}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">or share link</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Share link */}
          <div>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-3 bg-gray-50 rounded-xl text-xs text-gray-500 font-mono truncate">
                {shareLink}
              </div>
              <button
                onClick={copyToClipboard}
                className="px-4 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center gap-1.5"
                style={{
                  background: copied ? '#ECFDF5' : '#FFF5F5',
                  color: copied ? '#10B981' : '#FF5252',
                }}
              >
                {copied ? <Check size={15} strokeWidth={2.5} /> : <Copy size={15} strokeWidth={2} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Native share */}
          <button
            onClick={shareNative}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ background: '#F9FAFB', color: '#374151' }}
          >
            <Share2 size={15} />
            Share with friend
          </button>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          This page updates automatically when a match is found ✨
        </p>
      </div>
    </div>
  );
}
