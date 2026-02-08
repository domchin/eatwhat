-- EatWhat Database Schema for Supabase

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  person1_completed BOOLEAN DEFAULT FALSE,
  person2_completed BOOLEAN DEFAULT FALSE,
  matched_option_id UUID,
  matched_option_type TEXT -- 'cuisine' or 'restaurant'
);

-- Cuisines table
CREATE TABLE cuisines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Malls table
CREATE TABLE malls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurants table
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cuisine_type TEXT,
  mall_id UUID REFERENCES malls(id),
  description TEXT,
  price_range TEXT, -- '$', '$$', '$$$'
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Swipes table (tracks user choices)
CREATE TABLE swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  person_number INTEGER NOT NULL, -- 1 or 2
  option_id UUID NOT NULL, -- references either cuisine or restaurant
  option_type TEXT NOT NULL, -- 'cuisine' or 'restaurant'
  swiped_right BOOLEAN NOT NULL, -- true = yes, false = no
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sessions_code ON sessions(session_code);
CREATE INDEX idx_swipes_session ON swipes(session_id);
CREATE INDEX idx_restaurants_mall ON restaurants(mall_id);

-- Insert sample cuisines
INSERT INTO cuisines (name, description) VALUES
('Chinese', 'Traditional and modern Chinese cuisine'),
('Indian', 'North and South Indian dishes'),
('Japanese', 'Sushi, ramen, and Japanese specialties'),
('Korean', 'BBQ, kimchi, and Korean favorites'),
('Western', 'Burgers, steaks, and Western comfort food'),
('Thai', 'Spicy and flavorful Thai dishes'),
('Vietnamese', 'Pho, banh mi, and Vietnamese cuisine'),
('Malaysian', 'Local favorites and Malaysian specialties'),
('Italian', 'Pizza, pasta, and Italian classics'),
('Mexican', 'Tacos, burritos, and Mexican food');

-- Insert VivoCity mall
INSERT INTO malls (name, location) VALUES
('VivoCity', '1 HarbourFront Walk, Singapore 098585');

-- Insert sample restaurants in VivoCity
-- Note: You'll want to replace these with actual VivoCity restaurants
INSERT INTO restaurants (name, cuisine_type, mall_id, price_range, description) 
SELECT 
  restaurant_name,
  cuisine,
  m.id,
  price,
  desc_text
FROM malls m
CROSS JOIN (VALUES
  ('Din Tai Fung', 'Chinese', '$$', 'Famous for xiaolongbao and Taiwanese cuisine'),
  ('Nene Chicken', 'Korean', '$', 'Korean fried chicken'),
  ('Putien', 'Chinese', '$$', 'Fujian cuisine'),
  ('Pastamania', 'Italian', '$', 'Casual Italian pasta'),
  ('Texas Chicken', 'Western', '$', 'Fried chicken and Western fast food'),
  ('Ichiban Boshi', 'Japanese', '$$', 'Japanese restaurant'),
  ('The Soup Spoon', 'Western', '$', 'Soup and sandwiches'),
  ('Old Chang Kee', 'Local', '$', 'Singaporean snacks and curry puffs'),
  ('Subway', 'Western', '$', 'Sandwiches and salads'),
  ('Stuff''d', 'Mexican', '$', 'Burritos and kebabs'),
  ('Imperial Treasure', 'Chinese', '$$$', 'Premium Chinese dining'),
  ('Genki Sushi', 'Japanese', '$$', 'Conveyor belt sushi'),
  ('Hong Kong Kim Gary', 'Hong Kong', '$', 'HK-style cafe'),
  ('Swensen''s', 'Western', '$$', 'Ice cream and Western food'),
  ('Crystal Jade', 'Chinese', '$$', 'Cantonese cuisine')
) AS r(restaurant_name, cuisine, price, desc_text)
WHERE m.name = 'VivoCity';

-- Enable Row Level Security (RLS) - for now we'll keep it simple
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuisines ENABLE ROW LEVEL SECURITY;
ALTER TABLE malls ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all on sessions" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow all on swipes" ON swipes FOR ALL USING (true);
CREATE POLICY "Allow all on cuisines" ON cuisines FOR ALL USING (true);
CREATE POLICY "Allow all on malls" ON malls FOR ALL USING (true);
CREATE POLICY "Allow all on restaurants" ON restaurants FOR ALL USING (true);
