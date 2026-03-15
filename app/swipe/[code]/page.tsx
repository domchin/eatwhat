'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { X, Heart, RefreshCw } from 'lucide-react';
import SwipeCard from '@/components/SwipeCard';
import {
  getSessionByCode,
  getCuisines,
  getRestaurantsByMall,
  recordSwipe,
  getPerson1Swipes,
  checkForMatch,
  markPerson1Completed,
  getOptionDetails,
} from '@/lib/helpers';
import { supabase } from '@/lib/supabase';

export default function SwipePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionCode = params.code as string;
  const type = searchParams.get('type') as 'mall' | 'cuisine';

  const [session, setSession] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [personNumber, setPersonNumber] = useState<1 | 2>(1);
  const [swipedRight, setSwipedRight] = useState<string[]>([]);
  const [matched, setMatched] = useState(false);
  const [matchedItem, setMatchedItem] = useState<any>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => {
    loadSession();
  }, [sessionCode]);

  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`session-${session.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${session.id}`,
      }, (payload) => {
        setSession(payload.new);
        if (payload.new.matched_option_id && personNumber === 1) {
          loadMatchedItem(payload.new.matched_option_id, payload.new.matched_option_type);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, personNumber]);

  const loadSession = async () => {
    try {
      const sessionData = await getSessionByCode(sessionCode);
      setSession(sessionData);
      const isPerson2 = !!sessionData.person1_completed;
      setPersonNumber(isPerson2 ? 2 : 1);
      if (isPerson2) {
        await getPerson1Swipes(sessionData.id); // preload
      }
      await loadItems();
      setLoading(false);
    } catch {
      alert('Session not found');
      router.push('/');
    }
  };

  const loadItems = async () => {
    try {
      let data;
      if (type === 'cuisine') {
        data = await getCuisines();
      } else {
        const { data: mallData } = await supabase.from('malls').select('id').eq('name', 'VivoCity').single();
        if (mallData) data = await getRestaurantsByMall(mallData.id);
      }
      setItems((data ?? []).sort(() => Math.random() - 0.5));
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const loadMatchedItem = async (optionId: string, optionType: string) => {
    const item = await getOptionDetails(optionId, optionType as 'cuisine' | 'restaurant');
    setMatchedItem(item);
    setMatched(true);
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!session || currentIndex >= items.length || isSwiping) return;
    setIsSwiping(true);

    const currentItem = items[currentIndex];
    const isRightSwipe = direction === 'right';

    try {
      await recordSwipe(session.id, personNumber, currentItem.id, type === 'cuisine' ? 'cuisine' : 'restaurant', isRightSwipe);

      if (isRightSwipe) {
        const newSwipedRight = [...swipedRight, currentItem.id];
        setSwipedRight(newSwipedRight);

        if (personNumber === 1 && newSwipedRight.length === 5) {
          await markPerson1Completed(session.id);
          router.push(`/waiting/${sessionCode}`);
          return;
        }

        if (personNumber === 2) {
          const match = await checkForMatch(session.id, currentItem.id);
          if (match) {
            setMatchedItem(currentItem);
            setMatched(true);
            return;
          }
        }
      }

      setCurrentIndex((i) => i + 1);
    } catch (error) {
      console.error('Error recording swipe:', error);
    } finally {
      setTimeout(() => setIsSwiping(false), 350);
    }
  };

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🍽️</div>
          <p className="text-gray-500 font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  /* ─── Match screen ─── */
  if (matched && matchedItem) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5">
        <div className="w-full max-w-sm text-center">
          <div className="text-7xl mb-6 animate-bounce">🎉</div>
          <h1 className="text-4xl font-black text-gray-900 mb-1">It's a Match!</h1>
          <p className="text-gray-500 mb-8 text-[15px]">You both want this — great taste!</p>

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

  /* ─── Out of options ─── */
  if (currentIndex >= items.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5">
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-4">😅</div>
          <h1 className="text-3xl font-black text-gray-900 mb-3">
            {personNumber === 2 ? 'No Match Found' : 'All Done!'}
          </h1>
          <p className="text-gray-500 mb-8">
            {personNumber === 2
              ? 'Different tastes this time — try again!'
              : "You've gone through all options."}
          </p>
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

  const progressMax = 5;
  const progressFilled = Math.min(swipedRight.length, progressMax);

  /* ─── Main swipe UI ─── */
  return (
    <div className="min-h-screen flex flex-col" style={{ maxWidth: '440px', margin: '0 auto' }}>
      {/* Header */}
      <div className="px-5 pt-10 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">EatWhat</h1>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            {personNumber === 1 ? 'Pick your top 5' : 'Find a match'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-3 py-1.5 rounded-xl tracking-widest"
            style={{ background: '#FFF5F5', color: '#FF5252' }}
          >
            {sessionCode}
          </span>
          <span className="text-xs text-gray-400 font-medium">
            {currentIndex + 1}/{items.length}
          </span>
        </div>
      </div>

      {/* Progress (Person 1 only) */}
      {personNumber === 1 && (
        <div className="px-5 pb-3">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: progressMax }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-all duration-300"
                style={{
                  background: i < progressFilled
                    ? 'linear-gradient(90deg, #FF5252, #FF8A80)'
                    : '#E5E7EB',
                }}
              />
            ))}
            <span className="text-xs text-gray-400 ml-1 font-medium whitespace-nowrap">
              {progressFilled}/5
            </span>
          </div>
        </div>
      )}

      {/* Card stack */}
      <div className="flex-1 px-5 relative" style={{ minHeight: '460px' }}>
        {/* Back card placeholder */}
        {currentIndex + 1 < items.length && (
          <div
            className="absolute inset-x-5 rounded-3xl bg-white"
            style={{
              top: '12px',
              bottom: 0,
              transform: 'scale(0.95)',
              opacity: 0.6,
              boxShadow: '0 4px 16px -4px rgba(0,0,0,0.08)',
            }}
          />
        )}

        {/* Active card */}
        <div className="absolute inset-x-5 top-0 bottom-0">
          <SwipeCard
            key={items[currentIndex]?.id}
            item={items[currentIndex]}
            onSwipe={handleSwipe}
            itemType={type === 'cuisine' ? 'cuisine' : 'restaurant'}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-5 pb-10 pt-5 flex items-center justify-center gap-8">
        <button
          onClick={() => handleSwipe('left')}
          disabled={isSwiping}
          className="w-[68px] h-[68px] rounded-full bg-white flex items-center justify-center transition-all duration-150 active:scale-95 disabled:opacity-50"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
        >
          <X size={28} color="#EF4444" strokeWidth={2.5} />
        </button>

        <button
          onClick={() => handleSwipe('right')}
          disabled={isSwiping}
          className="w-[80px] h-[80px] rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #FF5252, #FF1744)',
            boxShadow: '0 6px 20px rgba(255,82,82,0.4)',
          }}
        >
          <Heart size={30} color="white" fill="white" strokeWidth={0} />
        </button>

        <button
          onClick={() => handleSwipe('left')}
          disabled={isSwiping}
          className="w-[68px] h-[68px] rounded-full bg-white flex items-center justify-center transition-all duration-150 active:scale-95 disabled:opacity-50 opacity-0 pointer-events-none"
        >
          {/* spacer to keep heart centered */}
        </button>
      </div>
    </div>
  );
}
