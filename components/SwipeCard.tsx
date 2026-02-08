'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

interface SwipeCardProps {
  item: {
    id: string;
    name: string;
    description?: string | null;
    cuisine_type?: string | null;
    price_range?: string | null;
  };
  onSwipe: (direction: 'left' | 'right') => void;
  itemType: 'cuisine' | 'restaurant';
}

export default function SwipeCard({ item, onSwipe, itemType }: SwipeCardProps) {
  const [exitX, setExitX] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      setExitX(info.offset.x > 0 ? 200 : -200);
      onSwipe(info.offset.x > 0 ? 'right' : 'left');
    }
  };

  const getEmoji = () => {
    if (itemType === 'cuisine') {
      const emojiMap: { [key: string]: string } = {
        'Chinese': '🥟',
        'Indian': '🍛',
        'Japanese': '🍣',
        'Korean': '🍜',
        'Western': '🍔',
        'Thai': '🌶️',
        'Vietnamese': '🍲',
        'Malaysian': '🍜',
        'Italian': '🍝',
        'Mexican': '🌮',
      };
      return emojiMap[item.name] || '🍽️';
    }
    return '🍴';
  };

  return (
    <motion.div
      className="absolute w-full h-full"
      style={{
        x,
        rotate,
        opacity,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={{ x: exitX }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white rounded-3xl shadow-2xl p-8 h-full flex flex-col items-center justify-center text-center cursor-grab active:cursor-grabbing">
        <div className="text-8xl mb-6">{getEmoji()}</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-3">{item.name}</h2>
        
        {itemType === 'restaurant' && item.cuisine_type && (
          <div className="text-sm text-gray-500 mb-2">
            {item.cuisine_type} {item.price_range && `• ${item.price_range}`}
          </div>
        )}
        
        {item.description && (
          <p className="text-gray-600 mt-4 max-w-sm">{item.description}</p>
        )}

        <div className="mt-auto pt-8 flex gap-4 items-center justify-center w-full">
          <div className="flex flex-col items-center">
            <div className="text-4xl mb-2">👈</div>
            <div className="text-xs text-gray-400">Swipe left to pass</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-4xl mb-2">👉</div>
            <div className="text-xs text-gray-400">Swipe right for yes</div>
          </div>
        </div>
      </div>

      {/* Swipe indicators */}
      <motion.div
        className="absolute top-12 left-12 text-6xl font-bold text-red-500 rotate-[-25deg] pointer-events-none"
        style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
      >
        NOPE
      </motion.div>
      <motion.div
        className="absolute top-12 right-12 text-6xl font-bold text-green-500 rotate-[25deg] pointer-events-none"
        style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
      >
        LIKE
      </motion.div>
    </motion.div>
  );
}
