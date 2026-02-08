'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
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
  const [person1Selections, setPerson1Selections] = useState<any[]>([]);
  const [swipedRight, setSwipedRight] = useState<string[]>([]);
  const [matched, setMatched] = useState<any>(null);
  const [matchedItem, setMatchedItem] = useState<any>(null);

  useEffect(() => {
    loadSession();
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
        (payload) => {
          setSession(payload.new);
          if (payload.new.matched_option_id && personNumber === 1) {
            loadMatchedItem(payload.new.matched_option_id, payload.new.matched_option_type);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, personNumber]);

  const loadSession = async () => {
    try {
      const sessionData = await getSessionByCode(sessionCode);
      setSession(sessionData);

      // Determine if this is person 1 or person 2
      if (!sessionData.person1_completed) {
        setPersonNumber(1);
        await loadItems();
      } else {
        setPersonNumber(2);
        const p1Swipes = await getPerson1Swipes(sessionData.id);
        setPerson1Selections(p1Swipes);
        await loadItems();
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading session:', error);
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
        // For now, hardcode VivoCity mall ID - you'll need to get this from your database
        const vivoData = await supabase.from('malls').select('id').eq('name', 'VivoCity').single();
        if (vivoData.data) {
          data = await getRestaurantsByMall(vivoData.data.id);
        }
      }
      
      // Shuffle the items
      const shuffled = data?.sort(() => Math.random() - 0.5) || [];
      setItems(shuffled);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const loadMatchedItem = async (optionId: string, optionType: string) => {
    try {
      const item = await getOptionDetails(optionId, optionType as 'cuisine' | 'restaurant');
      setMatchedItem(item);
      setMatched(true);
    } catch (error) {
      console.error('Error loading matched item:', error);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!session || currentIndex >= items.length) return;

    const currentItem = items[currentIndex];
    const isRightSwipe = direction === 'right';

    try {
      await recordSwipe(
        session.id,
        personNumber,
        currentItem.id,
        type === 'cuisine' ? 'cuisine' : 'restaurant',
        isRightSwipe
      );

      if (isRightSwipe) {
        const newSwipedRight = [...swipedRight, currentItem.id];
        setSwipedRight(newSwipedRight);

        // Check if person 1 has 5 selections
        if (personNumber === 1 && newSwipedRight.length === 5) {
          await markPerson1Completed(session.id);
          router.push(`/waiting/${sessionCode}`);
          return;
        }

        // Check for match if person 2
        if (personNumber === 2) {
          const match = await checkForMatch(session.id, currentItem.id);
          if (match) {
            setMatched(match);
            setMatchedItem(currentItem);
            return;
          }
        }
      }

      setCurrentIndex(currentIndex + 1);
    } catch (error) {
      console.error('Error recording swipe:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (matched) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="text-8xl mb-8 animate-bounce">🎉</div>
          <h1 className="text-4xl font-bold text-primary mb-4">It's a Match!</h1>
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
            <div className="text-6xl mb-4">
              {type === 'cuisine' ? '🍽️' : '🍴'}
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {matchedItem?.name}
            </h2>
            {matchedItem?.description && (
              <p className="text-gray-600 mt-4">{matchedItem.description}</p>
            )}
            {type === 'mall' && matchedItem?.cuisine_type && (
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

  if (currentIndex >= items.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">😅</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {personNumber === 2 ? "No Match Found" : "Out of Options"}
          </h1>
          <p className="text-gray-600 mb-8">
            {personNumber === 2 
              ? "Looks like you two have different tastes! Try again with new options."
              : "You've gone through all available options."}
          </p>
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
    <div className="min-h-screen flex flex-col p-6">
      <div className="max-w-md w-full mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">EatWhat</h1>
            <p className="text-sm text-gray-500">
              {personNumber === 1 
                ? `Person 1 • ${swipedRight.length}/5 selected`
                : `Person 2 • Looking for a match...`}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {currentIndex + 1} / {items.length}
          </div>
        </div>

        {/* Swipe Cards */}
        <div className="relative h-[500px] mb-6">
          {items.slice(currentIndex, currentIndex + 2).map((item, index) => (
            <div
              key={item.id}
              className="absolute inset-0"
              style={{
                zIndex: 2 - index,
                transform: `scale(${1 - index * 0.05})`,
                opacity: index === 0 ? 1 : 0.5,
              }}
            >
              {index === 0 && (
                <SwipeCard
                  item={item}
                  onSwipe={handleSwipe}
                  itemType={type === 'cuisine' ? 'cuisine' : 'restaurant'}
                />
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => handleSwipe('left')}
            className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center text-3xl hover:scale-110 transition-transform"
          >
            ❌
          </button>
          <button
            onClick={() => handleSwipe('right')}
            className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center text-3xl hover:scale-110 transition-transform"
          >
            ✅
          </button>
        </div>
      </div>
    </div>
  );
}
