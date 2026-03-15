'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

interface SwipeCardProps {
  item: {
    id: string;
    name: string;
    description?: string | null;
    cuisine_type?: string | null;
    price_range?: string | null;
    image_url?: string | null;
    logo_url?: string | null;
  };
  onSwipe: (direction: 'left' | 'right') => void;
  itemType: 'cuisine' | 'restaurant';
}

const CUISINE_CONFIG: Record<string, { gradient: string; emoji: string }> = {
  Chinese:    { gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7C59F 100%)', emoji: '🥟' },
  Indian:     { gradient: 'linear-gradient(135deg, #FF9900 0%, #FFD166 100%)', emoji: '🍛' },
  Japanese:   { gradient: 'linear-gradient(135deg, #EF476F 0%, #FFB3C6 100%)', emoji: '🍣' },
  Korean:     { gradient: 'linear-gradient(135deg, #7B2D8B 0%, #C77DFF 100%)', emoji: '🍜' },
  Western:    { gradient: 'linear-gradient(135deg, #1B4332 0%, #52B788 100%)', emoji: '🍔' },
  Thai:       { gradient: 'linear-gradient(135deg, #E63946 0%, #F4A261 100%)', emoji: '🌶️' },
  Vietnamese: { gradient: 'linear-gradient(135deg, #2D6A4F 0%, #95D5B2 100%)', emoji: '🍲' },
  Malaysian:  { gradient: 'linear-gradient(135deg, #D62828 0%, #F77F00 100%)', emoji: '🍜' },
  Italian:    { gradient: 'linear-gradient(135deg, #168AAD 0%, #76C893 100%)', emoji: '🍝' },
  Mexican:    { gradient: 'linear-gradient(135deg, #3A0CA3 0%, #7209B7 100%)', emoji: '🌮' },
  'Hong Kong':{ gradient: 'linear-gradient(135deg, #B5179E 0%, #F72585 100%)', emoji: '🥐' },
  Filipino:   { gradient: 'linear-gradient(135deg, #0077B6 0%, #90E0EF 100%)', emoji: '🍖' },
  Local:      { gradient: 'linear-gradient(135deg, #F77F00 0%, #FCBF49 100%)', emoji: '🍚' },
  Fusion:     { gradient: 'linear-gradient(135deg, #6A0572 0%, #AB83A1 100%)', emoji: '🥘' },
};

const DEFAULT_CONFIG = { gradient: 'linear-gradient(135deg, #FF5252 0%, #FFD166 100%)', emoji: '🍽️' };

const PRICE_LEVELS: Record<string, number> = { '$': 1, '$$': 2, '$$$': 3 };

function PriceIndicator({ price }: { price: string }) {
  const level = PRICE_LEVELS[price] ?? 1;
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <span key={i} style={{ color: i <= level ? '#1C1C1E' : '#D1D5DB', fontWeight: 600 }}>
          $
        </span>
      ))}
    </span>
  );
}

export default function SwipeCard({ item, onSwipe, itemType }: SwipeCardProps) {
  const [logoError, setLogoError] = useState(false);
  const [exitX, setExitX] = useState(0);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-18, 18]);
  const cardOpacity = useTransform(x, [-250, -150, 0, 150, 250], [0, 1, 1, 1, 0]);
  const nopeOpacity = useTransform(x, [-120, -20, 0], [1, 0.3, 0]);
  const likeOpacity = useTransform(x, [0, 20, 120], [0, 0.3, 1]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 90) {
      const dir = info.offset.x > 0 ? 'right' : 'left';
      setExitX(info.offset.x > 0 ? 600 : -600);
      onSwipe(dir);
    }
  };

  const cuisine = item.cuisine_type || item.name;
  const config = CUISINE_CONFIG[cuisine] ?? DEFAULT_CONFIG;
  const logoUrl = !logoError ? (item.logo_url || item.image_url) : null;
  const hasLogo = !!logoUrl;

  return (
    <motion.div
      className="absolute w-full h-full swipe-card"
      style={{ x, rotate, opacity: cardOpacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      animate={{ x: exitX }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="w-full h-full bg-white rounded-3xl overflow-hidden flex flex-col cursor-grab active:cursor-grabbing select-none relative"
           style={{ boxShadow: '0 8px 32px -4px rgba(0,0,0,0.14), 0 4px 12px -2px rgba(0,0,0,0.1)' }}>

        {/* Top visual area */}
        <div
          className="relative flex-shrink-0 flex items-center justify-center"
          style={{
            height: '48%',
            background: hasLogo ? '#F8F8F8' : config.gradient,
          }}
        >
          {hasLogo ? (
            <div className="w-full h-full flex items-center justify-center p-8">
              <img
                src={logoUrl}
                alt={item.name}
                className="max-w-full max-h-full object-contain"
                style={{ maxHeight: '110px', maxWidth: '200px' }}
                onError={() => setLogoError(true)}
              />
            </div>
          ) : (
            <span className="text-[80px] leading-none">{config.emoji}</span>
          )}

          {/* NOPE stamp */}
          <motion.div
            className="absolute top-5 left-5 border-[3px] border-red-500 text-red-500 font-black text-xl px-3 py-1 rounded-xl tracking-[0.15em] pointer-events-none"
            style={{ opacity: nopeOpacity, rotate: -14 }}
          >
            NOPE
          </motion.div>

          {/* LIKE stamp */}
          <motion.div
            className="absolute top-5 right-5 border-[3px] border-emerald-500 text-emerald-500 font-black text-xl px-3 py-1 rounded-xl tracking-[0.15em] pointer-events-none"
            style={{ opacity: likeOpacity, rotate: 14 }}
          >
            LIKE
          </motion.div>
        </div>

        {/* Info area */}
        <div className="flex-1 p-5 flex flex-col overflow-hidden">
          <h2 className="text-[22px] font-black text-gray-900 leading-tight mb-2">
            {item.name}
          </h2>

          <div className="flex flex-wrap gap-2 mb-3">
            {item.cuisine_type && (
              <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600 text-xs font-bold tracking-wide">
                {item.cuisine_type}
              </span>
            )}
            {item.price_range && (
              <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-bold">
                <PriceIndicator price={item.price_range} />
              </span>
            )}
          </div>

          {item.description && (
            <p className="text-gray-500 text-[13px] leading-relaxed line-clamp-3">
              {item.description}
            </p>
          )}

          <div className="mt-auto pt-3 flex justify-between text-[11px] text-gray-300 font-medium">
            <span>← Pass</span>
            <span>Like →</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
