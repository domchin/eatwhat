-- EatWhat Database Schema for Supabase
-- Run this in the Supabase SQL editor

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code TEXT UNIQUE NOT NULL,
  session_type TEXT DEFAULT 'cuisine', -- 'cuisine' or 'mall'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  person1_completed BOOLEAN DEFAULT FALSE,
  person2_completed BOOLEAN DEFAULT FALSE,
  matched_option_id UUID,
  matched_option_type TEXT -- 'cuisine' or 'restaurant'
);

-- Cuisines table
CREATE TABLE IF NOT EXISTS cuisines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Malls table
CREATE TABLE IF NOT EXISTS malls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cuisine_type TEXT,
  mall_id UUID REFERENCES malls(id),
  description TEXT,
  price_range TEXT, -- '$', '$$', '$$$'
  image_url TEXT,
  logo_url TEXT,    -- brand logo (Clearbit or custom CDN URL)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Swipes table
CREATE TABLE IF NOT EXISTS swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  person_number INTEGER NOT NULL,
  option_id UUID NOT NULL,
  option_type TEXT NOT NULL,
  swiped_right BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_swipes_session ON swipes(session_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_mall ON restaurants(mall_id);

-- ─── Seed: Cuisines ───────────────────────────────────────────────────────────
INSERT INTO cuisines (name, description) VALUES
('Chinese',    'From dim sum to roast duck — classic Chinese comfort food'),
('Indian',     'Bold spices, rich curries, and aromatic biryanis'),
('Japanese',   'Sushi, ramen, katsu, and the art of Japanese cooking'),
('Korean',     'BBQ, crispy fried chicken, and bold fermented flavours'),
('Western',    'Burgers, steaks, pastas, and satisfying Western classics'),
('Thai',       'Fragrant, spicy, and sweet — the full Thai spectrum'),
('Vietnamese', 'Light and fresh — pho, banh mi, and rice paper rolls'),
('Malaysian',  'Nasi lemak, laksa, and the rich flavours of Malaysia'),
('Italian',    'Handmade pasta, wood-fired pizza, and Italian soul food'),
('Mexican',    'Tacos, burritos, quesadillas, and bold Mexican flavours')
ON CONFLICT DO NOTHING;

-- ─── Seed: VivoCity Mall ─────────────────────────────────────────────────────
INSERT INTO malls (name, location) VALUES
('VivoCity', '1 HarbourFront Walk, Singapore 098585')
ON CONFLICT DO NOTHING;

-- ─── Seed: VivoCity Restaurants ──────────────────────────────────────────────
-- Clears existing VivoCity restaurants first (idempotent re-run)
DELETE FROM restaurants WHERE mall_id = (SELECT id FROM malls WHERE name = 'VivoCity');

INSERT INTO restaurants (name, cuisine_type, mall_id, price_range, description, logo_url)
SELECT
  r.name,
  r.cuisine_type,
  m.id,
  r.price_range,
  r.description,
  r.logo_url
FROM malls m
CROSS JOIN (VALUES
  -- ── Chinese ──
  ('Din Tai Fung',                     'Chinese',    '$$',  'World-famous for its xiaolongbao and Taiwanese dim sum',                        'https://logo.clearbit.com/dintaifung.com'),
  ('Tim Ho Wan',                       'Chinese',    '$$',  'Michelin Bib Gourmand dim sum — legendary char siu bao',                        NULL),
  ('Crystal Jade Kitchen',             'Chinese',    '$$',  'Authentic Cantonese cuisine and handcrafted dim sum',                            NULL),
  ('Crystal Jade La Mian Xiao Long Bao','Chinese',   '$$',  'Hand-pulled la mian noodles and delicate xiao long bao',                        NULL),
  ('Imperial Treasure Fine Chinese',   'Chinese',    '$$$', 'Premium Cantonese dining with live seafood and classic roasts',                  NULL),
  ('Putien',                           'Chinese',    '$$',  'Michelin-starred Fujian cuisine — try the 100-second la mian',                  NULL),
  ('Paradise Dynasty',                 'Chinese',    '$$',  'Famous for its eight-flavour xiao long bao in stunning colours',                 NULL),
  ('Canton Paradise',                  'Chinese',    '$$',  'Cantonese classics and dim sum in a modern setting',                            NULL),
  ('Hong Kong Kim Gary',               'Hong Kong',  '$',   'Nostalgic HK-style café — baked pork chop rice and milk tea',                   NULL),

  -- ── Japanese ──
  ('Genki Sushi',                      'Japanese',   '$$',  'High-speed conveyor belt sushi with over 100 varieties',                        'https://logo.clearbit.com/genkisushi.com.sg'),
  ('Sakae Sushi',                      'Japanese',   '$',   'Affordable conveyor belt sushi with Japanese favourites',                       NULL),
  ('Sushi Express',                    'Japanese',   '$',   'Budget-friendly sushi on a belt — simple, fresh, fast',                         NULL),
  ('Ichiban Boshi',                    'Japanese',   '$$',  'Set meals and à la carte Japanese cuisine in a relaxed setting',                NULL),
  ('Tonkotsu Kazan Ramen',             'Japanese',   '$$',  'Theatrical volcano ramen — rich pork-bone broth tableside',                     NULL),
  ('Yoshinoya',                        'Japanese',   '$',   'Iconic Japanese beef bowl chain — quick, hearty, and affordable',               'https://logo.clearbit.com/yoshinoya.com'),
  ('MOS Burger',                       'Japanese',   '$',   'Japanese-style burgers with fresh ingredients and unique flavours',              'https://logo.clearbit.com/mos.com.sg'),

  -- ── Korean ──
  ('Nene Chicken',                     'Korean',     '$',   'Crispy Korean fried chicken with signature sauces and sides',                   NULL),
  ('Seoul Garden',                     'Korean',     '$$',  'All-you-can-eat Korean BBQ and hotpot buffet',                                  NULL),
  ('Jjang Korean Noodle Bar',          'Korean',     '$',   'Affordable Korean noodles — jjajangmyeon and spicy ramyeon',                    NULL),

  -- ── Western ──
  ('Shake Shack',                      'Western',    '$$',  'Premium smash burgers, crinkle fries, and frozen custard',                      'https://logo.clearbit.com/shakeshack.com'),
  ('Five Guys',                        'Western',    '$$',  'Loaded burgers with endless free toppings and fresh-cut fries',                 'https://logo.clearbit.com/fiveguys.com'),
  ('McDonald''s',                      'Western',    '$',   'The classic golden arches — burgers, fries, and McFlurries',                    'https://logo.clearbit.com/mcdonalds.com'),
  ('Burger King',                      'Western',    '$',   'Flame-grilled Whopper and fast food favourites',                                'https://logo.clearbit.com/bk.com'),
  ('KFC',                              'Western',    '$',   'Finger-lickin'' original recipe fried chicken',                                 'https://logo.clearbit.com/kfc.com'),
  ('Texas Chicken',                    'Western',    '$',   'Southern-style fried chicken and honey butter biscuits',                        NULL),
  ('Subway',                           'Western',    '$',   'Build-your-own subs with fresh bread and toppings',                             'https://logo.clearbit.com/subway.com'),
  ('Pizza Hut',                        'Western',    '$',   'Classic pan pizzas, pastas, and sides for sharing',                             'https://logo.clearbit.com/pizzahut.com'),
  ('The Soup Spoon',                   'Western',    '$',   'Hearty soups made fresh daily with wholesome ingredients',                      NULL),
  ('Swensen''s',                       'Western',    '$$',  'Sundaes, Earthquake ice cream, and American comfort food',                      NULL),
  ('Fish & Co',                        'Western',    '$$',  'Fresh Atlantic fish and chips served in a skillet',                             NULL),

  -- ── Italian ──
  ('Pastamania',                       'Italian',    '$',   'Pasta and baked rice in generous portions — casual and tasty',                  NULL),
  ('Saizeriya',                        'Italian',    '$',   'Affordable Italian family dining — pizza, pasta, and wine',                     'https://logo.clearbit.com/saizeriya.com'),

  -- ── Fast Food / Local ──
  ('Old Chang Kee',                    'Local',      '$',   'Singapore icon — crispy curry puffs and fried snacks',                          NULL),
  ('Ya Kun Kaya Toast',                'Local',      '$',   'Traditional kaya toast, soft-boiled eggs, and Nanyang coffee',                  NULL),
  ('Toast Box',                        'Local',      '$',   'Classic Singapore breakfast — kaya toast and teh tarik',                        NULL),
  ('Bengawan Solo',                    'Local',      '$',   'Beloved Peranakan cakes and pandan kueh',                                       NULL),
  ('Jollibee',                         'Filipino',   '$',   'The Philippine fast food icon — Chickenjoy and spaghetti',                      'https://logo.clearbit.com/jollibee.com.ph'),
  ('Stuff''d',                         'Fusion',     '$',   'Stuffed burritos and kebab wraps with bold flavour combinations',               NULL)
) AS r(name, cuisine_type, price_range, description, logo_url)
WHERE m.name = 'VivoCity';

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuisines ENABLE ROW LEVEL SECURITY;
ALTER TABLE malls ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow all on sessions"     ON sessions     FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all on swipes"       ON swipes       FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all on cuisines"     ON cuisines     FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all on malls"        ON malls        FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all on restaurants"  ON restaurants  FOR ALL USING (true);
